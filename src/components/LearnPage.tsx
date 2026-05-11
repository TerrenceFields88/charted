import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { modules, allLessons, PRE_TRADE_CHECKLIST, type Level } from '@/data/liquidEdgeCurriculum';
import { useLearnProgress } from '@/hooks/useLearnProgress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, CheckCircle2, Circle, Lock, Lightbulb, AlertTriangle, ShieldAlert,
  BookOpenCheck, RotateCcw, Trophy, Flame, ListChecks, GraduationCap, Sparkles,
  ExternalLink, ArrowRight, KeyRound, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCESS_KEY = 'charted-learn-access-v1';
const WHOP_PLAN_URL = 'https://whop.com/checkout/plan_LJPPmg7nvE8OA';

const calloutMap = {
  tip: { icon: Lightbulb, label: 'Tip', classes: 'border-primary/40 bg-primary/5' },
  warn: { icon: AlertTriangle, label: 'Warning', classes: 'border-warning/40 bg-warning/5 text-warning' },
  rule: { icon: ShieldAlert, label: 'Rule', classes: 'border-accent/40 bg-accent/5' },
} as const;

const levelColor: Record<Level, string> = {
  Beginner: 'bg-success/15 text-success border-success/30',
  Intermediate: 'bg-primary/15 text-primary border-primary/30',
  Advanced: 'bg-accent/15 text-accent border-accent/30',
};

type View = { kind: 'home' } | { kind: 'lesson'; id: string } | { kind: 'checklist' };

export const LearnPage = () => {
  const { user } = useAuth();
  const [view, setView] = useState<View>({ kind: 'home' });
  const [hasAccess, setHasAccess] = useState<boolean>(() => {
    try { return localStorage.getItem(ACCESS_KEY) === 'true'; } catch { return false; }
  });
  const { progress, markComplete, setQuiz, reset } = useLearnProgress();

  // Auto-unlock: poll the server for Whop-granted access on mount, on focus,
  // and every 8s while the gate is showing (covers the user returning from Whop).
  const pollRef = useRef<number | null>(null);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const check = async () => {
      const { data, error } = await supabase.rpc('has_learn_access');
      if (!cancelled && !error && data === true) {
        try { localStorage.setItem(ACCESS_KEY, 'true'); } catch {}
        setHasAccess(true);
      }
    };
    check();
    const onFocus = () => check();
    window.addEventListener('focus', onFocus);
    if (!hasAccess) {
      pollRef.current = window.setInterval(check, 8000);
    }
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [user, hasAccess]);

  if (!hasAccess) {
    return (
      <AccessGate
        userId={user?.id ?? null}
        userEmail={user?.email ?? null}
        onConfirm={() => {
          try { localStorage.setItem(ACCESS_KEY, 'true'); } catch {}
          setHasAccess(true);
        }}
      />
    );
  }



  const completedCount = Object.values(progress.completed).filter(Boolean).length;
  const total = allLessons.length;
  const pct = total ? Math.round((completedCount / total) * 100) : 0;
  const xp = Object.values(progress.quizScores).reduce((a, b) => a + b, 0) * 10 + completedCount * 25;
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const xpInLevel = xp % 100;

  const isUnlocked = (prereqs: string[]) => prereqs.every((p) => progress.completed[p]);

  if (view.kind === 'lesson') {
    const idx = allLessons.findIndex((l) => l.id === view.id);
    const next = idx >= 0 && idx < allLessons.length - 1 ? allLessons[idx + 1] : null;
    const nextUnlocked = next ? next.prerequisites.every((p) => progress.completed[p] || p === view.id) : false;
    return (
      <LessonView
        lessonId={view.id}
        onBack={() => setView({ kind: 'home' })}
        onComplete={(id, score) => { setQuiz(id, score); markComplete(id); }}
        completed={progress.completed}
        nextLesson={next && nextUnlocked ? { id: next.id, title: next.title } : null}
        onGoToNext={(id) => setView({ kind: 'lesson', id })}
      />
    );
  }

  if (view.kind === 'checklist') {
    return <ChecklistView onBack={() => setView({ kind: 'home' })} />;
  }

  return (
    <div className="pb-24 min-h-screen overflow-y-auto">
      <div className="sticky top-0 glass border-b border-border/50 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <h1 className="text-lg font-bold tracking-tight">Liquid Edge Course</h1>
          </div>
          <Badge variant="secondary" className="text-[10px]">{completedCount}/{total}</Badge>
        </div>
      </div>

      <div className="px-4 pt-3 space-y-3">
        {/* Player card */}
        <Card className="p-3 flex items-center gap-3">
          <div className="relative h-12 w-12 rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center flex-shrink-0">
            <Trophy className="h-6 w-6 text-primary" />
            <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
              L{level}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Trader Level {level}</span>
              <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" />{xp} XP
              </span>
            </div>
            <Progress value={xpInLevel} className="h-1.5" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>{pct}% complete</span>
              <span>{100 - xpInLevel} XP to L{level + 1}</span>
            </div>
          </div>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-11 gap-1.5"
            onClick={() => setView({ kind: 'checklist' })}
          >
            <ListChecks className="w-4 h-4" /> Pre-Trade Checklist
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-11 gap-1.5 text-muted-foreground"
            onClick={reset}
          >
            <RotateCcw className="w-4 h-4" /> Reset Progress
          </Button>
        </div>

        {/* Modules */}
        <div className="space-y-3 pt-1">
          {modules.map((mod, mi) => {
            const modDone = mod.lessons.filter((l) => progress.completed[l.id]).length;
            const modPct = Math.round((modDone / mod.lessons.length) * 100);
            return (
              <div key={mod.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-primary">M{String(mi + 1).padStart(2, '0')}</span>
                    <h2 className="text-sm font-semibold truncate">{mod.title}</h2>
                  </div>
                  <Badge variant="outline" className={cn('border text-[9px]', levelColor[mod.level])}>{mod.level}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground -mt-1">{mod.description}</p>
                <Progress value={modPct} className="h-1" />
                <div className="grid gap-1.5">
                  {mod.lessons.map((l) => {
                    const done = !!progress.completed[l.id];
                    const unlocked = isUnlocked(l.prerequisites);
                    return (
                      <button
                        key={l.id}
                        disabled={!unlocked}
                        onClick={() => unlocked && setView({ kind: 'lesson', id: l.id })}
                        className={cn(
                          'w-full text-left p-2.5 rounded-xl border bg-card transition-all flex items-center gap-2.5 active:scale-[0.99]',
                          unlocked ? 'hover:border-primary/50' : 'opacity-50',
                        )}
                      >
                        <div className="text-xl flex-shrink-0">{l.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs leading-tight truncate">{l.title}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{l.duration} · {l.quiz.length} quiz</div>
                        </div>
                        {!unlocked ? <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" /> :
                          done ? <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" /> :
                          <Circle className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center text-[10px] text-muted-foreground py-4 flex items-center justify-center gap-1">
          <Flame className="w-3 h-3 text-accent" />
          Sweep · Shift · Pullback — Liquid Edge methodology
        </div>
      </div>
    </div>
  );
};

// --- Lesson View ---
const LessonView = ({
  lessonId, onBack, onComplete, completed, nextLesson, onGoToNext,
}: {
  lessonId: string;
  onBack: () => void;
  onComplete: (id: string, score: number) => void;
  completed: Record<string, boolean>;
  nextLesson: { id: string; title: string } | null;
  onGoToNext: (id: string) => void;
}) => {
  const lesson = allLessons.find((l) => l.id === lessonId);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    if (!lesson) return 0;
    return lesson.quiz.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0);
  }, [answers, lesson]);

  if (!lesson) {
    return (
      <div className="pb-24 min-h-screen p-4 text-center">
        <p className="text-sm text-muted-foreground">Lesson not found.</p>
        <Button onClick={onBack} variant="link">Back</Button>
      </div>
    );
  }

  const passThreshold = Math.max(1, Math.ceil(lesson.quiz.length * 0.7));
  const passed = submitted && score >= passThreshold;
  const isCompleted = completed[lesson.id];

  const handleSubmit = () => {
    setSubmitted(true);
    if (score >= passThreshold) onComplete(lesson.id, score);
  };

  return (
    <div className="pb-24 min-h-screen overflow-y-auto">
      <div className="sticky top-0 glass border-b border-border/50 z-40 px-4 py-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to course
        </button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <Badge variant="outline" className={cn('text-[10px]', levelColor[lesson.level])}>{lesson.level}</Badge>
            <span className="text-[10px] text-muted-foreground">{lesson.duration}</span>
            {isCompleted && <Badge className="bg-success/20 text-success border-success/40 text-[10px]">✓ Completed</Badge>}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">{lesson.emoji}</span>
            <h1 className="text-xl font-bold leading-tight">{lesson.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{lesson.summary}</p>
        </div>

        {/* Sections */}
        {lesson.sections.map((sec, i) => (
          <Card key={i} className="p-4 space-y-2">
            <h2 className="font-semibold text-base leading-snug">{sec.heading}</h2>
            <p className="text-sm text-foreground/85 leading-relaxed">{sec.body}</p>
            {sec.bullets && (
              <ul className="space-y-1.5 pt-1">
                {sec.bullets.map((b, j) => (
                  <li key={j} className="flex gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-foreground/85">{b}</span>
                  </li>
                ))}
              </ul>
            )}
            {sec.callout && (() => {
              const C = calloutMap[sec.callout.type];
              const Icon = C.icon;
              return (
                <div className={cn('rounded-lg border p-3 flex gap-2 mt-2', C.classes)}>
                  <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5 opacity-70">{C.label}</div>
                    <div className="text-sm">{sec.callout.text}</div>
                  </div>
                </div>
              );
            })()}
          </Card>
        ))}

        {/* Key takeaways */}
        <Card className="p-4">
          <h2 className="font-semibold text-base mb-2 flex items-center gap-2">
            <BookOpenCheck className="w-4 h-4 text-primary" /> Key Takeaways
          </h2>
          <ul className="space-y-1.5">
            {lesson.keyTakeaways.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Quiz */}
        <Card className="p-4 space-y-3 border-primary/30">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-warning" /> Checkpoint Quiz
          </h2>
          {lesson.quiz.map((q, qi) => {
            const chosen = answers[qi];
            return (
              <div key={qi} className="space-y-2">
                <p className="text-sm font-medium">{qi + 1}. {q.q}</p>
                <div className="grid gap-1.5">
                  {q.options.map((opt, oi) => {
                    const isAnswer = oi === q.answer;
                    const wasChosen = chosen === oi;
                    return (
                      <button
                        key={oi}
                        onClick={() => !submitted && setAnswers({ ...answers, [qi]: oi })}
                        disabled={submitted}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg border text-sm transition-all active:scale-[0.99]',
                          !submitted && wasChosen && 'border-primary bg-primary/10',
                          !submitted && !wasChosen && 'border-border hover:border-primary/40',
                          submitted && isAnswer && 'border-success bg-success/15',
                          submitted && wasChosen && !isAnswer && 'border-destructive bg-destructive/15',
                          submitted && !wasChosen && !isAnswer && 'opacity-50',
                        )}
                      >
                        <span className="font-mono text-xs mr-2">{String.fromCharCode(65 + oi)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {submitted && (
                  <p className="text-xs text-muted-foreground italic px-1">{q.explain}</p>
                )}
              </div>
            );
          })}

          {!submitted ? (
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < lesson.quiz.length}
              className="w-full"
            >
              Submit Quiz
            </Button>
          ) : (
            <div className={cn(
              'rounded-lg p-3 text-center border',
              passed ? 'border-success/40 bg-success/10' : 'border-destructive/40 bg-destructive/10',
            )}>
              <div className="text-2xl font-bold mb-1">{score} / {lesson.quiz.length}</div>
              <div className={cn('text-xs font-semibold mb-2', passed ? 'text-success' : 'text-destructive')}>
                {passed ? '🎉 Passed — lesson complete!' : `Need ${passThreshold}+ to pass`}
              </div>
              {!passed && (
                <Button size="sm" variant="outline" onClick={() => { setAnswers({}); setSubmitted(false); }}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Try again
                </Button>
              )}
              {passed && (
                <div className="flex flex-col gap-2">
                  {nextLesson ? (
                    <Button size="sm" onClick={() => onGoToNext(nextLesson.id)} className="gap-1.5">
                      Next: {nextLesson.title} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button size="sm" onClick={onBack} className="gap-1.5">
                      <Trophy className="w-3.5 h-3.5" /> Course complete — back to roadmap
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={onBack}>Back to course</Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// --- Pre-trade checklist ---
const groupMeta = {
  Bias: { color: 'text-primary', emoji: '🧭' },
  Setup: { color: 'text-accent', emoji: '🎯' },
  Risk: { color: 'text-success', emoji: '🛡️' },
  Mind: { color: 'text-warning', emoji: '🧠' },
} as const;

const ChecklistView = ({ onBack }: { onBack: () => void }) => {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('charted-pretrade-v1');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  const toggle = (id: string) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    try { localStorage.setItem('charted-pretrade-v1', JSON.stringify(next)); } catch {}
  };

  const total = PRE_TRADE_CHECKLIST.length;
  const done = PRE_TRADE_CHECKLIST.filter((i) => checked[i.id]).length;
  const greenLight = done === total;

  return (
    <div className="pb-24 min-h-screen overflow-y-auto">
      <div className="sticky top-0 glass border-b border-border/50 z-40 px-4 py-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <Card className={cn('p-3 border', greenLight ? 'border-success/50 bg-success/5' : 'border-border')}>
          <div className="flex items-center gap-3">
            {greenLight
              ? <CheckCircle2 className="w-6 h-6 text-success" />
              : <AlertTriangle className="w-6 h-6 text-warning" />}
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Pre-Trade Status</div>
              <div className="text-sm font-bold">{greenLight ? '🟢 Green Light' : 'Not ready yet'}</div>
            </div>
            <div className="text-xl font-bold">{done}/{total}</div>
          </div>
          <Progress value={(done / total) * 100} className="h-1.5 mt-2" />
        </Card>

        {(['Bias', 'Setup', 'Risk', 'Mind'] as const).map((g) => {
          const items = PRE_TRADE_CHECKLIST.filter((i) => i.group === g);
          return (
            <div key={g}>
              <h2 className={cn('text-sm font-bold mb-2 flex items-center gap-1.5', groupMeta[g].color)}>
                <span>{groupMeta[g].emoji}</span> {g}
              </h2>
              <div className="space-y-1.5">
                {items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => toggle(it.id)}
                    className={cn(
                      'w-full text-left p-2.5 rounded-lg border flex gap-2 items-start active:scale-[0.99] transition-all',
                      checked[it.id] ? 'border-primary/60 bg-primary/5' : 'border-border hover:border-primary/40',
                    )}
                  >
                    {checked[it.id]
                      ? <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      : <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />}
                    <div className="min-w-0">
                      <div className="font-medium text-xs">{it.label}</div>
                      <div className="text-[11px] text-muted-foreground">{it.detail}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <Card className="p-4 border-accent/40 bg-accent/5 text-center">
          <div className="text-3xl mb-2">⚡</div>
          <div className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-1">Final Rule</div>
          <p className="text-sm font-medium">"Is this my exact setup, or am I forcing it?"</p>
          <p className="text-xs text-muted-foreground mt-2">If you're forcing it — you don't trade.</p>
        </Card>
      </div>
    </div>
  );
};

// --- Access Gate: confirm Liquid Edge access before showing course ---
const AccessGate = ({
  onConfirm,
  userId,
  userEmail,
}: {
  onConfirm: () => void;
  userId: string | null;
  userEmail: string | null;
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  // Build Whop checkout URL with metadata so the webhook can match the buyer
  // back to this Charted user (by id) or fall back to email.
  const checkoutUrl = useMemo(() => {
    const url = new URL(WHOP_PLAN_URL);
    if (userId) url.searchParams.set('metadata[user_id]', userId);
    if (userEmail) {
      url.searchParams.set('metadata[email]', userEmail);
      // Whop also pre-fills the checkout email field
      url.searchParams.set('email', userEmail);
    }
    return url.toString();
  }, [userId, userEmail]);

  return (
    <div className="pb-24 min-h-screen overflow-y-auto">
      <div className="sticky top-0 glass border-b border-border/50 z-40 px-4 py-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary" />
          <h1 className="text-lg font-bold tracking-tight">Liquid Edge Course</h1>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-4">
        <Card className="p-5 border-primary/30 bg-primary/5 text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/15 border border-primary/40 flex items-center justify-center">
            <KeyRound className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Members-only content</h2>
            <p className="text-sm text-muted-foreground mt-1">
              The Liquid Edge curriculum is gated. Purchase on Whop and your access unlocks here automatically.
            </p>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              {userId
                ? "We'll auto-unlock this tab the moment Whop confirms your purchase — no need to come back and click anything."
                : 'Sign in first so we can auto-unlock this tab the moment your Whop purchase clears.'}
            </p>
          </div>
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold active:scale-[0.99] transition-all"
          >
            Get Access on Whop <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {userId && (
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Watching for your unlock…
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Already a member?
          </div>
          <button
            onClick={() => setAcknowledged(!acknowledged)}
            className="w-full flex items-start gap-2 text-left active:scale-[0.99] transition-all"
          >
            {acknowledged
              ? <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              : <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />}
            <span className="text-sm">
              I confirm I have purchased or been granted access to the Liquid Edge program.
            </span>
          </button>
          <Button
            disabled={!acknowledged}
            onClick={onConfirm}
            className="w-full gap-1.5"
            variant="secondary"
          >
            Unlock manually <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            Misrepresenting access violates the Liquid Edge terms.
          </p>
        </Card>
      </div>
    </div>
  );
};



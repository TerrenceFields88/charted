import { useEffect, useState } from "react";

const KEY = "charted-learn-progress-v1";

export type LearnProgress = {
  completed: Record<string, boolean>;
  quizScores: Record<string, number>;
  lastLessonId?: string;
};

const empty: LearnProgress = { completed: {}, quizScores: {} };

let cached: LearnProgress | null = null;
const listeners = new Set<(p: LearnProgress) => void>();

const load = (): LearnProgress => {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(KEY);
    cached = raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    cached = empty;
  }
  return cached!;
};

const persist = (next: LearnProgress) => {
  cached = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  listeners.forEach((l) => l(next));
};

export function useLearnProgress() {
  const [p, setP] = useState<LearnProgress>(() => load());

  useEffect(() => {
    const fn = (next: LearnProgress) => setP(next);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  return {
    progress: p,
    markComplete: (id: string) =>
      persist({ ...p, completed: { ...p.completed, [id]: true }, lastLessonId: id }),
    setQuiz: (id: string, score: number) =>
      persist({ ...p, quizScores: { ...p.quizScores, [id]: score } }),
    setLastLesson: (id: string) => persist({ ...p, lastLessonId: id }),
    reset: () => persist(empty),
  };
}

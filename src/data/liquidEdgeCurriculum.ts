export type Level = "Beginner" | "Intermediate" | "Advanced";

export type Lesson = {
  id: string;
  title: string;
  emoji: string;
  duration: string;
  level: Level;
  prerequisites: string[];
  summary: string;
  sections: { heading: string; body: string; bullets?: string[]; callout?: { type: "tip" | "warn" | "rule"; text: string } }[];
  keyTakeaways: string[];
  quiz: { q: string; options: string[]; answer: number; explain: string }[];
};

export const modules: { id: string; title: string; description: string; level: Level; lessons: Lesson[] }[] = [
  {
    id: "foundations",
    title: "Foundations",
    description: "Mindset, math, and what day trading actually is.",
    level: "Beginner",
    lessons: [
      {
        id: "what-is-day-trading",
        title: "What Day Trading Actually Is",
        emoji: "🧠",
        duration: "6 min",
        level: "Beginner",
        prerequisites: [],
        summary: "Strip away the myths. Day trading is reacting to repeating patterns inside a single session — not predicting the future.",
        sections: [
          { heading: "The honest definition", body: "Day trading means opening and closing positions within the same trading day to profit from price movement. You never hold overnight, so you avoid gap risk and keep your capital free to react to new opportunities the next session." },
          { heading: "What you are NOT doing", body: "Beginners lose money because they treat trading like fortune telling. You are not predicting the future, you are not guessing, and you are not trying to be 'right.'", bullets: ["You are not a forecaster — you are a reactor.", "You don't need a high win rate to be profitable.", "You don't need to trade every day or every hour."] },
          { heading: "What you ARE doing", body: "You are reacting to a small set of patterns that the market repeats — liquidity sweeps, structure shifts, and pullbacks into imbalance. When the pattern shows, you act. When it doesn't, you wait.", callout: { type: "rule", text: "Your only job is to wait for your setup and execute it the same way every time." } },
        ],
        keyTakeaways: ["Day trading = same-day entries and exits.", "You react to repeating patterns, you don't predict.", "Patience is a position."],
        quiz: [{ q: "What is the core skill of a day trader?", options: ["Predicting tomorrow's news", "Reacting to repeating patterns", "Holding trades for weeks", "Following influencers"], answer: 1, explain: "You react to patterns — sweeps, structure shifts, pullbacks. You never predict." }],
      },
      {
        id: "how-you-make-money",
        title: "How You Actually Make Money",
        emoji: "⚖️",
        duration: "5 min",
        level: "Beginner",
        prerequisites: ["what-is-day-trading"],
        summary: "Profit comes from asymmetric risk-to-reward — small losses, big wins. Win rate is overrated.",
        sections: [
          { heading: "The wrong way", body: "New traders chase a high win rate. They take profits early to 'feel right' and let losers run hoping they'll come back. That math is fatal." },
          { heading: "The right way", body: "Lose small. Win big. If you risk $100 to make $300 (a 1:3 risk-to-reward), you can win only 4 out of 10 trades and still be solidly profitable.", bullets: ["10 trades, lose 6 × $100 = -$600", "10 trades, win 4 × $300 = +$1,200", "Net = +$600 with a 40% win rate"], callout: { type: "tip", text: "Your edge is asymmetry. Protect downside, let upside breathe." } },
        ],
        keyTakeaways: ["Risk-to-reward beats win rate.", "A 40% win rate at 1:3 R is profitable.", "Cutting winners early kills the entire model."],
        quiz: [{ q: "If you risk $100 per trade at 1:3 R and win 4 of 10 trades, your net is:", options: ["-$200", "$0", "+$600", "+$1200"], answer: 2, explain: "4 × $300 = $1,200 wins minus 6 × $100 = $600 losses = +$600." }],
      },
    ],
  },
  {
    id: "market-basics",
    title: "Reading the Market",
    description: "Trend, structure, liquidity, order blocks, and fair value gaps.",
    level: "Beginner",
    lessons: [
      {
        id: "price-movement",
        title: "Trend, Highs & Lows",
        emoji: "📊",
        duration: "7 min",
        level: "Beginner",
        prerequisites: ["how-you-make-money"],
        summary: "Price moves because buyers and sellers compete. Structure tells you who is winning.",
        sections: [
          { heading: "Highs and lows", body: "Every chart is a sequence of peaks (highs) and dips (lows). Reading them in order tells you the trend.", bullets: ["Higher highs + higher lows = uptrend (look for buys)", "Lower highs + lower lows = downtrend (look for sells)", "Mixed = range — stay out unless you're advanced"] },
          { heading: "Why trend matters", body: "Trading with the higher-timeframe trend stacks probability in your favor. Counter-trend trades require near-perfect timing — not a beginner game.", callout: { type: "rule", text: "Bullish bias → only buys. Bearish bias → only sells. Unclear → no trade." } },
        ],
        keyTakeaways: ["Trend is direction.", "Trade with the higher-timeframe trend.", "If the trend is unclear, don't trade."],
        quiz: [{ q: "An uptrend is defined by:", options: ["Equal highs and lows", "Higher highs and higher lows", "Lower highs and lower lows", "Random spikes"], answer: 1, explain: "Higher highs + higher lows = uptrend." }],
      },
      {
        id: "liquidity",
        title: "Liquidity: Where Stops Live",
        emoji: "💧",
        duration: "8 min",
        level: "Beginner",
        prerequisites: ["price-movement"],
        summary: "Liquidity is fuel. The market reaches for it before reversing. Knowing where it sits is your edge.",
        sections: [
          { heading: "What liquidity is", body: "Liquidity = clusters of stop-loss orders and pending orders. It's where the market can transact large size. Big players push price into these zones to fill their orders." },
          { heading: "Where to find it", body: "Mark these every single day before the market opens:", bullets: ["Previous Day High (PDH) and Previous Day Low (PDL)", "Equal highs (buy-side liquidity) and equal lows (sell-side liquidity)", "Obvious swing highs and swing lows on the 1H/4H", "Asia-session high/low for currency and indices"], callout: { type: "tip", text: "Price almost always moves toward liquidity before reversing. Trade the reaction, not the run." } },
        ],
        keyTakeaways: ["Liquidity = stops + pending orders.", "Mark PDH/PDL every day.", "Price hunts liquidity, then reverses."],
        quiz: [{ q: "Liquidity is best described as:", options: ["A type of indicator", "Where stop losses cluster", "A news event", "A timeframe"], answer: 1, explain: "Liquidity sits where stops and pending orders pile up — usually above highs and below lows." }],
      },
      {
        id: "ob-fvg",
        title: "Order Blocks & Fair Value Gaps",
        emoji: "🧱",
        duration: "9 min",
        level: "Intermediate",
        prerequisites: ["liquidity"],
        summary: "OBs and FVGs are your entry zones. They mark where smart money left footprints.",
        sections: [
          { heading: "Order Block (OB)", body: "An order block is the last opposite-color candle before a strong impulsive move. Bullish OB = last bearish candle before a strong rally. Bearish OB = last bullish candle before a strong drop. Price often returns to this candle and reacts." },
          { heading: "Fair Value Gap (FVG)", body: "An FVG is a 3-candle imbalance: the wick of candle 1 doesn't overlap the wick of candle 3. That gap shows price moved too fast — the market often returns to 'fill' it before continuing.", callout: { type: "tip", text: "Combine an OB sitting inside an FVG for the highest-probability entry zone." } },
        ],
        keyTakeaways: ["OB = last opposite candle before an impulse.", "FVG = 3-candle imbalance.", "Entries live inside OBs and FVGs, not at random spots."],
        quiz: [{ q: "A bullish order block is:", options: ["The last bullish candle before a drop", "The last bearish candle before a rally", "Any green candle", "A news candle"], answer: 1, explain: "Bullish OB = last bearish candle before a strong upward move — it's where buyers stepped in." }],
      },
    ],
  },
  {
    id: "the-setup",
    title: "The A+ Setup",
    description: "Your only trade: Sweep → MSS → Pullback.",
    level: "Intermediate",
    lessons: [
      {
        id: "three-step-setup",
        title: "Sweep → MSS → Pullback",
        emoji: "🎯",
        duration: "12 min",
        level: "Intermediate",
        prerequisites: ["ob-fvg"],
        summary: "Three conditions, in order. If any one is missing, there is no trade. Period.",
        sections: [
          { heading: "Step 1 — Liquidity Sweep", body: "Price runs above a previous high (for a sell setup) or below a previous low (for a buy setup) and immediately rejects. This traps breakout traders and fills institutional orders.", callout: { type: "rule", text: "No sweep, no setup. Don't anticipate the sweep — wait for it to happen." } },
          { heading: "Step 2 — Market Structure Shift (MSS)", body: "After the sweep, price must break structure in the opposite direction. For a sell: price breaks the most recent higher low. For a buy: price breaks the most recent lower high. The MSS confirms the reversal." },
          { heading: "Step 3 — Pullback Entry", body: "After the MSS, wait for price to pull back into the OB or FVG that caused the move. Enter there with your stop logically placed beyond the sweep wick.", bullets: ["Never chase — if it doesn't pull back, skip it.", "Stop loss = beyond the sweep high/low.", "Take profit = next opposite liquidity pool."] },
        ],
        keyTakeaways: ["Three steps in order: Sweep, MSS, Pullback.", "Missing one = no trade.", "Entries are at the pullback, not the breakout."],
        quiz: [
          { q: "Which sequence is your A+ setup?", options: ["Pullback → Sweep → MSS", "MSS → Pullback → Sweep", "Sweep → MSS → Pullback", "Sweep → Pullback → MSS"], answer: 2, explain: "Sweep first, then MSS confirms direction, then pullback gives you the entry." },
          { q: "If price sweeps but no MSS forms, you should:", options: ["Enter anyway", "Wait for MSS or skip", "Reverse your bias", "Move to a lower timeframe to force it"], answer: 1, explain: "No MSS = no confirmation. Skip the trade." },
        ],
      },
      {
        id: "mtf-alignment",
        title: "Multi-Timeframe Alignment",
        emoji: "🔭",
        duration: "10 min",
        level: "Intermediate",
        prerequisites: ["three-step-setup"],
        summary: "Bias on HTF, setup on LTF. Stack timeframes to filter low-probability trades.",
        sections: [
          { heading: "Top-down workflow", body: "Use a consistent three-timeframe stack so your bias and execution agree.", bullets: ["Daily / 4H — directional bias and key levels (PDH/PDL, weekly high/low)", "1H / 15m — narrative: where is price going, where is liquidity?", "5m / 1m — execution: sweep, MSS, pullback entry"] },
          { heading: "Alignment rule", body: "Take the LTF setup only if it points the same direction as the HTF bias.", callout: { type: "rule", text: "If HTF says bullish and your LTF triggers a sell — skip. Counter-bias trades belong to advanced players only." } },
        ],
        keyTakeaways: ["HTF = bias, LTF = trigger.", "Three-timeframe stack filters noise.", "When timeframes disagree, the trade doesn't exist."],
        quiz: [{ q: "What is the HTF used for?", options: ["Entry timing", "Directional bias", "Stop placement", "Quick scalps"], answer: 1, explain: "HTF defines bias and key levels. LTF is for execution." }],
      },
      {
        id: "session-timing",
        title: "Sessions, Killzones & News",
        emoji: "⏰",
        duration: "9 min",
        level: "Intermediate",
        prerequisites: ["three-step-setup"],
        summary: "When you trade matters as much as what you trade. Most A+ setups happen in narrow windows.",
        sections: [
          { heading: "The killzones", body: "Volatility — and clean setups — cluster around session opens.", bullets: ["London Killzone: 02:00–05:00 EST (FX, indices)", "New York AM Killzone: 08:30–11:00 EST (US indices, stocks)", "London Close: 10:00–11:00 EST (reversals)", "Avoid lunch: 12:00–14:00 EST is choppy"] },
          { heading: "News filter", body: "High-impact news (CPI, NFP, FOMC, earnings) creates explosive moves but destroys clean structure. Either flat-out skip the 5 minutes around the release, or wait for the post-news sweep + MSS.", callout: { type: "warn", text: "Never enter blind into red-folder news. The slippage alone can blow your stop." } },
        ],
        keyTakeaways: ["Trade the killzones, not all day.", "Skip lunch chop.", "Respect the news calendar."],
        quiz: [{ q: "The New York AM killzone is roughly:", options: ["02:00–05:00 EST", "08:30–11:00 EST", "12:00–14:00 EST", "20:00–22:00 EST"], answer: 1, explain: "NY AM killzone runs from the open through ~11:00 EST." }],
      },
    ],
  },
  {
    id: "execution",
    title: "Execution & Risk",
    description: "Risk per trade, stop placement, and the take-profit ladder.",
    level: "Intermediate",
    lessons: [
      {
        id: "risk-management",
        title: "Risk Management",
        emoji: "💰",
        duration: "8 min",
        level: "Beginner",
        prerequisites: ["how-you-make-money"],
        summary: "Risk is the only thing you fully control. Fix it and never let emotion change it.",
        sections: [
          { heading: "Fixed risk per trade", body: "Risk $60–$120 per trade, full stop. Position size is calculated from stop distance and risk — not from how confident you feel.", bullets: ["Position size = Risk $ ÷ (Entry – Stop) × point value", "Use the same risk on every trade so losses are flat and comparable.", "Smaller account? Scale risk down to 1% of equity."] },
          { heading: "Stop loss rules", body: "Stops go beyond structure — past the sweep wick or beyond the OB. Set them BEFORE you enter, attached to the order.", callout: { type: "rule", text: "You may move a stop to breakeven. You may NEVER move it further away." } },
        ],
        keyTakeaways: ["Risk is fixed in dollars.", "Stop is placed before entry.", "Never widen a stop."],
        quiz: [{ q: "When can you move your stop loss?", options: ["Further away if you feel right", "Closer to breakeven once in profit", "Anywhere, anytime", "Only after TP2"], answer: 1, explain: "Stops can only move toward breakeven, never further from entry." }],
      },
      {
        id: "take-profit",
        title: "The Take-Profit Ladder",
        emoji: "📈",
        duration: "7 min",
        level: "Intermediate",
        prerequisites: ["risk-management", "three-step-setup"],
        summary: "Three exits: TP1 removes risk, TP2 banks profit, the runner pays for everything.",
        sections: [
          { heading: "TP1 — Take partial at 1R", body: "When price moves 1× your risk in your favor, close 30–50% of the position and move your stop to breakeven. Risk is now zero." },
          { heading: "TP2 — Bank at 2R–3R", body: "Close another portion at 2R or at the next liquidity pool. You've locked in a winning trade." },
          { heading: "Runner — Let it breathe", body: "Leave the final 20–30% open with a trailing stop or a target at the next major HTF level. This is where outsized wins come from. Most traders kill their runner — don't.", callout: { type: "tip", text: "One runner that hits 5R can pay for ten losing trades." } },
        ],
        keyTakeaways: ["TP1 = risk free.", "TP2 = locked profit.", "Runner = outsized win."],
        quiz: [{ q: "What happens at TP1?", options: ["Close everything", "Take partial + move stop to breakeven", "Add to the trade", "Reverse"], answer: 1, explain: "Partial out + breakeven stop removes risk and lets the rest run." }],
      },
      {
        id: "advanced-execution",
        title: "Advanced Execution: Scaling, Re-Entries & Trail Logic",
        emoji: "⚙️",
        duration: "11 min",
        level: "Advanced",
        prerequisites: ["take-profit", "mtf-alignment"],
        summary: "Once the basic ladder is automatic, sharpen edges with scaling and structured re-entries.",
        sections: [
          { heading: "Scaling in (only after MSS confirmation)", body: "Split entry into two clips: 50% at first OB/FVG touch, 50% on a lower-timeframe confirmation (1m MSS or break of micro structure). Total risk stays the same — the stop sits beyond the original sweep." },
          { heading: "Structured re-entries", body: "If your first trade is stopped at the sweep extreme but the HTF idea is still valid, allow ONE re-entry on a fresh LTF MSS. Two stop-outs on the same idea = the idea is wrong, walk away.", callout: { type: "warn", text: "Re-entries are a privilege, not a habit. Log them separately so you can audit if they actually add edge." } },
          { heading: "Structure-based trailing", body: "Trail the runner under each new higher-low (longs) or above each new lower-high (shorts) on your execution timeframe. Not a fixed pip trail — a structural one. You exit when structure breaks, not when noise hits a number." },
        ],
        keyTakeaways: ["Scale in on confirmation, not hope.", "Max one re-entry per idea.", "Trail by structure, not by ticks."],
        quiz: [{ q: "How many re-entries do you allow on the same idea?", options: ["Unlimited", "One", "Three", "Zero"], answer: 1, explain: "One disciplined re-entry on fresh confirmation. Two stop-outs = idea is invalid." }],
      },
      {
        id: "prop-firm-risk",
        title: "Prop Firm & Account Tier Risk",
        emoji: "🏦",
        duration: "9 min",
        level: "Advanced",
        prerequisites: ["risk-management"],
        summary: "Funded accounts have rules that punish normal trading habits. Adapt or fail the eval.",
        sections: [
          { heading: "Daily and trailing drawdowns", body: "Most prop firms enforce a daily loss limit (e.g. 5%) and a max trailing drawdown (e.g. 10%). One revenge day = blown account.", bullets: ["Risk per trade ≤ 0.5% of account on evals", "Cap daily loss at 2% — well below firm's 5%", "Stop trading after first winning day to lock equity"] },
          { heading: "Consistency rules", body: "Many firms void payouts if a single day exceeds 30–50% of total profit. Spread profits across days — don't go for the home-run.", callout: { type: "rule", text: "Trade the firm's rules first, the market second. Edge means nothing if you violate the contract." } },
        ],
        keyTakeaways: ["Risk less than the firm allows.", "Spread profit across days for consistency.", "Rules > Edge on funded capital."],
        quiz: [{ q: "On a prop eval, your daily risk should be:", options: ["At the firm's max", "Roughly half the firm's max", "Whatever feels good", "0%"], answer: 1, explain: "Trade well below the firm's daily limit so one bad day can't disqualify you." }],
      },
    ],
  },
  {
    id: "advanced-edge",
    title: "Advanced Edge",
    description: "Statistical thinking, correlation, journaling analytics, and edge stacking.",
    level: "Advanced",
    lessons: [
      {
        id: "statistical-edge",
        title: "Thinking in Probabilities",
        emoji: "🎲",
        duration: "10 min",
        level: "Advanced",
        prerequisites: ["take-profit"],
        summary: "Each trade is a sample. Edge is a distribution, not a guarantee. Stop reacting to single outcomes.",
        sections: [
          { heading: "Expectancy", body: "Expectancy = (WinRate × AvgWin) − (LossRate × AvgLoss). At 45% WR and 1:3 R, expectancy is +0.8R per trade. 100 trades = +80R of expected return — even though ~55% of individual trades will lose." },
          { heading: "Variance & sample size", body: "Even a +0.8R system regularly suffers 6–8 trade losing streaks. That's math, not failure. Judge the system over 50–100 trade samples — never on the last 5.", callout: { type: "tip", text: "Detach from the next trade. Commit to executing 100 trades exactly the same way, then evaluate." } },
        ],
        keyTakeaways: ["Edge = positive expectancy.", "Losing streaks are normal.", "Evaluate over 50–100 trades, not 5."],
        quiz: [{ q: "Expectancy per trade at 45% WR and 1:3 R is approximately:", options: ["−0.5R", "0R", "+0.8R", "+2R"], answer: 2, explain: "0.45×3 − 0.55×1 = 1.35 − 0.55 = +0.8R per trade." }],
      },
      {
        id: "correlation-confluence",
        title: "Correlation & Inter-Market Confluence",
        emoji: "🔗",
        duration: "9 min",
        level: "Advanced",
        prerequisites: ["mtf-alignment"],
        summary: "Markets move together. Use correlated assets to confirm or veto your bias.",
        sections: [
          { heading: "Common pairs", body: "Track the assets that lead or lag the one you trade.", bullets: ["NQ & ES move together — divergence is a tell", "DXY inversely correlates with EURUSD, GBPUSD, gold", "Bond yields lead growth-stock direction", "Risk-on / risk-off: SPX up + VIX down = clean bullish tape"] },
          { heading: "Confluence test", body: "Before pulling the trigger, glance at the correlated chart. If it's already in the direction of your trade — green light. If it's flat or contradicting — pause.", callout: { type: "warn", text: "Correlation is supportive evidence, not the setup itself. Never trade correlation in isolation." } },
        ],
        keyTakeaways: ["Markets move in clusters.", "Use correlation as a filter.", "Contradicting correlation = stand aside."],
        quiz: [{ q: "DXY and EURUSD are typically:", options: ["Positively correlated", "Inversely correlated", "Uncorrelated", "Identical"], answer: 1, explain: "A stronger dollar (DXY up) usually pushes EURUSD down." }],
      },
      {
        id: "journal-analytics",
        title: "Journal Analytics: Finding Your Real Edge",
        emoji: "📊",
        duration: "10 min",
        level: "Advanced",
        prerequisites: ["statistical-edge"],
        summary: "Your journal is a dataset. Slice it to find which conditions actually produce profit.",
        sections: [
          { heading: "What to tag", body: "Every trade gets standardized tags so you can filter later.", bullets: ["Session (London / NY AM / NY PM)", "Setup quality (A+ / B / forced)", "HTF bias (with / against / unclear)", "News context (red folder nearby? Y/N)", "Emotion state (calm / FOMO / revenge)"] },
          { heading: "The monthly slice", body: "Once a month, group results by tag. You'll typically find: one session pays the bills, B-grade setups are net negative, and 'against bias' trades have negative expectancy. Cut what loses, double down on what wins.", callout: { type: "tip", text: "The fastest way to grow your edge is to delete trades, not add them." } },
        ],
        keyTakeaways: ["Tag everything consistently.", "Group results monthly to find your edge.", "Eliminating losing buckets is the highest-ROI work."],
        quiz: [{ q: "The fastest way to grow expectancy is usually to:", options: ["Add new setups", "Trade more often", "Cut the worst-performing trade buckets", "Increase risk"], answer: 2, explain: "Most traders find one or two tag buckets bleeding their edge. Removing them lifts the whole curve." }],
      },
    ],
  },
  {
    id: "discipline",
    title: "Discipline & Routine",
    description: "Pre-market checklist, daily limits, journaling, weekly review.",
    level: "Beginner",
    lessons: [
      {
        id: "pre-market",
        title: "Pre-Market Routine",
        emoji: "🌅",
        duration: "6 min",
        level: "Beginner",
        prerequisites: ["liquidity"],
        summary: "If you don't have a plan before the bell, you don't trade.",
        sections: [
          { heading: "The 3 questions", body: "Every morning, before you click anything:", bullets: ["What is the higher-timeframe trend? (Daily / 4H)", "Where is liquidity sitting? (Above? Below?)", "What is my exact plan? (Entry zone, stop, TPs)"] },
          { heading: "Mark your levels", body: "Draw PDH, PDL, Asia high/low, and any obvious 4H swing highs/lows. Highlight the OB or FVG you'd want to enter from.", callout: { type: "rule", text: "If you can't answer the 3 questions, you do not have a trade today." } },
        ],
        keyTakeaways: ["Plan before market open.", "Mark levels, identify the trade.", "No plan = no trade."],
        quiz: [{ q: "Before any trading day you must:", options: ["Watch financial news", "Answer the 3 pre-market questions", "Open as many charts as possible", "Trade the open immediately"], answer: 1, explain: "Trend, liquidity, plan. If any are unclear, stand aside." }],
      },
      {
        id: "daily-rules",
        title: "Daily Rules That Save Your Account",
        emoji: "🛑",
        duration: "5 min",
        level: "Beginner",
        prerequisites: ["pre-market"],
        summary: "Hard limits prevent the one bad day that ends careers.",
        sections: [
          { heading: "Non-negotiable limits", body: "These are not suggestions. They are wired into your platform if possible.", bullets: ["Maximum 3 trades per day", "2 losses in a row → stop for the day", "Daily loss limit: $300 → platform off", "No trading the first 5 minutes after major news"], callout: { type: "rule", text: "When the limit hits, the day is over. No 'one more trade.'" } },
        ],
        keyTakeaways: ["Cap trades per day.", "Stop after 2 consecutive losses.", "Hit max loss → stop, journal, walk away."],
        quiz: [{ q: "After 2 losses in a row you should:", options: ["Double size to recover", "Stop trading for the day", "Switch to a new strategy", "Try a longer timeframe"], answer: 1, explain: "Two reds = mental capital is depleted. Stop and review." }],
      },
      {
        id: "journal-review",
        title: "Journaling & Weekly Review",
        emoji: "📓",
        duration: "6 min",
        level: "Intermediate",
        prerequisites: ["daily-rules"],
        summary: "Improvement comes from honest review, not more screen time.",
        sections: [
          { heading: "After every trade", body: "Log it immediately while it's fresh.", bullets: ["Screenshot entry and exit", "Setup type (sweep + MSS + OB / FVG)", "Risk-to-reward planned vs achieved", "Emotion before, during, after", "Did I follow every rule? Yes / No"] },
          { heading: "Weekly review", body: "Saturday morning, 30 minutes. Look at all trades together.", bullets: ["What worked?", "What mistake repeats?", "Were losses from setup or behavior?", "Pick ONE thing to fix next week."], callout: { type: "tip", text: "Fix one repeating mistake per week. In 12 weeks you're a different trader." } },
        ],
        keyTakeaways: ["Journal every trade.", "Review weekly.", "Fix one mistake at a time."],
        quiz: [{ q: "How many things should you focus on fixing each week?", options: ["Everything", "One", "Three to five", "None — just trade"], answer: 1, explain: "One focused fix per week compounds. Trying to fix everything fixes nothing." }],
      },
      {
        id: "mistakes",
        title: "Common Mistakes to Avoid",
        emoji: "🚫",
        duration: "5 min",
        level: "Beginner",
        prerequisites: ["daily-rules"],
        summary: "These behaviors blow accounts. Recognize them in yourself before they cost you.",
        sections: [
          { heading: "The killer list", body: "Every losing trader does these. Every profitable trader stopped doing them.", bullets: ["Trading without a plan", "Entering before all 3 setup conditions", "Moving the stop further away", "Adding to a losing trade", "Revenge trading after a loss", "Trading out of boredom", "Forcing trades because you 'need' a winner"], callout: { type: "rule", text: "Before every entry: 'Is this my exact setup, or am I forcing it?' If forcing — don't trade." } },
        ],
        keyTakeaways: ["Discipline > prediction.", "The final filter is honesty.", "Forcing a trade is the most expensive habit in trading."],
        quiz: [{ q: "The single most important question before any trade:", options: ["Is the news bullish?", "Is this my exact setup or am I forcing it?", "Is my friend in the trade?", "Is the market open?"], answer: 1, explain: "If you're forcing it, the trade is already losing — your edge requires the setup, not a hope." }],
      },
    ],
  },
];

export const allLessons = modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title })));

export const findLesson = (id: string) => allLessons.find((l) => l.id === id);

export const PRE_TRADE_CHECKLIST: { id: string; label: string; detail: string; group: "Bias" | "Setup" | "Risk" | "Mind" }[] = [
  { id: "htf-bias", label: "HTF bias is clear (Daily/4H)", detail: "Higher highs+lows = bullish. Lower highs+lows = bearish. Mixed = no trade.", group: "Bias" },
  { id: "levels-marked", label: "PDH, PDL, Asia & key swings marked", detail: "Liquidity zones drawn before market open.", group: "Bias" },
  { id: "in-killzone", label: "Inside a killzone (London / NY AM)", detail: "Avoid lunch chop and dead sessions.", group: "Bias" },
  { id: "news-clear", label: "No red-folder news in next 15 min", detail: "Skip the 5 min around CPI, NFP, FOMC, earnings.", group: "Bias" },
  { id: "sweep", label: "Liquidity sweep happened", detail: "Price ran a prior high/low and rejected. Don't anticipate it.", group: "Setup" },
  { id: "mss", label: "Market Structure Shift confirmed", detail: "Opposite-direction break of last HL (sells) or LH (buys).", group: "Setup" },
  { id: "pullback-zone", label: "Pullback into OB / FVG", detail: "Entry zone identified — never chase the impulse.", group: "Setup" },
  { id: "mtf-aligned", label: "LTF trigger matches HTF bias", detail: "If they disagree, the trade does not exist.", group: "Setup" },
  { id: "stop-defined", label: "Stop placed beyond sweep wick", detail: "Pre-attached to the order, not adjusted later.", group: "Risk" },
  { id: "risk-fixed", label: "Risk = fixed $ amount (≤ $120 / 1%)", detail: "Position size derived from stop distance, not feelings.", group: "Risk" },
  { id: "rr-ok", label: "Reward-to-risk is at least 1:3", detail: "Next opposite liquidity is far enough to justify the stop.", group: "Risk" },
  { id: "tp-ladder", label: "TP1 / TP2 / Runner targets set", detail: "Partial at 1R, bank at 2–3R, runner to next HTF level.", group: "Risk" },
  { id: "trades-left", label: "Under daily trade cap (max 3) and not on tilt", detail: "Not 2 losses in a row. Not chasing back a loss.", group: "Mind" },
  { id: "not-forcing", label: "Honest answer: I am NOT forcing this", detail: "If forcing — do not trade. Period.", group: "Mind" },
];

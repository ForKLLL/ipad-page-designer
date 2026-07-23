import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeBalance } from "@/lib/analyze.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BalancE — Where does your balance land?" },
      {
        name: "description",
        content:
          "An 11-question reflection on balance and imbalance. Find the shade of grey that maps to your current inner state.",
      },
      { property: "og:title", content: "BalancE — Where does your balance land?" },
      {
        property: "og:description",
        content: "An 11-question reflection on balance and imbalance. Find the shade of grey that maps to your current inner state.",
      },
    ],
  }),
  component: BalancEApp,
});

type Question = {
  prompt: string;
  options: string[];
  tiers: number[];
};

type Lang = "zh" | "en";

const QUESTIONS_ZH: Question[] = [
  {
    prompt: "你負責的重要項目在最後關頭突然出現重大失誤，一般而言你怎樣應對?",
    options: [
      "馬上切斷所有個人情緒，進入絕對理性的狀態",
      "內心非常焦慮，但表面上硬撐著，全憑意志力默默忍受並解決問題",
      "覺得出事很正常，計畫本來就趕不上變化，直接順應當下情況去應變",
      "認為沒必要自己死頂，直接向身邊的人尋求協助，大家一起想辦法",
    ],
    tiers: [20, 40, 70, 90],
  },
  {
    prompt: "在團隊合作中，你通常扮演的角色是：",
    options: [
      "決策者，決定計劃的方針",
      "執行的中流砥柱，負責具體而務實的工作",
      "調解者，平衡各方情緒與利益",
      "靈感發起人，帶動輕鬆積極的氛圍",
    ],
    tiers: [10, 30, 60, 90],
  },
  {
    prompt: "當你需要做出個人的重要決定時，你的傾向是：",
    options: [
      "獨自深思，不與任何人討論",
      "收集客觀事實，按邏輯判斷",
      "參考少量可信賴的意見後自己權衡",
      "廣泛征求他人看法，再結合直覺選擇",
    ],
    tiers: [10, 30, 60, 90],
  },
  {
    prompt: "你傾向如何處理內心對「失控」的恐懼?",
    options: [
      "建立嚴格的自我規則，盡量不讓自己陷入未知",
      "提前做好多種方案，用準備來抵消不安",
      "接受部分不可控，只關注自己能影響的",
      "認為失控也是體驗的一部分，願意擁抱",
    ],
    tiers: [10, 30, 70, 100],
  },
  {
    prompt: "你更喜歡哪種社交狀態?",
    options: [
      "極少社交，保留絕對的個人空間",
      "選擇性社交，只與少數深交的人保持聯繫",
      "適度社交，既有親密關係也有普通社交",
      "廣泛社交，喜歡新鮮面孔和輕鬆交流",
    ],
    tiers: [0, 30, 70, 100],
  },
  {
    prompt: "你對「悲傷」或「低落」情緒的態度是：",
    options: [
      "它們是力量的一部分，我願意獨自沉浸其中",
      "需要理性地管控，不應影響生活秩序",
      "可以短暫停留，然後溫和地讓它離開",
      "傾向於用快樂活動快速轉移注意力",
    ],
    tiers: [0, 30, 70, 90],
  },
  {
    prompt: "當你處於完全獨處、無事可做的狀態，你通常會：",
    options: [
      "沉浸於內心世界，思緒翻湧或放空",
      "規劃接下來的事，保持有序",
      "放鬆但不放縱，享受安靜的自我時間",
      "感到不適，會主動找事做或聯絡他人",
    ],
    tiers: [10, 40, 70, 100],
  },
  {
    prompt: "如果你寫日記，內容風格更可能是：",
    options: [
      "隱秘的，充滿隱喻和深層情緒",
      "規律的事件記錄與反思",
      "日常的所見所聞，語氣平和",
      "輕快的清單或零星靈感",
    ],
    tiers: [0, 30, 60, 90],
  },
  {
    prompt: "面對他人的強烈情緒(如憤怒或哭泣)，你通常：",
    options: [
      "保持沉默，不介入也不回應",
      "理性分析原因，提出解決方案",
      "主動傾聽，同理對方情緒，以陪伴回應對方",
      "嘗試用輕鬆話題化解對方情緒",
    ],
    tiers: [10, 30, 70, 90],
  },
  {
    prompt: "你理想中的「內心平靜」更像：",
    options: [
      "深海的寂靜，表面無波但內有暗流",
      "湖面的鏡面，清晰映照一切",
      "溪流的潺潺，持續而柔和",
      "晴空的通透，無雲也無風",
    ],
    tiers: [10, 40, 70, 100],
  },
];

const QUESTIONS_EN: Question[] = [
  {
    prompt: "A critical project you lead suddenly hits a major failure at the last moment. What do you typically do?",
    options: [
      "Cut off all personal emotion immediately and enter a purely rational mode.",
      "Feel intensely anxious inside, but keep it together on the surface and push through by sheer will.",
      "Accept that things go wrong — plans never survive contact with reality — and adapt to whatever's in front of me.",
      "See no point in shouldering it alone; ask people around me for help and figure it out together.",
    ],
    tiers: [20, 40, 70, 90],
  },
  {
    prompt: "In a team, the role you usually play is:",
    options: [
      "The decision-maker who sets the direction.",
      "The reliable executor doing the concrete, practical work.",
      "The mediator who balances everyone's emotions and interests.",
      "The spark who brings ideas and keeps the mood light and energetic.",
    ],
    tiers: [10, 30, 60, 90],
  },
  {
    prompt: "When facing a significant personal decision, you tend to:",
    options: [
      "Think it through alone, without discussing it with anyone.",
      "Collect objective facts and judge by logic.",
      "Consult a few trusted voices, then weigh it myself.",
      "Ask widely for others' views, then follow my intuition.",
    ],
    tiers: [10, 30, 60, 90],
  },
  {
    prompt: "How do you handle your fear of losing control?",
    options: [
      "Build strict rules for myself to keep the unknown out.",
      "Prepare multiple contingency plans; readiness offsets unease.",
      "Accept that some things are uncontrollable and focus on what I can affect.",
      "See loss of control as part of experience — I'm willing to embrace it.",
    ],
    tiers: [10, 30, 70, 100],
  },
  {
    prompt: "Which mode of socializing suits you best?",
    options: [
      "Very little; I guard my personal space absolutely.",
      "Selective — I stay in touch with only a few close people.",
      "Moderate — a mix of close relationships and casual contact.",
      "Wide-open — I enjoy new faces and easy conversation.",
    ],
    tiers: [0, 30, 70, 100],
  },
  {
    prompt: "Your attitude toward sadness or low moods is:",
    options: [
      "They're part of my strength; I'm willing to sit alone inside them.",
      "They need to be managed rationally and not disturb daily order.",
      "They can stay a while, then I let them leave gently.",
      "I prefer to shift attention quickly through something cheerful.",
    ],
    tiers: [0, 30, 70, 90],
  },
  {
    prompt: "When you're completely alone with nothing to do, you usually:",
    options: [
      "Sink into your inner world — thoughts churning or drifting into blankness.",
      "Plan what's next and keep things ordered.",
      "Relax without indulging; enjoy the quiet time with yourself.",
      "Feel uneasy and reach for something to do or someone to talk to.",
    ],
    tiers: [10, 40, 70, 100],
  },
  {
    prompt: "If you kept a journal, its style would most likely be:",
    options: [
      "Private and dense, full of metaphor and deep emotion.",
      "A steady log of events and reflections.",
      "Everyday observations in an even, calm voice.",
      "Light lists or scattered sparks of inspiration.",
    ],
    tiers: [0, 30, 60, 90],
  },
  {
    prompt: "Facing someone else's strong emotion (anger, tears), you usually:",
    options: [
      "Stay silent — neither intervening nor responding.",
      "Analyze the cause rationally and propose a solution.",
      "Listen actively, empathize, and respond through presence.",
      "Try to lighten the mood with an easier topic.",
    ],
    tiers: [10, 30, 70, 90],
  },
  {
    prompt: "Your ideal 'inner calm' is more like:",
    options: [
      "The stillness of the deep sea — calm surface, hidden currents below.",
      "A mirror-flat lake, reflecting everything clearly.",
      "A murmuring stream — continuous and gentle.",
      "A clear sky — no clouds, no wind.",
    ],
    tiers: [10, 40, 70, 100],
  },
];

function getQuestions(lang: Lang): Question[] {
  return lang === "en" ? QUESTIONS_EN : QUESTIONS_ZH;
}

const FREE_PROMPT: Record<Lang, string> = {
  zh: "請用一段話描述你心中理想的「平衡」狀態。可以是一個場景、一種感覺、一個比喻，或者你曾經體驗過的某個瞬間。",
  en: "In a short paragraph, describe your ideal state of 'balance.' It can be a scene, a feeling, a metaphor, or a moment you've actually experienced.",
};

const FREE_PLACEHOLDER: Record<Lang, string> = {
  zh: "平衡是……",
  en: "Balance is…",
};

const RESULT_TITLE: Record<Lang, string> = {
  zh: "分析結果",
  en: "Your Result",
};

const ERROR_TITLE: Record<Lang, string> = {
  zh: "分析暫時無法完成",
  en: "Analysis couldn't finish",
};

type Shade = {
  bValue: number;
  hex: string;
  name: string;
  tagline: string;
};

const SHADES: Shade[] = [
  { bValue: 0, hex: "#000000", name: "純黑", tagline: "厚重、內斂" },
  { bValue: 10, hex: "#1A1A1A", name: "極深灰", tagline: "沉穩、韌性" },
  { bValue: 20, hex: "#333333", name: "暗灰", tagline: "誠懇、克制" },
  { bValue: 30, hex: "#4D4D4D", name: "中暗灰", tagline: "堅忍、務實" },
  { bValue: 40, hex: "#666666", name: "中灰", tagline: "穩健、緩衝" },
  { bValue: 50, hex: "#808080", name: "標準灰", tagline: "平和、中立" },
  { bValue: 60, hex: "#999999", name: "中淺灰", tagline: "從容、接納" },
  { bValue: 70, hex: "#B3B3B3", name: "淺灰", tagline: "溫和、秩序" },
  { bValue: 80, hex: "#CCCCCC", name: "明灰", tagline: "明快、效率" },
  { bValue: 90, hex: "#E6E6E6", name: "極淺灰", tagline: "輕盈、淡然" },
  { bValue: 100, hex: "#FFFFFF", name: "純白", tagline: "純粹、疏離" },
];

function shadeForB(b: number): Shade {
  const snapped = Math.max(0, Math.min(100, Math.round(b / 10) * 10));
  return SHADES.find((s) => s.bValue === snapped) ?? SHADES[5];
}

function formatDDMM(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

type SavedResult = {
  id: string;
  b_value: number;
  shade_name: string;
  hex: string;
  analysis: string;
  created_at?: string;
};

type Stage =
  | { kind: "intro" }
  | { kind: "question"; index: number }
  | { kind: "free" }
  | { kind: "loading" }
  | { kind: "result"; bValue: number; analysis: string; savedId?: string }
  | { kind: "gallery" }
  | { kind: "error"; message: string };

const BG = "#f2efee";
const INK = "#0b0b0b";

function BalancEApp() {
  const [stage, setStage] = useState<Stage>({ kind: "intro" });
  const [lang, setLang] = useState<Lang>("zh");
  const questions = getQuestions(lang);
  const [answers, setAnswers] = useState<number[]>(() => Array(QUESTIONS_ZH.length).fill(-1));
  const [freeText, setFreeText] = useState("");
  const analyze = useServerFn(analyzeBalance);

  useEffect(() => {
    if (stage.kind !== "loading") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await analyze({
          data: {
            answers,
            freeText,
            lang,
            questions: questions.map((q) => ({
              prompt: q.prompt,
              options: q.options,
              tiers: q.tiers,
            })),
          },
        });
        if (cancelled) return;
        const shade = shadeForB(res.bValue);
        // persist to shared gallery (best-effort)
        let savedId: string | undefined;
        try {
          const { data } = await supabase
            .from("results")
            .insert({
              b_value: res.bValue,
              shade_name: shade.name,
              hex: shade.hex,
              analysis: res.analysis,
              free_text: freeText || null,
            })
            .select("id")
            .single();
          savedId = data?.id;
        } catch {
          /* ignore */
        }
        if (cancelled) return;
        setStage({ kind: "result", bValue: res.bValue, analysis: res.analysis, savedId });
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error
          ? e.message
          : lang === "en" ? "Analysis failed. Please try again." : "分析失敗，請再試一次。";
        setStage({ kind: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stage, analyze, answers, freeText, lang, questions]);

  const restart = () => {
    setAnswers(Array(QUESTIONS_ZH.length).fill(-1));
    setFreeText("");
    setStage({ kind: "intro" });
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: BG, color: INK, fontFamily: "'Noto Serif TC', serif" }}
    >
      <LangToggle lang={lang} onChange={setLang} />
      {stage.kind === "gallery" ? (
        <GalleryScreen onRestart={restart} highlightId={undefined} />
      ) : (
        <div className="mx-auto flex min-h-screen max-w-[1180px] flex-col px-10 py-10 sm:px-14 sm:py-14">
          {stage.kind === "intro" && (
            <Intro
              onBegin={() => setStage({ kind: "question", index: 0 })}
              onGallery={() => setStage({ kind: "gallery" })}
            />
          )}

          {stage.kind === "question" && (
            <QuestionScreen
              index={stage.index}
              question={questions[stage.index]}
              selected={answers[stage.index]}
              onSelect={(opt) => {
                const next = [...answers];
                next[stage.index] = opt;
                setAnswers(next);
                setTimeout(() => {
                  if (stage.index + 1 < questions.length) {
                    setStage({ kind: "question", index: stage.index + 1 });
                  } else {
                    setStage({ kind: "free" });
                  }
                }, 220);
              }}
              onBack={
                stage.index > 0
                  ? () => setStage({ kind: "question", index: stage.index - 1 })
                  : () => setStage({ kind: "intro" })
              }
            />
          )}

          {stage.kind === "free" && (
            <FreeScreen
              lang={lang}
              value={freeText}
              onChange={setFreeText}
              onBack={() => setStage({ kind: "question", index: questions.length - 1 })}
              onResults={() => setStage({ kind: "loading" })}
            />
          )}

          {stage.kind === "loading" && <LoadingScreen />}

          {stage.kind === "result" && (
            <ResultScreen
              lang={lang}
              shade={shadeForB(stage.bValue)}
              analysis={stage.analysis}
              onGallery={() => setStage({ kind: "gallery" })}
              onRestart={restart}
            />
          )}

          {stage.kind === "error" && (
            <ErrorScreen
              message={stage.message}
              onRetry={() => setStage({ kind: "loading" })}
              onRestart={restart}
            />
          )}
        </div>
      )}

    </div>
  );
}

/* ---------------- language toggle ---------------- */

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  const base: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    letterSpacing: "0.08em",
    padding: "6px 10px",
    lineHeight: 1,
    transition: "opacity 0.15s, background-color 0.15s, color 0.15s",
  };
  return (
    <div
      className="fixed z-50 flex items-center gap-0"
      style={{
        top: 18,
        right: 18,
        border: `1px solid ${INK}`,
        backgroundColor: BG,
      }}
    >
      <button
        onClick={() => onChange("zh")}
        aria-pressed={lang === "zh"}
        style={{
          ...base,
          backgroundColor: lang === "zh" ? INK : "transparent",
          color: lang === "zh" ? BG : INK,
        }}
      >
        中
      </button>
      <button
        onClick={() => onChange("en")}
        aria-pressed={lang === "en"}
        style={{
          ...base,
          backgroundColor: lang === "en" ? INK : "transparent",
          color: lang === "en" ? BG : INK,
        }}
      >
        EN
      </button>
    </div>
  );
}

/* ---------------- screens ---------------- */

function Intro({ onBegin, onGallery }: { onBegin: () => void; onGallery: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-start justify-between">
        <button
          onClick={onGallery}
          className="inline-flex items-center gap-2 text-[14px] transition-opacity hover:opacity-60"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Gallery →
        </button>
        <h1
          className="leading-none tracking-tight"
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: "clamp(80px, 14vw, 220px)",
            letterSpacing: "-0.04em",
          }}
        >
          BalancE
        </h1>
      </div>

      <div className="mt-auto">
        <p
          className="whitespace-pre-line text-[15px] leading-[1.9] sm:text-[17px]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
{`In daily discourse, "balance" is often equated with "the middle"
while "imbalance" is viewed as an anomaly,
requiring correction.
But we find our own balance through our imbalance,
and it lands somewhere between black to grey to white.
So, where does your balance land?`}
        </p>

        <div className="mt-8 flex items-center">
          {SHADES.map((s, i) => (
            <span
              key={s.bValue}
              className="block h-10 sm:h-12"
              style={{
                backgroundColor: s.hex,
                width: 48,
                marginLeft: i === 0 ? 0 : -1,
                border: s.bValue === 100 ? "1px solid #d8d6d1" : "none",
              }}
              aria-hidden
            />
          ))}
        </div>

        <button
          onClick={onBegin}
          className="mt-10 inline-flex items-center gap-4 transition-opacity hover:opacity-60"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 900 }}
        >
          <span style={{ fontSize: "clamp(44px, 7vw, 92px)", letterSpacing: "-0.03em" }}>
            BEGIN
          </span>
          <span
            className="grid place-items-center rounded-full"
            style={{
              width: "clamp(40px, 6vw, 72px)",
              height: "clamp(40px, 6vw, 72px)",
              border: "1.5px solid " + INK,
            }}
          >
            <Arrow />
          </span>
        </button>
      </div>
    </div>
  );
}

function QuestionScreen({
  index,
  question,
  selected,
  onSelect,
  onBack,
}: {
  index: number;
  question: Question;
  selected: number;
  onSelect: (opt: number) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div
        className="text-[18px] sm:text-[22px]"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        Question {index + 1}/11
      </div>

      <h2
        className="mt-10 text-[22px] leading-[1.7] sm:mt-14 sm:text-[26px]"
        style={{ fontWeight: 600 }}
      >
        {question.prompt}
      </h2>

      <div className="mt-10 flex flex-col gap-5">
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className="group text-left transition-all"
              style={{
                border: `1px solid ${isSelected ? INK : "#1a1a1a55"}`,
                backgroundColor: isSelected ? INK : "transparent",
                color: isSelected ? BG : INK,
                padding: "26px 36px",
                fontSize: "18px",
                lineHeight: 1.6,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-3 text-[15px] transition-opacity hover:opacity-60"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span style={{ transform: "rotate(180deg)", display: "inline-block" }}>
            <Arrow />
          </span>
          Back
        </button>
        <Progress current={index + 1} total={11} />
      </div>

      <div className="mt-auto flex justify-end pt-16">
        <BalanceMark />
      </div>
    </div>
  );
}

function FreeScreen({
  lang,
  value,
  onChange,
  onBack,
  onResults,
}: {
  lang: Lang;
  value: string;
  onChange: (v: string) => void;
  onBack: () => void;
  onResults: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div
        className="text-[18px] sm:text-[22px]"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        Question 11/11
      </div>

      <h2
        className="mt-10 text-[22px] leading-[1.7] sm:mt-14 sm:text-[26px]"
        style={{ fontWeight: 600 }}
      >
        {FREE_PROMPT[lang]}
      </h2>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 120))}
        placeholder={FREE_PLACEHOLDER[lang]}
        className="mt-10 w-full resize-none bg-transparent p-7 text-[18px] leading-[1.8] outline-none"
        style={{
          border: `1px solid ${INK}55`,
          minHeight: 260,
          fontFamily: "'Noto Serif TC', serif",
        }}
      />

      <div
        className="mt-3 text-right text-[13px] opacity-50"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {value.length}/120
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-3 text-[15px] transition-opacity hover:opacity-60"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span style={{ transform: "rotate(180deg)", display: "inline-block" }}>
            <Arrow />
          </span>
          Back
        </button>

        <button
          onClick={onResults}
          className="inline-flex items-center gap-4 transition-opacity hover:opacity-60"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span className="text-[22px]">Results</span>
          <span
            className="grid place-items-center rounded-full"
            style={{ width: 56, height: 56, border: `1.5px solid ${INK}` }}
          >
            <Arrow />
          </span>
        </button>
      </div>

      <div className="mt-auto flex justify-end pt-16">
        <BalanceMark />
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <SplitWaveLogo size="clamp(80px, 14vw, 220px)" />
      <p
        className="text-[14px] opacity-60"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        analyzing your balance…
      </p>
    </div>
  );
}

function ResultScreen({
  lang,
  shade,
  analysis,
  onGallery,
  onRestart,
}: {
  lang: Lang;
  shade: Shade;
  analysis: string;
  onGallery: () => void;
  onRestart: () => void;
}) {
  const textOnSwatch = shade.bValue > 55 ? "#222" : "#f2efee";
  // Split analysis into two paragraphs — first ~2 sentences, rest second.
  const paragraphs = useMemo(() => splitAnalysis(analysis), [analysis]);

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="text-[28px] sm:text-[34px]" style={{ fontWeight: 700 }}>
        {RESULT_TITLE[lang]}
      </h2>


      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <div
            className="relative w-full"
            style={{
              aspectRatio: "1 / 1",
              backgroundColor: shade.hex,
              maxWidth: 440,
              border: shade.bValue === 100 ? "1px solid #d8d6d1" : "none",
            }}
          >
            <div
              className="absolute bottom-4 left-5 text-[20px]"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: textOnSwatch }}
            >
              {shade.hex}
            </div>
          </div>
        </div>

        <div className="text-right">
          <h3 className="text-[40px] sm:text-[52px] leading-none" style={{ fontWeight: 700 }}>
            {shade.name}
          </h3>
          <p
            className="mt-6 whitespace-pre-line text-[16px] leading-[2.2]"
            style={{ fontFamily: "'Noto Serif TC', serif" }}
          >
            {paragraphs[0]}
          </p>
        </div>
      </div>

      <div className="mt-20">
        <p
          className="whitespace-pre-line text-right text-[16px] leading-[2.4]"
          style={{ fontFamily: "'Noto Serif TC', serif" }}
        >
          {paragraphs[1]}
        </p>
      </div>

      <div className="mt-10 flex items-center justify-end gap-6">
        <button
          onClick={onRestart}
          className="text-[14px] opacity-50 transition-opacity hover:opacity-80"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          restart
        </button>
        <button
          onClick={onGallery}
          className="inline-flex items-center gap-4 transition-opacity hover:opacity-60"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span className="text-[18px]">See others' results</span>
          <span
            className="grid place-items-center rounded-full"
            style={{ width: 48, height: 48, border: `1.5px solid ${INK}` }}
          >
            <Arrow />
          </span>
        </button>
      </div>

      <div className="mt-auto pt-16">
        <h4
          className="leading-none"
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: "clamp(80px, 16vw, 220px)",
            letterSpacing: "-0.04em",
          }}
        >
          BalancE
        </h4>
      </div>
    </div>
  );
}

function splitAnalysis(text: string): [string, string] {
  const clean = text.trim();
  // Try to split at the midpoint sentence boundary.
  const sentences = clean.split(/(?<=[。！？!?])/g).filter((s) => s.trim().length > 0);
  if (sentences.length <= 1) return [clean, ""];
  const mid = Math.ceil(sentences.length / 2);
  return [sentences.slice(0, mid).join(""), sentences.slice(mid).join("")];
}

function ErrorScreen({
  message,
  onRetry,
  onRestart,
}: {
  message: string;
  onRetry: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <h3 className="text-[28px]" style={{ fontWeight: 600 }}>
        分析暫時無法完成
      </h3>
      <p
        className="max-w-lg text-[14px] opacity-60"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {message}
      </p>
      <div className="flex gap-4">
        <button
          onClick={onRetry}
          className="px-6 py-3 transition-opacity hover:opacity-60"
          style={{ border: `1px solid ${INK}`, fontFamily: "'JetBrains Mono', monospace" }}
        >
          Retry
        </button>
        <button
          onClick={onRestart}
          className="px-6 py-3 transition-opacity hover:opacity-60"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Restart
        </button>
      </div>
    </div>
  );
}

/* ---------------- gallery ---------------- */

const CARD_W = 190;
const CARD_H = 160;
const GAP_X = 22;
const GAP_Y = 28;
const EDGE_PAD = 24;

const SCREEN_W = EDGE_PAD * 2 + 4 * CARD_W + 3 * GAP_X;
const SCREEN_H = EDGE_PAD * 2 + 3 * CARD_H + 2 * GAP_Y;

// 8 fixed on-screen slots (top: 4, middle: 2 flanking logo, bottom: 2 under logo)
const SLOT_POSITIONS: { x: number; y: number }[] = [
  { x: EDGE_PAD + 0 * (CARD_W + GAP_X), y: EDGE_PAD },
  { x: EDGE_PAD + 1 * (CARD_W + GAP_X), y: EDGE_PAD },
  { x: EDGE_PAD + 2 * (CARD_W + GAP_X), y: EDGE_PAD },
  { x: EDGE_PAD + 3 * (CARD_W + GAP_X), y: EDGE_PAD },
  { x: EDGE_PAD + 0 * (CARD_W + GAP_X), y: EDGE_PAD + (CARD_H + GAP_Y) },
  { x: EDGE_PAD + 3 * (CARD_W + GAP_X), y: EDGE_PAD + (CARD_H + GAP_Y) },
  { x: EDGE_PAD + 1 * (CARD_W + GAP_X), y: EDGE_PAD + 2 * (CARD_H + GAP_Y) },
  { x: EDGE_PAD + 2 * (CARD_W + GAP_X), y: EDGE_PAD + 2 * (CARD_H + GAP_Y) },
];

const LOGO_BOX = {
  x: EDGE_PAD + (CARD_W + GAP_X),
  y: EDGE_PAD + (CARD_H + GAP_Y),
  w: 2 * CARD_W + GAP_X,
  h: CARD_H,
};

const HISTORY_TOP_Y = EDGE_PAD;
const HISTORY_BOT_Y = EDGE_PAD + 2 * (CARD_H + GAP_Y);

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type Placed = {
  id: string;
  x: number;
  y: number;
  rot: number;
  delay: number;
  spinFrom: number;
  result: SavedResult;
  isNew: boolean;
};

function decorate(
  result: SavedResult,
  x: number,
  y: number,
  isNew: boolean,
): Placed {
  const seed = hashId(result.id);
  const jitterRange = 10;
  const jitterX = (seed % (jitterRange * 2)) - jitterRange;
  const jitterY = (((seed >> 5) % (jitterRange * 2)) - jitterRange) * 0.6;
  const rot = ((seed >> 9) % 18) - 9;
  const spinFrom = ((seed >> 13) % 60) * (seed & 1 ? -1 : 1) - 40;
  return {
    id: result.id,
    x: x + jitterX,
    y: y + jitterY,
    rot,
    delay: 0,
    spinFrom,
    result,
    isNew,
  };
}

function GalleryScreen({
  onRestart,
}: {
  onRestart: () => void;
  highlightId?: string;
}) {
  const [slots, setSlots] = useState<(SavedResult | null)[]>(() =>
    Array(8).fill(null),
  );
  const [history, setHistory] = useState<SavedResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());
  const seenIds = useRef<Set<string>>(new Set());
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("results")
        .select("id, b_value, shade_name, hex, analysis, created_at")
        .order("created_at", { ascending: false });
      if (!mounted) return;
      const rows = (data ?? []) as SavedResult[];
      rows.forEach((r) => seenIds.current.add(r.id));
      const initial = rows.slice(0, 8);
      const rest = rows.slice(8); // desc; rest[0] = closest to screen
      const shuffled = seededShuffle(
        initial,
        hashId(initial[0]?.id ?? "balance-seed"),
      );
      const newSlots: (SavedResult | null)[] = Array(8).fill(null);
      shuffled.forEach((r, i) => {
        newSlots[i] = r;
      });
      setSlots(newSlots);
      setHistory(rest);
      setLoaded(true);
    })();

    const channel = supabase
      .channel("results-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "results" },
        (payload) => {
          const r = payload.new as SavedResult;
          if (seenIds.current.has(r.id)) return;
          seenIds.current.add(r.id);
          setNewIds((prev) => {
            const next = new Set(prev);
            next.add(r.id);
            return next;
          });
          setSlots((prev) => {
            // prefer any empty slot
            let idx = prev.findIndex((s) => s === null);
            let displaced: SavedResult | null = null;
            if (idx === -1) {
              idx = 0;
              let oldestTs = Date.parse(prev[0]!.created_at ?? "");
              for (let i = 1; i < prev.length; i++) {
                const t = Date.parse(prev[i]!.created_at ?? "");
                if (t < oldestTs) {
                  oldestTs = t;
                  idx = i;
                }
              }
              displaced = prev[idx];
            }
            const next = [...prev];
            next[idx] = r;
            if (displaced) {
              const d = displaced;
              setHistory((h) => [d, ...h]);
            }
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const historyCols = Math.ceil(history.length / 2);
  const historyWidth = historyCols * (CARD_W + GAP_X);
  const canvasWidth = historyWidth + SCREEN_W;

  const placements: Placed[] = useMemo(() => {
    const out: Placed[] = [];
    slots.forEach((r, i) => {
      if (!r) return;
      const pos = SLOT_POSITIONS[i];
      out.push(
        decorate(r, historyWidth + pos.x, pos.y, newIds.has(r.id)),
      );
    });
    history.forEach((r, i) => {
      const col = Math.floor(i / 2);
      const row = i % 2;
      const x =
        historyWidth - (col + 1) * (CARD_W + GAP_X) + EDGE_PAD;
      const y = row === 0 ? HISTORY_TOP_Y : HISTORY_BOT_Y;
      out.push(decorate(r, x, y, false));
    });
    return out;
  }, [slots, history, historyWidth, newIds]);

  // snap to the right (newest) on load and on every insert
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [canvasWidth, slots, history]);

  const onScreenCount = slots.filter(Boolean).length;
  const totalCount = onScreenCount + history.length;

  return (
    <div
      className="relative min-h-screen w-full"
      style={{ backgroundColor: BG, color: INK, overflow: "hidden" }}
    >
      {/* top bar */}
      <div className="relative z-30 flex items-center justify-between px-8 py-6">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 text-[14px] transition-opacity hover:opacity-60"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span style={{ transform: "rotate(180deg)", display: "inline-block" }}>
            <Arrow />
          </span>
          take the test
        </button>
        <div
          className="text-[13px] opacity-60"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {loaded ? `${totalCount} balances landed` : "loading…"}
        </div>
      </div>

      {/* horizontally scrolling strip */}
      <div
        ref={scrollerRef}
        className="relative mx-auto"
        style={{
          width: "100%",
          maxWidth: SCREEN_W,
          height: SCREEN_H,
          overflowX: "auto",
          overflowY: "hidden",
        }}
      >
        <div
          className="relative"
          style={{ width: canvasWidth, height: SCREEN_H }}
        >
          {/* logo, fixed inside the visible screen area (at right end of canvas) */}
          <div
            className="pointer-events-none absolute z-[1] flex items-center justify-center"
            style={{
              left: historyWidth + LOGO_BOX.x,
              top: LOGO_BOX.y,
              width: LOGO_BOX.w,
              height: LOGO_BOX.h,
            }}
          >
            <SplitWaveLogo size={`${Math.min(LOGO_BOX.w, 420)}px`} />
          </div>

          {placements.map((p) => (
            <ScatteredCard key={p.id} placed={p} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes cardFall {
          0% {
            opacity: 0;
            transform: translate3d(0, -120vh, 0)
              rotate(var(--spin-from, -40deg));
          }
          70% {
            opacity: 1;
            transform: translate3d(0, 12px, 0)
              rotate(calc(var(--rot, 0deg) + 4deg));
          }
          85% {
            transform: translate3d(0, -4px, 0)
              rotate(calc(var(--rot, 0deg) - 1.5deg));
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0)
              rotate(var(--rot, 0deg));
          }
        }
      `}</style>
    </div>
  );
}

function ScatteredCard({ placed }: { placed: Placed }) {
  const { result, x, y, rot, delay, spinFrom } = placed;
  const textOnSwatch = result.b_value > 55 ? "#222" : "#f2efee";

  return (
    <article
      className="absolute will-change-transform"
      style={{
        left: x,
        top: y,
        width: CARD_W,
        minHeight: CARD_H,
        transformOrigin: "50% 55%",
        ["--rot" as never]: `${rot}deg`,
        ["--spin-from" as never]: `${spinFrom}deg`,
        animation: "cardFall 1.15s cubic-bezier(.22,1,.36,1) both",
        animationDelay: `${delay}s`,
      }}
    >
      <div
        className="relative flex h-full w-full flex-col"
        style={{
          backgroundColor: "#efece9",
          boxShadow:
            "0 1px 0 rgba(0,0,0,0.04), 0 10px 20px -14px rgba(0,0,0,0.32), 0 2px 5px rgba(0,0,0,0.06)",
          padding: "8px 8px 6px 8px",
        }}
      >
        <div className="flex items-start gap-2">
          <div
            className="shrink-0"
            style={{
              width: 28,
              height: 28,
              backgroundColor: result.hex,
              border: result.b_value === 100 ? "1px solid #d8d6d1" : "none",
              position: "relative",
            }}
          >
            <span
              className="absolute inset-0 flex items-end justify-start pl-0.5 pb-0.5"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 5.5,
                letterSpacing: "0.02em",
                color: textOnSwatch,
              }}
            >
              {result.hex.toLowerCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1 text-right">
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 6,
                letterSpacing: "0.12em",
                opacity: 0.55,
              }}
            >
              {formatDDMM(result.created_at)}
            </div>
            <h4
              className="truncate"
              style={{
                fontFamily: "'Noto Serif TC', serif",
                fontWeight: 700,
                fontSize: 10,
                lineHeight: 1.1,
                marginTop: 1,
              }}
            >
              {result.shade_name}
            </h4>
          </div>
        </div>

        <div
          className="my-1"
          style={{ height: 1, backgroundColor: "rgba(0,0,0,0.12)" }}
        />

        <p
          className="flex-1"
          style={{
            fontFamily: "'Noto Serif TC', serif",
            fontSize: 6,
            lineHeight: 1.35,
            color: "rgba(11,11,11,0.82)",
            textAlign: "justify",
            whiteSpace: "pre-wrap",
          }}
        >
          {result.analysis}
        </p>

        <div className="mt-1 flex items-end justify-between">
          <SplitWaveLogo size="38px" />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 5.5,
              letterSpacing: "0.1em",
              opacity: 0.4,
            }}
          >
            No. {result.id.slice(0, 6)}
          </span>
        </div>
      </div>
    </article>
  );
}

/* ---------------- split wave logo ---------------- */

function SplitWaveLogo({ size = "clamp(80px, 14vw, 220px)" }: { size?: string }) {
  const id = "wave-clip";
  return (
    <svg
      viewBox="0 0 520 90"
      preserveAspectRatio="xMidYMid meet"
      className="select-none"
      style={{ width: size, height: "auto", display: "block" }}
    >
      <defs>
        <clipPath id={id}>
          <path d="M-30,-15 L550,-15 L550,42 C460,58 370,26 280,42 C190,58 100,26 10,42 L-30,42 Z" />
        </clipPath>
      </defs>
      <text
        x="260"
        y="64"
        textAnchor="middle"
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 900,
          fontSize: 68,
          letterSpacing: "-0.045em",
        }}
        fill="#0b0b0b"
      >
        BalancE
      </text>
      <text
        x="260"
        y="64"
        textAnchor="middle"
        clipPath={`url(#${id})`}
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 900,
          fontSize: 68,
          letterSpacing: "-0.045em",
        }}
        fill="#cccccc"
      >
        BalancE
      </text>
    </svg>
  );
}

/* ---------------- bits ---------------- */

function Arrow() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden>
      <path
        d="M1 6h15M11 1l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BalanceMark() {
  return (
    <div
      className="leading-none"
      style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 900,
        fontSize: "clamp(48px, 8vw, 120px)",
        letterSpacing: "-0.04em",
      }}
    >
      BalancE
    </div>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="block h-[2px]"
          style={{ width: 22, backgroundColor: i < current ? INK : `${INK}33` }}
        />
      ))}
    </div>
  );
}

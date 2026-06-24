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
      { property: "og:title", content: "BalancE" },
      {
        property: "og:description",
        content: "Where does your balance land — between black, grey, and white?",
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

const QUESTIONS: Question[] = [
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
  { bValue: 30, hex: "#3A4145", name: "中暗灰", tagline: "堅忍、務實" },
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

type SavedResult = {
  id: string;
  b_value: number;
  shade_name: string;
  hex: string;
  analysis: string;
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
  const [answers, setAnswers] = useState<number[]>(() => Array(QUESTIONS.length).fill(-1));
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
            questions: QUESTIONS.map((q) => ({
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
        const message = e instanceof Error ? e.message : "分析失敗，請再試一次。";
        setStage({ kind: "error", message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stage, analyze, answers, freeText]);

  const restart = () => {
    setAnswers(Array(QUESTIONS.length).fill(-1));
    setFreeText("");
    setStage({ kind: "intro" });
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: BG, color: INK, fontFamily: "'Noto Serif TC', serif" }}
    >
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
              question={QUESTIONS[stage.index]}
              selected={answers[stage.index]}
              onSelect={(opt) => {
                const next = [...answers];
                next[stage.index] = opt;
                setAnswers(next);
                setTimeout(() => {
                  if (stage.index + 1 < QUESTIONS.length) {
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
              value={freeText}
              onChange={setFreeText}
              onBack={() => setStage({ kind: "question", index: QUESTIONS.length - 1 })}
              onResults={() => setStage({ kind: "loading" })}
            />
          )}

          {stage.kind === "loading" && <LoadingScreen />}

          {stage.kind === "result" && (
            <ResultScreen
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
  value,
  onChange,
  onBack,
  onResults,
}: {
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
        請用一段話描述你心中理想的「平衡」狀態。可以是一個場景、一種感覺、一個比喻，或者你曾經體驗過的某個瞬間。
      </h2>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 120))}
        placeholder="平衡是……"
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
  shade,
  analysis,
  onGallery,
  onRestart,
}: {
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
        分析結果
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

      <div className="mt-12">
        <p
          className="mx-auto max-w-[760px] whitespace-pre-line text-center text-[16px] leading-[2.2]"
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

type CardLayout = {
  id: string;
  leftPct: number;
  topPct: number;
  rotate: number;
  delay: number;
  result: SavedResult;
};

function GalleryScreen({
  onRestart,
}: {
  onRestart: () => void;
  highlightId?: string;
}) {
  const [cards, setCards] = useState<CardLayout[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const seenIds = useRef<Set<string>>(new Set());

  // initial load + realtime subscription
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("results")
        .select("id, b_value, shade_name, hex, analysis")
        .order("created_at", { ascending: true })
        .limit(120);
      if (!mounted) return;
      const layouts = (data ?? []).map((r, i) => {
        seenIds.current.add(r.id);
        return makeLayout(r as SavedResult, i * 0.12);
      });
      setCards(layouts);
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
          setCards((prev) => [...prev, makeLayout(r, 0)]);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const opened = openId ? cards.find((c) => c.id === openId) : null;

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ backgroundColor: BG, color: INK }}
    >
      {/* split-wave logo hovering in center */}
      <div className="pointer-events-none absolute inset-x-0 top-[28%] z-[1] flex justify-center">
        <SplitWaveLogo size="clamp(100px, 18vw, 280px)" />
      </div>

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
          {loaded ? `${cards.length} balances landed` : "loading…"}
        </div>
      </div>

      {/* fallen cards */}
      <div className="absolute inset-0 z-10">
        {cards.map((c) => (
          <FallingCard key={c.id} layout={c} onOpen={() => setOpenId(c.id)} />
        ))}
      </div>

      {/* modal */}
      {opened && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-6 py-10"
          style={{ backgroundColor: "rgba(11,11,11,0.55)" }}
          onClick={() => setOpenId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[760px] overflow-y-auto"
            style={{
              backgroundColor: BG,
              padding: "44px 48px",
              maxHeight: "85vh",
              boxShadow: "0 30px 80px -20px rgba(0,0,0,0.4)",
            }}
          >
            <button
              onClick={() => setOpenId(null)}
              className="absolute right-5 top-4 text-[20px] opacity-60 hover:opacity-100"
              aria-label="Close"
            >
              ×
            </button>
            <ResultCardDetail result={opened.result} />
          </div>
        </div>
      )}
    </div>
  );
}

function makeLayout(r: SavedResult, delay: number): CardLayout {
  // deterministic pseudo-random from id
  const seed = hashStr(r.id);
  const rand = mulberry32(seed);
  const leftPct = 6 + rand() * 78; // 6%..84%
  const topPct = 18 + rand() * 60; // 18%..78%
  const rotate = (rand() - 0.5) * 36; // -18..18 deg
  return { id: r.id, leftPct, topPct, rotate, delay, result: r };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function FallingCard({ layout, onOpen }: { layout: CardLayout; onOpen: () => void }) {
  const { leftPct, topPct, rotate, delay, result } = layout;
  return (
    <button
      onClick={onOpen}
      className="absolute z-20 cursor-pointer text-left"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: "clamp(140px, 14vw, 220px)",
        transform: `rotate(${rotate}deg)`,
        animation: `cardDrop 1.1s cubic-bezier(.22,1,.36,1) both`,
        animationDelay: `${delay}s`,
        transformOrigin: "center",
      }}
    >
      <div
        className="relative"
        style={{
          backgroundColor: "#fafaf6",
          boxShadow: "0 18px 28px -16px rgba(0,0,0,0.35), 0 4px 8px -4px rgba(0,0,0,0.15)",
          padding: "14px",
          aspectRatio: "3 / 4",
        }}
      >
        <div
          style={{
            backgroundColor: result.hex,
            width: "100%",
            aspectRatio: "1 / 1",
            border: result.b_value === 100 ? "1px solid #d8d6d1" : "none",
          }}
        />
        <div
          className="mt-2 text-[10px] opacity-70"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {result.hex}
        </div>
        <div className="text-[13px]" style={{ fontWeight: 700 }}>
          {result.shade_name}
        </div>
        <div
          className="mt-auto pt-2 text-[11px]"
          style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, letterSpacing: "-0.02em" }}
        >
          BalancE
        </div>
      </div>
      <style>{`
        @keyframes cardDrop {
          0% { transform: translateY(-120vh) rotate(${rotate - 40}deg); opacity: 0; }
          70% { opacity: 1; }
          100% { transform: translateY(0) rotate(${rotate}deg); opacity: 1; }
        }
      `}</style>
    </button>
  );
}

function ResultCardDetail({ result }: { result: SavedResult }) {
  const textOnSwatch = result.b_value > 55 ? "#222" : "#f2efee";
  const paragraphs = splitAnalysis(result.analysis);
  return (
    <div>
      <h2 className="text-[24px]" style={{ fontWeight: 700 }}>
        分析結果
      </h2>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[180px_1fr]">
        <div
          className="relative"
          style={{
            backgroundColor: result.hex,
            aspectRatio: "1 / 1",
            border: result.b_value === 100 ? "1px solid #d8d6d1" : "none",
          }}
        >
          <div
            className="absolute bottom-2 left-2 text-[13px]"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: textOnSwatch }}
          >
            {result.hex}
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-[30px] leading-none" style={{ fontWeight: 700 }}>
            {result.shade_name}
          </h3>
          <p className="mt-4 whitespace-pre-line text-[14px] leading-[2]">{paragraphs[0]}</p>
        </div>
      </div>
      {paragraphs[1] && (
        <p className="mt-6 whitespace-pre-line text-center text-[14px] leading-[2]">
          {paragraphs[1]}
        </p>
      )}
    </div>
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

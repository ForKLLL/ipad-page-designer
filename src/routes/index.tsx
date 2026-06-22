import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

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
  options: string[]; // ordered from darkest (0) → lightest (3)
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
  },
  {
    prompt: "在團隊合作中，你通常扮演的角色是：",
    options: [
      "決策者，決定計劃的方針",
      "執行的中流砥柱，負責具體而務實的工作",
      "調解者，平衡各方情緒與利益",
      "靈感發起人，帶動輕鬆積極的氛圍",
    ],
  },
  {
    prompt: "當你需要做出個人的重要決定時，你的傾向是：",
    options: [
      "獨自深思，不與任何人討論",
      "收集客觀事實，按邏輯判斷",
      "參考少量可信賴的意見後自己權衡",
      "廣泛征求他人看法，再結合直覺選擇",
    ],
  },
  {
    prompt: "你傾向如何處理內心對「失控」的恐懼?",
    options: [
      "建立嚴格的自我規則，盡量不讓自己陷入未知",
      "提前做好多種方案，用準備來抵消不安",
      "接受部分不可控，只關注自己能影響的",
      "認為失控也是體驗的一部分，願意擁抱",
    ],
  },
  {
    prompt: "你更喜歡哪種社交狀態?",
    options: [
      "極少社交，保留絕對的個人空間",
      "選擇性社交，只與少數深交的人保持聯繫",
      "適度社交，既有親密關係也有普通社交",
      "廣泛社交，喜歡新鮮面孔和輕鬆交流",
    ],
  },
  {
    prompt: "你對「悲傷」或「低落」情緒的態度是：",
    options: [
      "它們是力量的一部分，我願意獨自沉浸其中",
      "需要理性地管控，不應影響生活秩序",
      "可以短暫停留，然後溫和地讓它離開",
      "傾向於用快樂活動快速轉移注意力",
    ],
  },
  {
    prompt: "當你處於完全獨處、無事可做的狀態，你通常會：",
    options: [
      "沉浸於內心世界，思緒翻湧或放空",
      "規劃接下來的事，保持有序",
      "放鬆但不放縱，享受安靜的自我時間",
      "感到不適，會主動找事做或聯絡他人",
    ],
  },
  {
    prompt: "如果你寫日記，內容風格更可能是：",
    options: [
      "隱秘的，充滿隱喻和深層情緒",
      "規律的事件記錄與反思",
      "日常的所見所聞，語氣平和",
      "輕快的清單或零星靈感",
    ],
  },
  {
    prompt: "面對他人的強烈情緒(如憤怒或哭泣)，你通常：",
    options: [
      "保持沉默，不介入也不回應",
      "理性分析原因，提出解決方案",
      "主動傾聽，同理對方情緒，以陪伴回應對方",
      "嘗試用輕鬆話題化解對方情緒",
    ],
  },
  {
    prompt: "你理想中的「內心平靜」更像：",
    options: [
      "深海的寂靜，表面無波但內有暗流",
      "湖面的鏡面，清晰映照一切",
      "溪流的潺潺，持續而柔和",
      "晴空的通透，無雲也無風",
    ],
  },
];

type Shade = {
  hex: string;
  name: string;
  bValue: number;
  blurb: string;
};

const SHADES: Shade[] = [
  {
    hex: "#0B0C0E",
    name: "純黑",
    bValue: 5,
    blurb:
      "你目前傾向以最內斂、最克制的姿態面對世界。內裡的密度極高，沉默是你最有力的語言。在這個座標上，你並非缺席，而是把所有的能量都收攏到自己最深處。",
  },
  {
    hex: "#1F2326",
    name: "深黑灰",
    bValue: 15,
    blurb:
      "你習慣在低調中積累力量。對外不輕易表態，對內卻有清晰的秩序。這份沉穩讓你即使在不確定中，也能維持一條看不見的軸線。",
  },
  {
    hex: "#3A4145",
    name: "中暗灰",
    bValue: 30,
    blurb:
      "你正在採取一種安靜的蟄伏。並沒有完全封閉與世界的連結（窗戶微開），但也尚未準備好全然迎向外界的喧囂。表面看似停滯，實際上你正默默承載著成長的重量。",
  },
  {
    hex: "#6B7378",
    name: "中灰",
    bValue: 50,
    blurb:
      "你站在光譜的正中央——既不刻意收，也不勉強放。這份中性讓你能在不同情境間流動，既能傾聽，也能行動。平衡，對你而言是一種彈性。",
  },
  {
    hex: "#9CA3A8",
    name: "中淺灰",
    bValue: 65,
    blurb:
      "你傾向以柔和、可親近的方式存在。願意把一部分自己讓給他人，卻仍守住內在的清澈。光線在你身上是反射，而不是穿透。",
  },
  {
    hex: "#C8CCCF",
    name: "淺灰",
    bValue: 80,
    blurb:
      "你以開放、輕盈的姿態面向世界。情緒流動快，恢復力強，把生活當作一連串可以重新調整的瞬間，不執著於單一答案。",
  },
  {
    hex: "#ECEDEE",
    name: "近白",
    bValue: 95,
    blurb:
      "你幾乎透明地存在於日常裡。少有滯留的情緒，總能讓自己回到一種空白的清爽。對你而言，平衡是讓事物自然落地，不必過問。",
  },
];

function pickShade(answers: number[]): Shade {
  // answers: indices 0..3, 0 = darkest, 3 = lightest
  const valid = answers.filter((a) => a >= 0);
  if (valid.length === 0) return SHADES[3];
  const avg = valid.reduce((s, a) => s + a, 0) / valid.length; // 0..3
  // map 0..3 → 0..6 across SHADES
  const idx = Math.round((avg / 3) * (SHADES.length - 1));
  return SHADES[Math.max(0, Math.min(SHADES.length - 1, idx))];
}

type Stage =
  | { kind: "intro" }
  | { kind: "question"; index: number }
  | { kind: "free" }
  | { kind: "loading" }
  | { kind: "result" };

const BG = "#f2f0eb";
const INK = "#0b0b0b";

function BalancEApp() {
  const [stage, setStage] = useState<Stage>({ kind: "intro" });
  const [answers, setAnswers] = useState<number[]>(() => Array(QUESTIONS.length).fill(-1));
  const [freeText, setFreeText] = useState("");

  // loading → result auto transition
  useEffect(() => {
    if (stage.kind !== "loading") return;
    const t = setTimeout(() => setStage({ kind: "result" }), 2800);
    return () => clearTimeout(t);
  }, [stage]);

  const shade = useMemo(() => pickShade(answers), [answers]);

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: BG, color: INK, fontFamily: "'Noto Serif TC', serif" }}
    >
      <div className="mx-auto flex min-h-screen max-w-[1180px] flex-col px-10 py-10 sm:px-14 sm:py-14">
        {stage.kind === "intro" && <Intro onBegin={() => setStage({ kind: "question", index: 0 })} />}

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
            shade={shade}
            freeText={freeText}
            onRestart={() => {
              setAnswers(Array(QUESTIONS.length).fill(-1));
              setFreeText("");
              setStage({ kind: "intro" });
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ---------------- screens ---------------- */

function Intro({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end">
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

        <div className="mt-8 flex items-center gap-1.5">
          {SHADES.map((s, i) => (
            <span
              key={i}
              className="block h-12 w-12 rounded-full sm:h-14 sm:w-14"
              style={{ backgroundColor: s.hex, marginLeft: i === 0 ? 0 : -16 }}
              aria-hidden
            />
          ))}
          <span
            className="block h-12 w-12 rounded-full sm:h-14 sm:w-14"
            style={{ backgroundColor: "#ffffff", border: "1px solid #d8d6d1", marginLeft: -16 }}
            aria-hidden
          />
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
        Question {index + 1}/{QUESTIONS.length}
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
        <Progress current={index + 1} total={QUESTIONS.length + 1} />
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
        請用一段話 (50字內) 描述你心中理想的「平衡」狀態。可以是一個場景、一種感覺、一個比喻，或者你曾經體驗過的某個瞬間。
      </h2>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 50))}
        placeholder="平衡是……"
        className="mt-10 w-full resize-none bg-transparent p-7 text-[18px] leading-[1.8] outline-none"
        style={{
          border: `1px solid ${INK}55`,
          minHeight: 260,
          fontFamily: "'Noto Serif TC', serif",
        }}
      />

      <div className="mt-3 text-right text-[13px] opacity-50"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {value.length}/50
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
    <div className="flex flex-1 items-center justify-center">
      <div
        className="balance-loader relative select-none"
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 900,
          fontSize: "clamp(48px, 9vw, 130px)",
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        <span style={{ color: INK }}>Bala</span>
        <span className="balance-fade">ncE</span>
      </div>
      <style>{`
        .balance-fade {
          color: ${INK};
          animation: balfade 1.6s ease-in-out infinite;
        }
        @keyframes balfade {
          0%, 100% { color: ${INK}; }
          50% { color: ${BG}; }
        }
      `}</style>
    </div>
  );
}

function ResultScreen({
  shade,
  freeText,
  onRestart,
}: {
  shade: Shade;
  freeText: string;
  onRestart: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="text-[22px] sm:text-[26px]" style={{ fontWeight: 600 }}>
        分析結果
      </div>

      <div className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div>
          <div
            className="relative w-full"
            style={{
              aspectRatio: "1 / 1",
              backgroundColor: shade.hex,
              maxWidth: 460,
            }}
          >
            <div
              className="absolute bottom-4 left-4 text-[18px]"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                color: shade.bValue > 55 ? "#222" : "#f2f0eb",
              }}
            >
              {shade.hex}
            </div>
          </div>
          <div
            className="mt-4 text-[14px] opacity-60"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            B = {shade.bValue}
          </div>
        </div>

        <div className="text-right">
          <h3 className="text-[34px] sm:text-[44px]" style={{ fontWeight: 600 }}>
            {shade.name}
          </h3>

          <p className="mt-6 text-[17px] leading-[2.2]">
            {freeText.trim()
              ? `從你在選擇題中展現出的傾向，結合你所描繪「${freeText.trim()}」的意象，`
              : "從你在選擇題中展現出的傾向，"}
            {shade.blurb}
          </p>

          <p className="mt-8 text-[17px] leading-[2.2]">
            平衡是流動的光譜，而 B = {shade.bValue} 是你當下為自己建構的安全緩衝區。允許自己停留在這個灰階，不強逼自己立刻展現明朗，正是你處理迷茫最有效、也最溫柔的平衡方式。隨著內在力量的積累與外在環境的推移，你所在的色彩座標，自然會在未來的某刻重新流動。
          </p>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-between">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-3 text-[15px] transition-opacity hover:opacity-60"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span style={{ transform: "rotate(180deg)", display: "inline-block" }}>
            <Arrow />
          </span>
          Restart
        </button>
      </div>

      <div className="mt-auto pt-16">
        <h4
          className="leading-none"
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: "clamp(60px, 11vw, 160px)",
            letterSpacing: "-0.04em",
          }}
        >
          BalancE
        </h4>
      </div>
    </div>
  );
}

/* ---------------- bits ---------------- */

function Arrow() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden>
      <path d="M1 6h15M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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
          style={{
            width: 22,
            backgroundColor: i < current ? INK : `${INK}33`,
          }}
        />
      ))}
    </div>
  );
}

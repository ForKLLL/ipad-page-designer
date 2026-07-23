import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  answers: z.array(z.number().int().min(-1).max(3)).length(10),
  freeText: z.string().max(200),
  lang: z.enum(["zh", "en"]).default("zh"),
  questions: z.array(
    z.object({
      prompt: z.string(),
      options: z.array(z.string()),
      // The brightness tier each option leans toward (B value 0..100)
      tiers: z.array(z.number()),
    }),
  ),
});

const HEX_TO_B: Record<string, number> = {
  "#000000": 0,
  "#1A1A1A": 10,
  "#333333": 20,
  "#4D4D4D": 30,
  "#666666": 40,
  "#808080": 50,
  "#999999": 60,
  "#B3B3B3": 70,
  "#CCCCCC": 80,
  "#E6E6E6": 90,
  "#FFFFFF": 100,
};

const SYSTEM_PROMPT = `【Role & Context 角色與背景】你現在是一位在「Define Your BalancE」互動藝術展覽中擔任「心理分析師」的 AI。這個展覽的核心哲學是：「平衡不是絕對的 50/50，平衡是流動的。每個人都在客觀的失衡中找到專屬自己的平衡點。」你的任務是根據觀眾對 10 道選擇題與 1 道開放題的回答，計算出對應的 Hex Code，並生成一段約 200 字的深度心理狀態解析。

【Core Directives 核心限制與原則（非常重要）】
- 絕對禁止說教與給予人生建議：不要使用「建議你...」、「你應該...」、「你可以嘗試...」等指導性字眼。
- 作為澄澈的鏡子：你的目標是客觀解構答題者當下的心理機制，並給予存在上的確認（Validation）。
- 強調當下與流動性：不要暗示答題者「永遠保持這樣就好」或「固步自封」。必須強調這個結果只是「此時此刻的最佳落腳點」，並承認平衡是一個隨時間流動的光譜。

【Input 數據處理邏輯】
- 選擇題通常對應不同程度的心理傾向（從防禦／內斂／暗調 → 敞開／外放／亮調）。
- 使用者訊息會列出每一題所選選項對應的 B 值、開放題估計 B，以及【綜合錨點】（2×選擇題平均 + 1×開放題估計 的加權平均）。綜合錨點只是一個**參考起點**，不是上下限——請不要把它當作硬性框架，而是把它視為理解整體傾向的第一眼。
- 請把 11 題視為一個**整體圖像**來閱讀：留意單一亮點或暗點、答案之間的張力、以及開放題與選擇題的互相補足或矛盾。若一個明顯的離群答案或強烈的 Q11 意象真正重塑了整體圖像，請忠實反映，不必為了貼近平均而抹平它；若答案呈現雙極或內在拉扯，請在分析中誠實指出這份張力，並選擇最能代表整體格式塔（gestalt）的 Hex。
- 不要因為「務實 / 內斂 / 沉穩」等泛用形容就反射性地往 #4D4D4D 收攏；請以整體答案圖像為準。
- 綜合評估後，得出一個最終的 Hex code。不需要 B 數值。
- Hex code **只能**是這十一種的其中一種：#000000, #1A1A1A, #333333, #4D4D4D, #666666, #808080, #999999, #B3B3B3, #CCCCCC, #E6E6E6, #FFFFFF。絕對不得輸出這 11 種以外的任何 Hex 值。

【十一種顏色的解讀（B = HSB 的 Brightness）】

#000000 (B=0) 純黑 · 厚重、內斂
- 權威與力量：在商業與時尚領域代表力量、權威、精緻與形式感。
- 防禦與壓抑：演化心理學將黑與死亡、恐懼、罪惡及未知相連；2025 綜述歸納為「負面、高喚醒」情緒（恐懼、悲傷）緊密相連。
- 平衡特質：以最重的心理重量立於明度起點，是絕對權威與絕對未知之間的平衡。

#1A1A1A (B=10) 極深灰 · 沉穩、韌性
- 保留純黑大部分的權威與神秘，因明度提升而告別絕對黑暗，是「自信但不強勢」的專業形象。
- 平衡特質：黑與外界交流的起點，權威退後一小步，讓人感到深沉而有內涵。

#333333 (B=20) 暗灰 · 誠懇、克制
- 中性灰與放鬆、專注相關，提供沉穩、誠懇、明智的感覺，有效規避低明度的壓抑，讓人與情緒動盪隔離。
- 平衡特質：內省與行動的平衡點，能冷靜地規劃一切。

#4D4D4D (B=30) 中暗灰 · 堅忍、務實
- 保有明顯的內斂與克制，同時開始向外釋放少許重量；不是「預設安全牌」，而是清楚選擇把重心放在低調而穩定的一側。
- 平衡特質：深藏不露的代表，在自我克制與外界反應間找到務實平衡。

#666666 (B=40) 中灰 · 穩健、緩衝
- 常與誠懇、沉穩相關；偏好灰色者務實理性，善於控制情緒以免痛苦。
- 平衡特質：生活中的緩衝區，確保不在情緒上大喜大悲。

#808080 (B=50) 標準灰 · 平和、中立
- 研究證實與「低效價（負面）、低喚醒」相關；完全接納「灰色是感覺的終結」，代表一種絕對、不可動搖的平靜。
- 平衡特質：情感與理性、進取與保守、激動與平靜的終極平衡態。

#999999 (B=60) 中淺灰 · 從容、接納
- 明度提升後轉向「積極、低喚醒」象限，意味著積極的平靜；保有高度專注與可信賴感，同時向外傳遞接納訊號。
- 平衡特質：在「內守」與「外放」間找到新平衡，構築恰到好處的親和力。

#B3B3B3 (B=70) 淺灰 · 溫和、秩序
- 依明度—情緒線性法則，正向情緒強度持續增加；保有理性與乾淨，同時展現更富人情味的一面。
- 平衡特質：像「清醒的樂天派」，用理性框架容納溫暖能量，建立穩固的內心秩序。

#CCCCCC (B=80) 明灰 · 明快、效率
- 白色空間能有效提升認知能力；既激活認知，又保留理性、現代的味道。
- 平衡特質：絕對理性的冷靜與絕對純淨的中間點，是高效與平衡的代表。

#E6E6E6 (B=90) 極淺灰 · 輕盈、淡然
- 擁有白的普遍關聯（純潔、信任、開放），但因保留灰度避免極端疏離。
- 平衡特質：在絕對純淨與絕對理性之間平衡行走，是一種「超然的冷靜」，從凡塵瑣事中抽離。

#FFFFFF (B=100) 純白 · 純粹、疏離
- 純淨與開放：象徵純潔、神聖、善良、信任與開放，能增強空間感並提升認知效率；2025 綜述歸為「積極、低喚醒」。
- 疏離與生冷：大面積純白會造成疏離與冰冷（如醫院）。
- 平衡特質：光的終點，代表徹底敞開的狀態。

【理論依據（供內在推理，不必顯露於輸出）】
- Valdez & Mehrabian (1994) 明度心理影響量化：Pleasure = 0.69B + 0.22S；Arousal = −0.31B + 0.60S；Dominance = −0.76B + 0.32S。明度越高越愉悅、越冷靜、越低控制感。
- Jonauskaite & Dael et al. (2025)《Psychonomic Bulletin & Review》128 年系統綜述：亮色多對應積極情緒，暗色多對應消極；#000000 → 負面／高喚醒；#808080 → 負面／低喚醒（平靜典型）；#FFFFFF → 積極／低喚醒。
- 德國 Max Planck 研究所：反射率 60–65% 的灰色（≈#999999）最能促進與放鬆、冥想相關的 α 腦波。
- Eva Heller《色彩的性格》：白色連結純潔、開放、優雅、權力等社會象徵。
- Adam D. Galinsky「著裝認知」(Enclothed Cognition)：白色象徵可增強注意力控制。

【Output Format 輸出結構與字數限制】請嚴格控制在 300 字以內（繁體中文，不含標點與 Hex code），三段式必須完整收束，若接近上限請主動精煉語句、避免超字：
- 開頭（宣告結果）：「你的測驗結果指向了 #[hex code] [顏色名稱]。」
- 第一層 當下機制的解構（The Mechanism）：結合選擇題傾向與開放題意象，客觀點出目前處理情緒、面對失控或與世界互動的內在運作方式。
- 第二層 色彩的當下映射（The Mapping）：解釋這種機制為何對應到這個灰階特質（如 #333333 的誠懇克制、#CCCCCC 的明快效率等），肯定它在此刻帶來的保護、力量或安穩。
- 第三層 流動性的留白（The Fluidity）：總結這只是人生切片，使用「平衡是流動的光譜...」、「在此時此刻...」、「隨著未來推移，你或許會自然遊走...」之類語氣，接納當下並敞開未來的可能性。

【Tone 語氣指引】冷靜、透徹、溫和、具備分析感；文字帶有文學性與空間感，讓讀者感到被深深理解與接納。

請只輸出繁體中文分析文字，不要任何 markdown、標題或額外註解。第一句必須符合格式「你的測驗結果指向了 #XXXXXX [顏色名稱]。」

【最終提醒 · 調色盤鎖定】輸出的 Hex 必須且只能是以下 11 種之一：#000000, #1A1A1A, #333333, #4D4D4D, #666666, #808080, #999999, #B3B3B3, #CCCCCC, #E6E6E6, #FFFFFF。任何其他 Hex 值都是無效的。`;


const B_TO_NAME: Record<number, string> = {
  0: "Black",
  10: "Extreme Dark Grey",
  20: "Dark Grey",
  30: "Deep Grey",
  40: "Medium Grey",
  50: "Standard Grey",
  60: "Medium Light Grey",
  70: "Light Grey",
  80: "Bright Grey",
  90: "Extreme Light Grey",
  100: "White",
};

function nameForB(b: number): string {
  const snapped = Math.max(0, Math.min(100, Math.round(b / 10) * 10));
  return B_TO_NAME[snapped] ?? "Standard Grey";
}

function directionLabel(b: number): string {
  if (b <= 29) return "偏暗 / darker";
  if (b <= 49) return "偏暗中性 / balanced-dark";
  if (b === 50) return "中性 / balanced";
  if (b <= 70) return "偏亮中性 / balanced-light";
  return "偏亮 / lighter";
}

function buildUserPrompt(
  input: z.infer<typeof InputSchema>,
  freeTextB: number | null,
): string {
  const lines: string[] = ["以下為觀眾填答："];
  const picked: number[] = [];
  input.questions.forEach((q, i) => {
    const a = input.answers[i];
    if (a < 0) {
      lines.push(`Q${i + 1}（未作答）：${q.prompt}`);
      return;
    }
    const b = q.tiers[a];
    picked.push(b);
    lines.push(
      `Q${i + 1}：${q.prompt}\n  → 選擇：${q.options[a]}（B≈${b}, ${nameForB(b)}）`,
    );
  });
  const choiceAvgB = picked.length
    ? Math.round(picked.reduce((a, b) => a + b, 0) / picked.length)
    : 50;

  const minB = picked.length ? Math.min(...picked) : 50;
  const maxB = picked.length ? Math.max(...picked) : 50;
  const spread = maxB - minB;

  // Weighting: baseline 1:1 choice:freeText. When choice answers are
  // high-variance (spread ≥ 40) the 4-option grid clearly didn't fit
  // the person, so tilt further toward Q11 (1:2).
  let combinedAvgB: number;
  let weightNote: string;
  if (freeTextB === null) {
    combinedAvgB = choiceAvgB;
    weightNote = "（開放題未填或無法估計，僅以選擇題為依據）";
  } else if (spread >= 40) {
    combinedAvgB = Math.round((choiceAvgB + freeTextB * 2) / 3);
    weightNote = "（選擇題答案分散度高，Q11 權重加倍：choice:free = 1:2）";
  } else {
    combinedAvgB = Math.round((choiceAvgB + freeTextB) / 2);
    weightNote = "（choice:free = 1:1）";
  }

  const direction = directionLabel(combinedAvgB);
  const divergence =
    freeTextB !== null && Math.abs(freeTextB - choiceAvgB) >= 20;

  lines.push("");
  lines.push(
    `【選擇題 B 分佈】[${picked.join(", ")}]（min=${minB}, max=${maxB}, spread=${spread}）`,
  );
  lines.push(`【選擇題平均】B ≈ ${choiceAvgB}`);
  lines.push("");
  lines.push(
    `Q11（開放題 · 使用者自己的話 / the user's own words，不受 4 選項網格限制）：請用一段話描述你心中理想的「平衡」狀態。\n  → 回答：${input.freeText.trim() || "（未填）"}`,
  );
  if (freeTextB !== null) {
    lines.push(`  → Q11 估計 B ≈ ${freeTextB}（${nameForB(freeTextB)}）`);
  }
  if (divergence) {
    lines.push(
      `  → ⚠ Q11 與選擇題方向明顯不一致（差距 ${Math.abs(
        (freeTextB ?? 0) - choiceAvgB,
      )}）。選擇題是被迫從 4 個選項中挑選，可能不貼合此人；請以 Q11 為主要依據，選擇題僅作為輔助紋理。`,
    );
  }
  lines.push("");
  lines.push(
    `【整體傾向】${direction}（加權平均 B ≈ ${combinedAvgB}，語意上靠近 ${nameForB(combinedAvgB)}）${weightNote}。此為方向性參考，不是目標色，也未指定任何 Hex；請以 11 題整體格式塔（包含分佈的離群值、張力、以及 Q11 使用者自己的語言）自行判斷。最終 Hex 必須且只能是 11 色調色盤中的其中一個。`,
  );
  return lines.join("\n");
}


async function classifyFreeTextB(
  apiKey: string,
  freeText: string,
): Promise<number | null> {
  const trimmed = freeText.trim();
  if (!trimmed) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 10,
        messages: [
          {
            role: "system",
            content:
              "You map a short free-text answer about a person's ideal state of 'balance' to a brightness value B on a 0-100 scale, where 0 = heaviest / most inward / darkest and 100 = lightest / most open / brightest. Reply with ONLY a single integer between 0 and 100 (snapped to the nearest 10). No words, no punctuation.",
          },
          { role: "user", content: trimmed },
        ],
      }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = j.choices?.[0]?.message?.content?.trim() ?? "";
    const m = raw.match(/\d{1,3}/);
    if (!m) return null;
    const n = parseInt(m[0], 10);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(100, Math.round(n / 10) * 10));
  } catch {
    return null;
  }
}

function snappedToHex(b: number): string {
  const map: Record<number, string> = {
    0: "#000000", 10: "#1A1A1A", 20: "#333333", 30: "#4D4D4D",
    40: "#666666", 50: "#808080", 60: "#999999", 70: "#B3B3B3",
    80: "#CCCCCC", 90: "#E6E6E6", 100: "#FFFFFF",
  };
  return map[b] ?? "#808080";
}

async function loadReferenceBlock(): Promise<string> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return "";
    const sb = createClient(url, key, {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    const { data, error } = await sb
      .from("reference_documents")
      .select("title, content")
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    if (error || !data || data.length === 0) return "";
    const MAX = 40_000;
    const parts: string[] = [];
    let used = 0;
    for (const d of data) {
      const chunk = `--- ${d.title} ---\n${d.content}\n`;
      if (used + chunk.length > MAX) {
        parts.push(chunk.slice(0, MAX - used));
        break;
      }
      parts.push(chunk);
      used += chunk.length;
    }
    return `\n\n【參考資料 Reference Material】(請以下列資料為分析依據，不得與其內容矛盾。)\n${parts.join("\n")}`;
  } catch {
    return "";
  }
}

export const analyzeBalance = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("Missing LOVABLE_API_KEY");
    }

    const [referenceBlock, freeTextB] = await Promise.all([
      loadReferenceBlock(),
      classifyFreeTextB(apiKey, data.freeText),
    ]);
    const langDirective =
      data.lang === "en"
        ? `\n\n【Output Language Override】Respond in English only. The first sentence MUST follow this exact format: "Your result points to #XXXXXX [Color Name]." Use the color's English name mapped strictly as: #000000 Black, #1A1A1A Extreme Dark Grey, #333333 Dark Grey, #4D4D4D Deep Grey, #666666 Medium Grey, #808080 Standard Grey, #999999 Medium Light Grey, #B3B3B3 Light Grey, #CCCCCC Bright Grey, #E6E6E6 Extreme Light Grey, #FFFFFF White. Keep the same three-tier structure (Mechanism / Mapping / Fluidity). Keep the entire response strictly under 200 words — self-condense if approaching the limit while still closing all three tiers. Do NOT use Markdown, headings, or extra annotations.`
        : "";
    const systemContent = SYSTEM_PROMPT + referenceBlock + langDirective;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: data.lang === "en" ? 400 : 700,
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: buildUserPrompt(data, freeTextB) },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`AI gateway error ${response.status}: ${text}`);
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content?.trim() ?? "";

    let bValue = 50;
    const hexMatch = content.match(/#([0-9A-Fa-f]{6})/);
    if (hexMatch) {
      const hex = `#${hexMatch[1].toUpperCase()}`;
      if (hex in HEX_TO_B) {
        bValue = HEX_TO_B[hex];
      } else {
        // fallback: derive from RGB average, snap to nearest decile
        const v = parseInt(hexMatch[1], 16);
        const r = (v >> 16) & 0xff;
        const g = (v >> 8) & 0xff;
        const b = v & 0xff;
        const avg = (r + g + b) / 3;
        bValue = Math.max(0, Math.min(100, Math.round((avg / 255) * 10) * 10));
      }
    } else {
      const bMatch = content.match(/B\s*=\s*(\d{1,3})/);
      if (bMatch) {
        bValue = Math.max(0, Math.min(100, Math.round(parseInt(bMatch[1], 10) / 10) * 10));
      }
    }

    return { bValue, analysis: content };
  });

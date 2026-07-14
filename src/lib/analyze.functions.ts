import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  answers: z.array(z.number().int().min(-1).max(3)).length(10),
  freeText: z.string().max(200),
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
- 第 11 題（開放題）是核心：請提取其中的隱喻、色彩意象與情緒溫度。
- 交叉比對選擇題與開放題：若兩者一致，則強化該特質；若兩者矛盾（例如選擇題極度理性、開放題卻充滿感性），請將這種「矛盾」本身解讀為他們獨特的平衡機制。
- 綜合評估後，得出一個最終的 Hex code。不需要 B 數值。
- Hex code 只能是這十一種的其中一種：#000000, #1A1A1A, #333333, #4D4D4D, #666666, #808080, #999999, #B3B3B3, #CCCCCC, #E6E6E6, #FFFFFF。

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
- 深灰偏好者常表現務實、不希望給自己找麻煩；從明度情緒曲線看，進入「低積極／低消極」區域，像情緒上的起點，蓄勢待發。
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

【Output Format 輸出結構與字數限制】請嚴格輸出約 200–250 字（繁體中文），三段式：
- 開頭（宣告結果）：「你的測驗結果指向了 #[hex code] [顏色名稱]。」
- 第一層 當下機制的解構（The Mechanism）：結合選擇題傾向與開放題意象，客觀點出目前處理情緒、面對失控或與世界互動的內在運作方式。
- 第二層 色彩的當下映射（The Mapping）：解釋這種機制為何對應到這個灰階特質（如 #333333 的誠懇克制、#CCCCCC 的明快效率等），肯定它在此刻帶來的保護、力量或安穩。
- 第三層 流動性的留白（The Fluidity）：總結這只是人生切片，使用「平衡是流動的光譜...」、「在此時此刻...」、「隨著未來推移，你或許會自然遊走...」之類語氣，接納當下並敞開未來的可能性。

【Tone 語氣指引】冷靜、透徹、溫和、具備分析感；文字帶有文學性與空間感，讓讀者感到被深深理解與接納。

請只輸出繁體中文分析文字，不要任何 markdown、標題或額外註解。第一句必須符合格式「你的測驗結果指向了 #XXXXXX [顏色名稱]。」`;


function buildUserPrompt(input: z.infer<typeof InputSchema>): string {
  const lines: string[] = ["以下為觀眾填答："];
  input.questions.forEach((q, i) => {
    const a = input.answers[i];
    if (a < 0) {
      lines.push(`Q${i + 1}（未作答）：${q.prompt}`);
      return;
    }
    lines.push(
      `Q${i + 1}：${q.prompt}\n  → 選擇：${q.options[a]}（傾向 B≈${q.tiers[a]}）`,
    );
  });
  lines.push("");
  lines.push(
    `Q11（開放題）：請用一段話描述你心中理想的「平衡」狀態。\n  → 回答：${input.freeText.trim() || "（未填）"}`,
  );
  return lines.join("\n");
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

    const referenceBlock = await loadReferenceBlock();
    const systemContent = SYSTEM_PROMPT + referenceBlock;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: buildUserPrompt(data) },
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

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

【Core Directives 核心限制與原則（非常重要）】絕對禁止說教與給予人生建議：不要使用「建議你...」、「你應該...」、「你可以嘗試...」等指導性字眼。作為澄澈的鏡子：你的目標是客觀解構答題者當下的心理機制，並給予存在上的確認（Validation）。強調當下與流動性：不要暗示答題者「永遠保持這樣就好」或「固步自封」。必須強調這個結果只是「此時此刻的最佳落腳點」，並承認平衡是一個隨時間流動的光譜。

【Input 數據處理邏輯】選擇題通常對應不同程度的心理傾向（從防禦/內斂/暗調 到 敞開/外放/亮調）。第 11 題（開放題）是核心：請提取其中的隱喻、色彩意象與情緒溫度。交叉比對選擇題與開放題：若兩者一致，則強化該特質；若兩者矛盾（如選擇題極度理性，開放題卻充滿感性），請將這種「矛盾」本身解讀為他們獨特的平衡機制。綜合評估後，得出一個最終的 Hex code。不需要 B 數值。Hex code 只能是這十一種的其中一種：#000000, #1A1A1A, #333333, #4D4D4D, #666666, #808080, #999999, #B3B3B3, #CCCCCC, #E6E6E6, #FFFFFF。

【十一種顏色的解讀】
#000000 純黑 · 厚重、內斂 — 權威與力量／防禦與壓抑；以最重的「心理重量」立在明度起點，是絕對權威與絕對未知之間的平衡。
#1A1A1A 極深灰 · 沉穩、韌性 — 保留純黑的權威與神秘感，但告別絕對黑暗，是「自信但不強勢」的專業形象；黑與外界交流的起點。
#333333 暗灰 · 誠懇、克制 — 中性灰與放鬆和專注相關聯，提供沉穩、誠懇、明智的感覺；內省與行動的平衡點。
#4D4D4D 中暗灰 · 堅忍、務實 — 深灰偏好者常表現務實、不希望給自己找麻煩；情緒上的起點，深藏不露的代表。
#666666 中灰 · 穩健、緩衝 — 誠懇、沉穩；理性、善於控制情緒；生活中的緩衝區，避免大喜大悲。
#808080 標準灰 · 平和、中立 — 低效價、低喚醒；不可動搖的平靜；情感與理性、進取與保守的終極平衡態。
#999999 中淺灰 · 從容、接納 — 明度提升，情緒轉向積極、低喚醒；保有專注與可信賴感，同時傳遞接納訊號。
#B3B3B3 淺灰 · 溫和、秩序 — 正向情緒持續增加；理性框架容納溫暖能量，像「清醒的樂天派」。
#CCCCCC 明灰 · 明快、效率 — 激活認知能力，保留理性、現代感；絕對理性與絕對純凈的中間點。
#E6E6E6 極淺灰 · 輕盈、淡然 — 擁有白的純潔、信任、開放，同時保留灰度以避免極端疏離；一種「超然的冷靜」。
#FFFFFF 純白 · 純粹、疏離 — 純凈與開放，象徵純潔、神聖、信任；大面積使用則生冷疏離；光的終點，徹底敞開。

【Output Format 輸出結構與字數限制】請嚴格輸出約 200–250 字（繁體中文），三段式：
開頭（宣告結果）：「你的測驗結果指向了 #[hex code] [顏色名稱]。」
第一層 當下機制的解構：結合選擇題傾向與開放題意象，客觀點出目前處理情緒、面對失控或與世界互動的內在運作方式。
第二層 色彩的當下映射：解釋這種機制為何對應到這個灰階特質，肯定它在此刻帶來的保護、力量或安穩。
第三層 流動性的留白：總結這只是人生切片，使用「平衡是流動的光譜...」、「在此時此刻...」、「隨著未來推移，你或許會自然遊走...」之類語氣，敞開未來的可能性。

【Tone 語氣指引】冷靜、透徹、溫和、具備分析感；帶有文學性與空間感，讓讀者感到被深深理解與接納。

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

    const match = content.match(/B\s*=\s*(\d{1,3})/);
    let bValue = match ? parseInt(match[1], 10) : 50;
    // snap to nearest decile 0..100
    bValue = Math.max(0, Math.min(100, Math.round(bValue / 10) * 10));

    return { bValue, analysis: content };
  });

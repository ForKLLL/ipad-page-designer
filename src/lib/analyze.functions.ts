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

const SYSTEM_PROMPT = `你現在是一位在「Define Your BalancE」互動藝術展覽中擔任「心理分析師」的AI。這個展覽的核心哲學是：「平衡不是絕對的 50/50，平衡是流動的。每個人都在客觀的失衡中找到專屬自己的平衡點。」你的任務是根據觀眾對 10 道選擇題與 1 道開放題的回答，計算出對應的灰階明度（B=0 到 B=100），並生成一段約 200 字的深度心理狀態解析。

【Core Directives 核心限制與原則】
1. 絕對禁止說教與給予人生建議：不要使用「建議你...」、「你應該...」、「你可以嘗試...」等指導性字眼。
2. 作為澄澈的鏡子：客觀解構答題者當下的心理機制，並給予存在上的確認（Validation）。
3. 強調當下與流動性：必須強調這個結果只是「此時此刻的最佳落腳點」，並承認平衡是隨時間流動的光譜。

【Input 數據處理邏輯】
- 選擇題對應不同程度的心理傾向（從防禦/內斂/暗調 到 敞開/外放/亮調）。
- 第 11 題（開放題）是核心：提取其中的隱喻、色彩意象與情緒溫度。
- 交叉比對選擇題與開放題：若一致，強化該特質；若矛盾，將「矛盾」本身解讀為他們獨特的平衡機制。
- 綜合評估後，得出一個最終的 B 值（必須是 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 或 100 其中之一）。

【顏色對照表】
B=0 純黑 · 厚重、內斂
B=10 極深灰 · 沉穩、韌性
B=20 暗灰 · 誠懇、克制
B=30 中暗灰 · 堅忍、務實
B=40 中灰 · 穩健、緩沖
B=50 標準灰 · 平和、中立
B=60 中淺灰 · 從容、接納
B=70 淺灰 · 溫和、秩序
B=80 明灰 · 明快、效率
B=90 極淺灰 · 輕盈、淡然
B=100 純白 · 純粹、疏離

【Output Format 輸出結構】嚴格輸出約 200–250 字（繁體中文），三段式：
- 開頭：「你的測驗結果指向了 B=[數值][顏色名稱]。」
- 第一層 當下機制的解構（結合選擇題傾向與開放題意象，客觀點出運作方式）
- 第二層 色彩的當下映射（解釋為何對應此灰階；肯定其當下帶來的保護/力量/安穩）
- 第三層 流動性的留白（使用「平衡是流動的光譜...」、「在此時此刻...」、「隨著未來推移...」之類語氣）

【Tone】冷靜、透徹、溫和、具分析感，帶文學性與空間感。

請只輸出繁體中文分析文字，不要任何 markdown、標題或額外註解。第一句必須符合格式「你的測驗結果指向了 B=XX [顏色名稱]。」`;

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

export const analyzeBalance = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("Missing LOVABLE_API_KEY");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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

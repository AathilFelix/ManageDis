import Cerebras from "@cerebras/cerebras_cloud_sdk";

let client: Cerebras | null = null;

export function getCerebras(): Cerebras {
  if (!client) {
    client = new Cerebras({
      apiKey: process.env.CEREBRAS_API_KEY,
    });
  }
  return client;
}

export async function chatCompletion(
  systemPrompt: string,
  userContent: string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>
): Promise<string> {
  const cerebras = getCerebras();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  const response = await cerebras.chat.completions.create({
    messages,
    model: "gemma-4-31b",
    max_completion_tokens: 32768,
    temperature: 0.2,
    top_p: 1,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (response as any).choices[0]?.message?.content || "";
}

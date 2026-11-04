import { BadGatewayException, Controller, Post, Body, ServiceUnavailableException } from "@nestjs/common";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ModelMessage = { role: "system" | "user" | "assistant"; content: string };

@Controller("ai")
export class AiController {
  @Post("chat")
  async chat(@Body() body: { messages?: ChatMessage[] }) {
    if (!Array.isArray(body.messages) || !body.messages.length) throw new BadGatewayException("Add a message to the chat.");
    const messages = body.messages.slice(-20).filter((message) =>
      (message.role === "user" || message.role === "assistant") && typeof message.content === "string",
    );
    const reply = await this.complete([
      { role: "system", content: "You are a concise website design assistant. Help the user improve page copy, layout, and style. Do not claim you changed the canvas; give actionable design suggestions." },
      ...messages,
    ]);
    return { reply };
  }

  @Post("generate")
  async generate(@Body() body: { prompt?: string }) {
    if (typeof body.prompt !== "string" || !body.prompt.trim()) throw new BadGatewayException("Describe the page you want to generate.");
    const content = await this.complete([
      { role: "system", content: `Create a complete landing page as JSON only, no markdown. Match this shape: {"schemaVersion":1,"id":"home-page","metadata":{"title":"Home page"},"root":{"id":"root","type":"container","props":{},"styles":{},"children":[{"id":"hero-title","type":"heading","name":"Hero heading","visible":true,"props":{"text":"...","level":"h1"},"styles":{"fontSize":"64px"},"children":[]}]}}. Node types are container, heading, text, button, image. Include useful names and valid props. Use 5-8 top-level nodes.` },
      { role: "user", content: body.prompt.trim() },
    ]);
    try { return { document: JSON.parse(content) as unknown }; }
    catch { throw new BadGatewayException("The model returned invalid page JSON. Try a shorter or clearer prompt."); }
  }

  private async complete(messages: ModelMessage[]): Promise<string> {
    const apiUrl = process.env.AI_API_URL;
    const apiKey = process.env.AI_API_KEY;
    if (!apiUrl || !apiKey) throw new ServiceUnavailableException("AI is not configured. Set AI_API_URL, AI_API_KEY, and AI_MODEL in apps/api/.env.");
    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: process.env.AI_MODEL ?? "gpt-4o-mini", messages, temperature: 0.7 }),
        signal: AbortSignal.timeout(60_000),
      });
    } catch { throw new ServiceUnavailableException("Could not reach the configured AI provider."); }
    if (!response.ok) throw new BadGatewayException(`AI provider returned ${response.status}.`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: unknown } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) throw new BadGatewayException("AI provider returned an empty response.");
    return content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
}

import {
  pageDocumentSchema,
  type PageNode,
} from "@visual-builder/document-schema";

export type GeneratedItem = {
  id: string;
  type: "section" | "heading" | "text" | "button" | "image";
  name: string;
  text: string;
  visible: boolean;
  color?: string;
  fontSize?: number;
  src?: string;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
};

export type GenerationResult = {
  items: GeneratedItem[];
  mode: "endpoint" | "local-draft";
};

export async function generatePageFromPrompt(
  prompt: string,
): Promise<GenerationResult> {
  const endpoint = import.meta.env.VITE_AI_GENERATION_ENDPOINT?.trim();
  if (!endpoint) {
    return { items: makeLocalDraft(prompt), mode: "local-draft" };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) {
    throw new Error(`AI endpoint returned ${response.status}.`);
  }

  const payload: unknown = await response.json();
  const candidate =
    typeof payload === "object" && payload !== null && "document" in payload
      ? payload.document
      : payload;
  const document = pageDocumentSchema.parse(candidate);
  return { items: documentToItems(document.root.children), mode: "endpoint" };
}

function makeLocalDraft(prompt: string): GeneratedItem[] {
  const normalized = prompt.toLowerCase();
  const topic = prompt
    .replace(/^\s*(please\s+)?(create|build|design|make|generate)\s+(me\s+)?(a|an|the)?\s*/i, "")
    .replace(/[.!?].*$/, "")
    .trim();
  const cafe = /cafe|café|coffee|restaurant|bakery|food/.test(normalized);
  const portfolio = /portfolio|photographer|designer|artist|creative|agency/.test(normalized);
  const product = /saas|software|app|startup|platform|product/.test(normalized);

  const preset = cafe
    ? {
        eyebrow: "A NEIGHBORHOOD PLACE FOR GOOD DAYS",
        heading: "Coffee worth\nslowing down for.",
        body: "Thoughtful coffee, fresh bakes, and a little room to stay awhile. Find your new favorite corner of the neighborhood.",
        cta: "Find your table",
        color: "#76533d",
        image: "Warm cafe interior with natural light",
      }
    : portfolio
      ? {
          eyebrow: "INDEPENDENT CREATIVE STUDIO",
          heading: "Make work\nthat moves people.",
          body: "A small, curious team shaping clear identities and digital experiences for people with something meaningful to say.",
          cta: "View selected work",
          color: "#7358d8",
          image: "Editorial design work arranged on a studio desk",
        }
      : product
        ? {
            eyebrow: "A BETTER WAY TO GET WORK DONE",
            heading: "Make your next\nbig idea happen.",
            body: "Bring your team, tools, and plans into one calm workspace. Spend less time coordinating and more time building.",
            cta: "Start building free",
            color: "#4d63d8",
            image: "Abstract product interface in a clean workspace",
          }
        : {
            eyebrow: "MADE FOR WHAT COMES NEXT",
            heading: topic
              ? `A fresh start\nfor ${topic}.`
              : "Make room\nfor what’s next.",
            body: `A clear, confident home for ${topic || "your next big idea"}. Tell your story, show what makes you different, and help people take the next step.`,
            cta: "Get started",
            color: "#6759d8",
            image: `A visual concept for ${topic || "a new business"}`,
          };

  return [
    { id: "nav", type: "section", name: "Navigation", text: "YOUR BRAND / STUDIO", visible: true },
    { id: "eyebrow", type: "text", name: "Eyebrow", text: preset.eyebrow, visible: true },
    { id: "title", type: "heading", name: "Hero heading", text: preset.heading, color: preset.color, fontSize: 72, visible: true },
    { id: "body", type: "text", name: "Intro text", text: preset.body, visible: true },
    { id: "cta", type: "button", name: "Primary button", text: preset.cta, visible: true, href: "#contact", variant: "primary" },
    { id: "hero-image", type: "image", name: "Hero image", text: preset.image, visible: true, src: `https://placehold.co/1200x560?text=${encodeURIComponent(preset.image)}` },
  ];
}

function documentToItems(nodes: PageNode[]): GeneratedItem[] {
  return nodes.map((node): GeneratedItem => {
    const content = node.type === "container" ? node.children[0] : node;
    const props = content?.props ?? {};
    const size = Number.parseFloat(node.styles.fontSize ?? "");
    const common = {
      id: node.id,
      name: node.name ?? node.type,
      visible: node.visible ?? true,
      color: node.styles.color,
      fontSize: Number.isNaN(size) ? undefined : size,
    };

    if (node.type === "container") {
      return { ...common, type: "section", text: String(props.text ?? "") };
    }
    if (node.type === "heading") {
      return { ...common, type: "heading", text: String(node.props.text ?? "") };
    }
    if (node.type === "button") {
      const variant = node.props.variant;
      return {
        ...common,
        type: "button",
        text: String(node.props.label ?? ""),
        href: String(node.props.href ?? "#"),
        variant: variant === "secondary" || variant === "outline" ? variant : "primary",
      };
    }
    if (node.type === "image") {
      return {
        ...common,
        type: "image",
        text: String(node.props.alt ?? ""),
        src: String(node.props.src ?? ""),
      };
    }
    return { ...common, type: "text", text: String(node.props.text ?? "") };
  });
}

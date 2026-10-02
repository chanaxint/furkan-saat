import type { ArticleBlock } from "@/lib/data/types";

/**
 * Article text as plain writing: paragraphs separated by a blank line,
 * "## " starts a subheading and "> " a pull quote.
 */
export const blocksToText = (blocks: ArticleBlock[]) =>
  blocks.map((b) => (b.type === "h" ? `## ${b.text}` : b.type === "quote" ? `> ${b.text}` : b.text)).join("\n\n");

export const textToBlocks = (text: string): ArticleBlock[] =>
  text
    .split(/\n\s*\n/)
    .map((t) => t.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .map((t) =>
      t.startsWith("## ") ? { type: "h", text: t.slice(3).trim() } : t.startsWith("> ") ? { type: "quote", text: t.slice(2).trim() } : { type: "p", text: t },
    );

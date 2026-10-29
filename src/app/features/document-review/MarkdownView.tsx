import type { ReactNode } from "react";

/**
 * Minimal, safe Markdown renderer for reviewed extraction content.
 * Builds React elements only (no HTML injection), so stored text is always
 * escaped. Supports headings, paragraphs, ordered/unordered lists, pipe
 * tables, block quotes, fenced code, rules, and **bold**, *italic*, `code`.
 * Not supported: nested lists, images, links, merged table cells, footnotes.
 */
type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "quote"; lines: string[] }
  | { type: "code"; text: string }
  | { type: "rule" };

const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_DIVIDER = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index]!;
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (/^```/.test(line)) {
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !/^```/.test(lines[index]!)) body.push(lines[index++]!);
      index += 1;
      blocks.push({ type: "code", text: body.join("\n") });
      continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1]!.length, text: heading[2]!.trim() });
      index += 1;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }
    if (TABLE_ROW.test(line) && index + 1 < lines.length && TABLE_DIVIDER.test(lines[index + 1]!)) {
      const header = splitRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && TABLE_ROW.test(lines[index]!)) rows.push(splitRow(lines[index++]!));
      blocks.push({ type: "table", header, rows });
      continue;
    }
    const listMatch = /^\s*([-*+]|\d+[.)])\s+/.exec(line);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[1]!);
      const items: string[] = [];
      const pattern = ordered ? /^\s*\d+[.)]\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;
      while (index < lines.length) {
        const item = pattern.exec(lines[index]!);
        if (!item) break;
        items.push(item[1]!);
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index]!)) quote.push(lines[index++]!.replace(/^>\s?/, ""));
      blocks.push({ type: "quote", lines: quote });
      continue;
    }
    const paragraph: string[] = [];
    while (
      index < lines.length
      && lines[index]!.trim()
      && !/^(#{1,6}\s|```|>\s?)/.test(lines[index]!)
      && !/^\s*([-*+]|\d+[.)])\s+/.test(lines[index]!)
      && !TABLE_ROW.test(lines[index]!)
    ) {
      paragraph.push(lines[index++]!);
    }
    if (paragraph.length === 0) {
      paragraph.push(line);
      index += 1;
    }
    blocks.push({ type: "paragraph", lines: paragraph });
  }
  return blocks;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let part = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${part++}`;
    if (token.startsWith("**")) nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith("`")) nodes.push(<code key={key} className="rounded px-1" style={{ background: "var(--luxia-surface-muted)" }}>{token.slice(1, -1)}</code>);
    else nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const HEADING_CLASS: Record<number, string> = {
  1: "luxia-type-title-section",
  2: "luxia-type-title-component",
  3: "luxia-type-body-default-strong",
};

export function MarkdownView({ markdown }: { markdown: string }) {
  const blocks = parseBlocks(markdown);
  const primary = { color: "var(--luxia-text-primary)" };
  return (
    <div className="space-y-3 luxia-type-body-default" style={primary}>
      {blocks.map((block, index) => {
        const key = `b${index}`;
        switch (block.type) {
          case "heading": {
            const Tag = `h${Math.min(block.level + 1, 6)}` as "h2";
            return (
              <Tag key={key} className={HEADING_CLASS[block.level] ?? "luxia-type-body-default-strong"}>
                {renderInline(block.text, key)}
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={key}>
                {block.lines.map((line, lineIndex) => (
                  <span key={lineIndex}>
                    {lineIndex > 0 ? <br /> : null}
                    {renderInline(line, `${key}-${lineIndex}`)}
                  </span>
                ))}
              </p>
            );
          case "list": {
            const ListTag = block.ordered ? "ol" : "ul";
            return (
              <ListTag key={key} className={`space-y-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInline(item, `${key}-${itemIndex}`)}</li>
                ))}
              </ListTag>
            );
          }
          case "table":
            return (
              <div key={key} className="overflow-x-auto">
                <table className="w-full border-collapse text-left luxia-type-body-dense">
                  <thead>
                    <tr>
                      {block.header.map((cell, cellIndex) => (
                        <th
                          key={cellIndex}
                          scope="col"
                          className="border px-3 py-2 luxia-type-label-small"
                          style={{ borderColor: "var(--luxia-border-subtle)", background: "var(--luxia-surface-muted)" }}
                        >
                          {renderInline(cell, `${key}-h${cellIndex}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {block.header.map((_, cellIndex) => (
                          <td key={cellIndex} className="border px-3 py-2" style={{ borderColor: "var(--luxia-border-subtle)" }}>
                            {renderInline(row[cellIndex] ?? "", `${key}-${rowIndex}-${cellIndex}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "quote":
            return (
              <blockquote key={key} className="pl-3" style={{ borderLeft: "2px solid var(--luxia-border-subtle)", color: "var(--luxia-text-secondary)" }}>
                {block.lines.map((line, lineIndex) => (
                  <p key={lineIndex}>{renderInline(line, `${key}-${lineIndex}`)}</p>
                ))}
              </blockquote>
            );
          case "code":
            return (
              <pre
                key={key}
                className="overflow-x-auto rounded-[var(--luxia-radius-control)] px-3 py-2 luxia-type-caption"
                style={{ background: "var(--luxia-surface-muted)" }}
              >
                <code>{block.text}</code>
              </pre>
            );
          case "rule":
            return <hr key={key} style={{ borderColor: "var(--luxia-border-subtle)" }} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

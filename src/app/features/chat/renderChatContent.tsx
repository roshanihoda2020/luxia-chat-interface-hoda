import type { ReactNode } from "react";
import { LX } from "@/app/features/active-data-tables/tokens";

export function renderChatMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="luxia-chat-text px-1.5 py-0.5 rounded luxia-type-body-dense font-mono"
          style={{ background: LX.blueT10, color: LX.accent }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={index} className="luxia-chat-text">{part}</span>;
  });
}

export function renderChatContent(content: string): ReactNode[] {
  return content.split("\n\n").map((block, index) => {
    const lines = block.split("\n");
    if (lines.every((line) => line.startsWith("- "))) {
      return (
        <ul key={index} className="space-y-1.5 my-2 min-w-0">
          {lines.map((line, lineIndex) => (
            <li key={lineIndex} className="flex items-start gap-2 luxia-type-body-small min-w-0">
              <span
                className="mt-[7px] w-[5px] h-[5px] rounded-full flex-shrink-0"
                style={{ background: LX.accent }}
              />
              <span className="luxia-chat-text min-w-0">{renderChatMarkdown(line.slice(2))}</span>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <p
        key={index}
        className={`luxia-chat-text luxia-type-body-small ${index > 0 ? "mt-3" : ""}`}
      >
        {renderChatMarkdown(block)}
      </p>
    );
  });
}

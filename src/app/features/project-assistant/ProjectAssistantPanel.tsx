import { useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { ProjectNavigatorIcon } from "./ProjectNavigatorIcon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet";
import {
  nextProjectAssistantMessageId,
  requestProjectAssistantResponse,
} from "./projectAssistantChat";
import type {
  ProjectAssistantConstellationRef,
  ProjectAssistantMessage,
} from "./types";

const EXAMPLE_PROMPTS = [
  "Summarize the key information in this Project",
  "What information is available here?",
  "Where should I start?",
] as const;

function MessageBubble({ message }: { message: ProjectAssistantMessage }) {
  const isUser = message.role === "user";
  const isError = message.role === "assistant-error";

  return (
    <div className={`flex min-w-0 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="min-w-0 max-w-[92%] rounded-[12px] px-3.5 py-2.5 luxia-type-body-dense whitespace-pre-wrap"
        style={{
          background: isUser
            ? "var(--luxia-brand-primary)"
            : "var(--luxia-surface-subtle)",
          color: isUser
            ? "var(--luxia-text-inverse, #fff)"
            : isError
              ? "var(--luxia-text-secondary)"
              : "var(--luxia-text-primary)",
          border: isUser
            ? "none"
            : "1px solid var(--luxia-border-subtle)",
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

export function ProjectAssistantPanel({
  open,
  onOpenChange,
  projectId,
  projectName,
  constellations,
  messages,
  onMessagesChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  constellations: ProjectAssistantConstellationRef[];
  messages: ProjectAssistantMessage[];
  onMessagesChange: (messages: ProjectAssistantMessage[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, projectId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isLoading, open]);

  function send(text?: string) {
    const trimmed = (text ?? inputValue).trim();
    if (!trimmed || isLoading) return;

    const userMessage: ProjectAssistantMessage = {
      id: nextProjectAssistantMessageId(),
      role: "user",
      content: trimmed,
    };
    onMessagesChange([...messages, userMessage]);
    setInputValue("");
    setIsLoading(true);

    void requestProjectAssistantResponse({
      userMessage: trimmed,
      projectName,
      constellations,
    })
      .then((result) => {
        onMessagesChange([
          ...messages,
          userMessage,
          {
            id: nextProjectAssistantMessageId(),
            role: result.ok ? "assistant" : "assistant-error",
            content: result.ok ? result.content : result.error,
          },
        ]);
      })
      .catch(() => {
        onMessagesChange([
          ...messages,
          userMessage,
          {
            id: nextProjectAssistantMessageId(),
            role: "assistant-error",
            content: "Something went wrong. Try asking again.",
          },
        ]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-[26rem] md:max-w-[27.5rem]"
      >
        <SheetHeader
          className="shrink-0 border-b px-4 py-3.5 pr-12 text-left"
          style={{ borderColor: "var(--luxia-border-subtle)" }}
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
              style={{
                color: "var(--luxia-brand-primary)",
                background: "var(--luxia-opacity-brand-primary-08)",
              }}
              aria-hidden
            >
              <ProjectNavigatorIcon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="luxia-type-overline-data" style={{ color: "var(--luxia-text-secondary)" }}>
                Project Navigator
              </SheetTitle>
              <p
                className="mt-0.5 truncate luxia-type-body-dense-strong"
                style={{ color: "var(--luxia-text-primary)" }}
              >
                {projectName}
              </p>
              <SheetDescription
                className="mt-1 luxia-type-caption"
                style={{ color: "var(--luxia-text-muted)" }}
              >
                Here to help you explore this Project
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-4 luxia-scrollbar luxia-scrollbar-vertical">
            {messages.length === 0 && !isLoading ? (
              <div className="flex flex-col gap-3">
                <div>
                  <p
                    className="luxia-type-title-panel"
                    style={{ color: "var(--luxia-text-primary)" }}
                  >
                    What would you like to find or understand?
                  </p>
                  <p
                    className="mt-1.5 luxia-type-body-dense"
                    style={{ color: "var(--luxia-text-muted)" }}
                  >
                    Ask about this Project, explore what&apos;s available, or get help finding where to start.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {EXAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="rounded-[10px] px-3 py-2 text-left luxia-type-caption outline-none transition-colors hover:bg-[var(--luxia-opacity-brand-primary-04)] focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)]"
                      style={{
                        color: "var(--luxia-text-secondary)",
                        background: "var(--luxia-surface-subtle)",
                        border: "1px solid var(--luxia-border-subtle)",
                      }}
                      onClick={() => send(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {isLoading ? (
                  <p
                    className="luxia-type-caption"
                    style={{ color: "var(--luxia-text-muted)" }}
                    role="status"
                  >
                    Thinking…
                  </p>
                ) : null}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <div
            className="shrink-0 border-t px-4 py-3"
            style={{ borderColor: "var(--luxia-border-subtle)" }}
          >
            <label className="sr-only" htmlFor={`project-assistant-input-${projectId}`}>
              Ask about this Project
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id={`project-assistant-input-${projectId}`}
                ref={inputRef}
                value={inputValue}
                rows={2}
                disabled={isLoading}
                placeholder="Ask about this Project..."
                className="min-h-[2.75rem] min-w-0 flex-1 resize-none rounded-[10px] border px-3 py-2 luxia-type-body-dense outline-none focus-visible:ring-2 focus-visible:ring-[var(--luxia-border-focus)] disabled:opacity-60"
                style={{
                  borderColor: "var(--luxia-border-default)",
                  background: "var(--luxia-surface)",
                  color: "var(--luxia-text-primary)",
                }}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
              />
              <Button
                type="button"
                disabled={isLoading || !inputValue.trim()}
                className="h-10 shrink-0"
                style={{
                  background: "var(--luxia-brand-primary)",
                  color: "var(--luxia-text-inverse, #fff)",
                }}
                onClick={() => send()}
                aria-label="Send"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

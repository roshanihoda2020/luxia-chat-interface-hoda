export type HomeEntityKey = string;

export function getChatEntityKey(chatId: string): HomeEntityKey {
  return `chat:${chatId}`;
}

export function getGalaxyEntityKey(conversationId: string): HomeEntityKey {
  return `galaxy:${conversationId}`;
}

export function parseEntityKey(
  key: HomeEntityKey,
): { kind: "chat" | "galaxy"; id: string } | null {
  const colon = key.indexOf(":");
  if (colon <= 0) return null;
  const kind = key.slice(0, colon);
  const id = key.slice(colon + 1);
  if ((kind === "chat" || kind === "galaxy") && id) {
    return { kind, id };
  }
  return null;
}

export function workItemEntityKey(item: {
  kind: "chat" | "galaxySession";
  chatId: string;
  conversationId: string;
}): HomeEntityKey {
  return item.kind === "galaxySession"
    ? getGalaxyEntityKey(item.conversationId)
    : getChatEntityKey(item.chatId);
}

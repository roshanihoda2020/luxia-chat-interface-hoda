export type ProjectAssistantMessageRole = "user" | "assistant" | "assistant-error";

export type ProjectAssistantMessage = {
  id: string;
  role: ProjectAssistantMessageRole;
  content: string;
};

export type ProjectAssistantConstellationRef = {
  id: string;
  name: string;
};

export type LuxiaToolStatus = "beta" | "available";

export type LuxiaToolId = "writing-assistant";

export type LuxiaToolDefinition = {
  id: LuxiaToolId;
  name: string;
  description: string;
  status?: LuxiaToolStatus;
  href: string;
};

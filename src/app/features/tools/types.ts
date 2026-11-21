export type LuxiaToolStatus = "beta" | "available";

export type LuxiaToolId = "writing-assistant" | "verifai";

export type LuxiaToolDefinition = {
  id: LuxiaToolId;
  name: string;
  description: string;
  status?: LuxiaToolStatus;
  /** Two or three short capabilities the tool has today, shown as chips on its cards. */
  highlights?: readonly string[];
  href: string;
};

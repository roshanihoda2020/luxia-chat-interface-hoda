export type KnowledgeBaseEntry = {
    id: string;
    question: string;
    answer: string;
    responseType?: string;
};

export const KB_RESPONSE_TYPES = [
    { id: "narrative", label: "Narrative" },
    { id: "table", label: "Table" },
    { id: "chart", label: "Chart" },
    { id: "kpi", label: "KPI" },
    { id: "list", label: "List" },
] as const;

export const KB_DEFAULTS: KnowledgeBaseEntry[] = [
    {
        id: "kb1",
        responseType: "narrative",
        question: "What is Luxia?",
        answer: "Luxia is an enterprise AI platform that connects your data, documents, and knowledge into intelligent conversational experiences through AI-powered Constellations.",
    },
    {
        id: "kb2",
        responseType: "list",
        question: "How do I create a Constellation?",
        answer: "Navigate to Constellations in the sidebar, click Create New, choose your data sources (databases, PDFs, or web crawlers), configure your settings, and save. It becomes available in Chat immediately.",
    },
    {
        id: "kb3",
        responseType: "narrative",
        question: "How does the Relationship feature work?",
        answer: "Relationship maps entity connections in your data using graph logic. It traverses linked records to surface related information, improving accuracy for complex multi-entity queries.",
    },
    {
        id: "kb4",
        responseType: "list",
        question: "Which documents belong to this Constellation?",
        answer: "Connected documents appear in the Extra Context Files and Active Data Table sidebar sections. Each section shows the resources Luxia searches when generating responses for this Constellation.",
    },
    {
        id: "kb5",
        responseType: "table",
        question: "What response types are available?",
        answer: "Luxia supports five response types: Narrative (natural language), Table (structured grid), Chart (visual graph), KPI (key metric), and List (bullet summary). Each Knowledge Entry can have a default type.",
    },
];

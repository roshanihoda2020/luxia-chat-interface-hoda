import {
  ACTIONS_CLEAR_ONLY,
  ACTIONS_FULL,
  ACTIONS_NO_RETRY,
  ACTIONS_NO_TRIGGER,
  ACTIONS_NO_VARIABLES,
} from "./access";
import type {
  PipelineEnabledActions,
  PipelineRunRecord,
  PipelineTaskRecord,
  PipelineTaskStatus,
  PipelineVariableRecord,
  ProjectPipelineRecord,
} from "./types";

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const NOW = Date.now();

/**
 * Prototype: seed pipelines for every sample Project so the feature is demoable.
 * Production remains Project-scoped mappings — this list is mock-only and replaceable.
 */
export const PROTOTYPE_PROJECT_IDS = [
  "project-01",
  "project-02",
  "project-03",
  "project-04",
  "project-05",
  "project-06",
] as const;

const FEEDS_BY_PROJECT: Record<string, { sales: string; customer: string }> = {
  "project-01": { sales: "con1", customer: "con2" },
  "project-02": { sales: "con6", customer: "con7" },
  "project-03": { sales: "con9", customer: "con10" },
  "project-04": { sales: "con11", customer: "con12" },
  "project-05": { sales: "con15", customer: "con16" },
  "project-06": { sales: "con17", customer: "con18" },
};

export type TopologyDef = {
  nodes: Array<{ key: string; name: string }>;
  edges: Array<[string, string]>;
};

export const TOPOLOGY_PARALLEL: TopologyDef = {
  nodes: [
    { key: "extract", name: "Extract data" },
    { key: "validate", name: "Validate" },
    { key: "transform", name: "Transform" },
    { key: "enrich", name: "Enrich" },
    { key: "quality", name: "Quality check" },
    { key: "publish", name: "Publish" },
  ],
  edges: [
    ["extract", "validate"],
    ["extract", "transform"],
    ["validate", "enrich"],
    ["transform", "enrich"],
    ["enrich", "quality"],
    ["quality", "publish"],
  ],
};

export const TOPOLOGY_CUSTOMER: TopologyDef = {
  nodes: [
    { key: "extract", name: "Extract profiles" },
    { key: "normalize", name: "Normalize" },
    { key: "match", name: "Match records" },
    { key: "score", name: "Score quality" },
    { key: "write", name: "Write results" },
  ],
  edges: [
    ["extract", "normalize"],
    ["normalize", "match"],
    ["normalize", "score"],
    ["match", "write"],
    ["score", "write"],
  ],
};

export const TOPOLOGY_LINEAR: TopologyDef = {
  nodes: [
    { key: "prepare", name: "Prepare export" },
    { key: "assemble", name: "Assemble file" },
    { key: "deliver", name: "Deliver" },
  ],
  edges: [
    ["prepare", "assemble"],
    ["assemble", "deliver"],
  ],
};

type PipelineSeedTemplate = {
  idSuffix: string;
  name: string;
  dagId: string;
  description?: string | null;
  status: ProjectPipelineRecord["status"];
  lastRunAt: string | null;
  scheduleLabel: string;
  documentationUrl?: string;
  feedsKey?: "sales" | "customer";
  enabledActions: PipelineEnabledActions;
  topology: TopologyDef;
};

const PIPELINE_SEED_TEMPLATES: readonly PipelineSeedTemplate[] = [
  {
    idSuffix: "sales-refresh",
    name: "Pipeline name 01",
    dagId: "luxia_sales_facts_daily",
    description:
      "Refreshes daily sales facts used by reporting and analytics.",
    status: "success",
    lastRunAt: new Date(NOW - MINUTE_MS * 12).toISOString(),
    scheduleLabel: "Daily at 02:00",
    documentationUrl: "https://example.com/docs/sales-facts-refresh",
    feedsKey: "sales",
    enabledActions: ACTIONS_FULL,
    topology: TOPOLOGY_PARALLEL,
  },
  {
    idSuffix: "customer-sync",
    name: "Pipeline name 02",
    dagId: "luxia_customer_profile_sync",
    description:
      "Synchronizes customer profile data used by downstream customer workflows.",
    status: "running",
    lastRunAt: new Date(NOW - MINUTE_MS * 4).toISOString(),
    scheduleLabel: "Every 6 hours",
    feedsKey: "customer",
    enabledActions: ACTIONS_NO_TRIGGER,
    topology: TOPOLOGY_CUSTOMER,
  },
  {
    idSuffix: "inventory",
    name: "Pipeline name 03",
    dagId: "luxia_inventory_snapshot",
    description:
      "Creates an inventory snapshot and validates the latest stock state.",
    status: "failed",
    lastRunAt: new Date(NOW - HOUR_MS * 5).toISOString(),
    scheduleLabel: "Every 6 hours",
    documentationUrl: "https://example.com/docs/inventory-snapshot",
    enabledActions: ACTIONS_NO_VARIABLES,
    topology: TOPOLOGY_PARALLEL,
  },
  {
    idSuffix: "manual-export",
    name: "Pipeline name 04",
    dagId: "luxia_finance_export",
    description: "Exports finance data for downstream reporting workflows.",
    status: "paused",
    lastRunAt: new Date(NOW - DAY_MS * 3).toISOString(),
    scheduleLabel: "Manual",
    // Primary failed-task Retry demo: Assemble file failed; clear/retry enabled only.
    enabledActions: ACTIONS_CLEAR_ONLY,
    topology: TOPOLOGY_LINEAR,
  },
  {
    idSuffix: "archive-backfill",
    name: "Pipeline name 05",
    dagId: "luxia_archive_backfill",
    description: "Backfills historical archive data for older reporting periods.",
    status: "paused",
    // Align with seeded failed run used for clear=false mapping-gate Retry demo.
    lastRunAt: new Date(NOW - DAY_MS * 5).toISOString(),
    scheduleLabel: "Manual",
    enabledActions: ACTIONS_NO_RETRY,
    topology: TOPOLOGY_LINEAR,
  },
];

function pipelineIdFor(projectId: string, idSuffix: string): string {
  return `pipeline-${idSuffix}-${projectId}`;
}

function seedPipelinesForProject(projectId: string): ProjectPipelineRecord[] {
  const feeds = FEEDS_BY_PROJECT[projectId];
  return PIPELINE_SEED_TEMPLATES.map((template) => ({
    id: pipelineIdFor(projectId, template.idSuffix),
    projectId,
    name: template.name,
    dagId: template.dagId,
    description: template.description ?? null,
    status: template.status,
    lastRunAt: template.lastRunAt,
    scheduleLabel: template.scheduleLabel,
    documentationUrl: template.documentationUrl,
    feedsConstellationId:
      template.feedsKey && feeds ? feeds[template.feedsKey] : null,
    enabledActions: { ...template.enabledActions },
  }));
}

export const SEED_PROJECT_PIPELINES: ProjectPipelineRecord[] =
  PROTOTYPE_PROJECT_IDS.flatMap((projectId) => seedPipelinesForProject(projectId));

function buildTasksForRun(input: {
  projectId: string;
  pipelineId: string;
  runId: string;
  topology: TopologyDef;
  statusByKey: Record<string, PipelineTaskStatus>;
  durationByKey?: Record<string, number | null>;
}): PipelineTaskRecord[] {
  const upstream = new Map<string, string[]>();
  for (const node of input.topology.nodes) upstream.set(node.key, []);
  for (const [from, to] of input.topology.edges) {
    upstream.get(to)?.push(from);
  }

  return input.topology.nodes.map((node) => ({
    id: `task-${input.runId}-${node.key}`,
    runId: input.runId,
    pipelineId: input.pipelineId,
    projectId: input.projectId,
    taskKey: node.key,
    name: node.name,
    status: input.statusByKey[node.key] ?? "success",
    durationSeconds:
      input.durationByKey && Object.prototype.hasOwnProperty.call(input.durationByKey, node.key)
        ? input.durationByKey[node.key]!
        : input.statusByKey[node.key] === "running"
          ? null
          : input.statusByKey[node.key] === "queued"
            || input.statusByKey[node.key] === "skipped"
            || input.statusByKey[node.key] === "upstream_failed"
            ? null
            : 45,
    attempt: input.statusByKey[node.key] === "failed" ? 2 : 1,
    upstreamKeys: upstream.get(node.key) ?? [],
  }));
}

function allSuccess(topology: TopologyDef): Record<string, PipelineTaskStatus> {
  return Object.fromEntries(topology.nodes.map((n) => [n.key, "success" as const]));
}

type RunSeed = {
  run: PipelineRunRecord;
  tasks: PipelineTaskRecord[];
};

function seedRunsForPipeline(
  projectId: string,
  template: PipelineSeedTemplate,
): RunSeed[] {
  const pipelineId = pipelineIdFor(projectId, template.idSuffix);
  const { topology, idSuffix } = template;

  if (idSuffix === "archive-backfill") {
    // Mapping-gate Retry demo: ACTIONS_NO_RETRY (clear=false) — Owner still cannot Retry.
    const run1 = `run-archive-1-${projectId}`;
    const failedMap: Record<string, PipelineTaskStatus> = {
      prepare: "success",
      assemble: "failed",
      deliver: "upstream_failed",
    };
    return [
      {
        run: {
          id: run1,
          pipelineId,
          projectId,
          status: "failed",
          startedAt: new Date(NOW - DAY_MS * 5).toISOString(),
          durationSeconds: 4 * 60 + 40,
          taskCount: topology.nodes.length,
          failedTaskCount: 1,
        },
        tasks: buildTasksForRun({
          projectId,
          pipelineId,
          runId: run1,
          topology,
          statusByKey: failedMap,
          durationByKey: { prepare: 90, assemble: 180, deliver: null },
        }),
      },
    ];
  }

  if (idSuffix === "sales-refresh") {
    const transformFailedMap: Record<string, PipelineTaskStatus> = {
      extract: "success",
      validate: "success",
      transform: "failed",
      enrich: "upstream_failed",
      quality: "upstream_failed",
      publish: "upstream_failed",
    };
    const successDurations = {
      extract: 72,
      validate: 40,
      transform: 118,
      enrich: 95,
      quality: 55,
      publish: 64,
    } as const;

    const historySpecs: Array<{
      id: string;
      status: PipelineRunRecord["status"];
      startedAt: string;
      durationSeconds: number | null;
      failedTaskCount?: number;
      statusByKey: Record<string, PipelineTaskStatus>;
      durationByKey?: Record<string, number | null>;
    }> = [
      {
        id: `run-sales-1-${projectId}`,
        status: "success",
        startedAt: new Date(NOW - MINUTE_MS * 12).toISOString(),
        durationSeconds: 8 * 60 + 24,
        statusByKey: allSuccess(topology),
        durationByKey: { ...successDurations },
      },
      {
        id: `run-sales-2-${projectId}`,
        status: "success",
        startedAt: new Date(NOW - DAY_MS - HOUR_MS * 2).toISOString(),
        durationSeconds: 9 * 60 + 2,
        statusByKey: allSuccess(topology),
      },
      {
        id: `run-sales-3-${projectId}`,
        status: "failed",
        startedAt: new Date(NOW - DAY_MS * 2 - HOUR_MS).toISOString(),
        durationSeconds: 4 * 60 + 18,
        failedTaskCount: 1,
        statusByKey: transformFailedMap,
        durationByKey: {
          extract: 70,
          validate: 38,
          transform: 98,
          enrich: null,
          quality: null,
          publish: null,
        },
      },
      {
        id: `run-sales-4-${projectId}`,
        status: "success",
        startedAt: new Date(NOW - DAY_MS * 3).toISOString(),
        durationSeconds: 7 * 60 + 55,
        statusByKey: allSuccess(topology),
      },
      {
        id: `run-sales-5-${projectId}`,
        status: "success",
        startedAt: new Date(NOW - DAY_MS * 4 - HOUR_MS).toISOString(),
        durationSeconds: 8 * 60 + 5,
        statusByKey: allSuccess(topology),
      },
      {
        id: `run-sales-6-${projectId}`,
        status: "failed",
        startedAt: new Date(NOW - DAY_MS * 5 - HOUR_MS * 3).toISOString(),
        durationSeconds: 3 * 60 + 50,
        failedTaskCount: 1,
        statusByKey: transformFailedMap,
        durationByKey: {
          extract: 68,
          validate: 36,
          transform: 90,
          enrich: null,
          quality: null,
          publish: null,
        },
      },
      {
        id: `run-sales-7-${projectId}`,
        status: "success",
        startedAt: new Date(NOW - DAY_MS * 6).toISOString(),
        durationSeconds: 8 * 60 + 40,
        statusByKey: allSuccess(topology),
      },
      {
        id: `run-sales-8-${projectId}`,
        status: "success",
        startedAt: new Date(NOW - DAY_MS * 7 - HOUR_MS * 2).toISOString(),
        durationSeconds: 7 * 60 + 20,
        statusByKey: allSuccess(topology),
      },
      {
        id: `run-sales-9-${projectId}`,
        status: "success",
        startedAt: new Date(NOW - DAY_MS * 8).toISOString(),
        durationSeconds: 9 * 60 + 12,
        statusByKey: allSuccess(topology),
      },
      {
        id: `run-sales-10-${projectId}`,
        status: "success",
        startedAt: new Date(NOW - DAY_MS * 9 - HOUR_MS).toISOString(),
        durationSeconds: 8 * 60 + 8,
        statusByKey: allSuccess(topology),
      },
    ];

    return historySpecs.map((spec) => ({
      run: {
        id: spec.id,
        pipelineId,
        projectId,
        status: spec.status,
        startedAt: spec.startedAt,
        durationSeconds: spec.durationSeconds,
        taskCount: topology.nodes.length,
        failedTaskCount: spec.failedTaskCount,
      },
      tasks: buildTasksForRun({
        projectId,
        pipelineId,
        runId: spec.id,
        topology,
        statusByKey: spec.statusByKey,
        durationByKey: spec.durationByKey,
      }),
    }));
  }

  if (idSuffix === "customer-sync") {
    const run1 = `run-customer-1-${projectId}`;
    const run2 = `run-customer-2-${projectId}`;
    const run3 = `run-customer-3-${projectId}`;
    const run4 = `run-customer-4-${projectId}`;
    // TOPOLOGY_CUSTOMER in-progress demo: match running; score/write queued.
    const runningMap: Record<string, PipelineTaskStatus> = {
      extract: "success",
      normalize: "success",
      match: "running",
      score: "queued",
      write: "queued",
    };
    return [
      {
        run: {
          id: run1,
          pipelineId,
          projectId,
          status: "running",
          startedAt: new Date(NOW - MINUTE_MS * 4).toISOString(),
          durationSeconds: null,
          taskCount: topology.nodes.length,
        },
        tasks: buildTasksForRun({
          projectId,
          pipelineId,
          runId: run1,
          topology,
          statusByKey: runningMap,
          durationByKey: {
            extract: 50,
            normalize: 42,
            match: null,
            score: null,
            write: null,
          },
        }),
      },
      {
        run: {
          id: run2,
          pipelineId,
          projectId,
          status: "success",
          startedAt: new Date(NOW - HOUR_MS * 6 - MINUTE_MS * 10).toISOString(),
          durationSeconds: 11 * 60 + 40,
          taskCount: topology.nodes.length,
        },
        tasks: buildTasksForRun({
          projectId,
          pipelineId,
          runId: run2,
          topology,
          statusByKey: {
            extract: "success",
            normalize: "success",
            match: "success",
            score: "skipped",
            write: "success",
          },
          durationByKey: {
            extract: 48,
            normalize: 40,
            match: 95,
            score: null,
            write: 70,
          },
        }),
      },
      {
        run: {
          id: run3,
          pipelineId,
          projectId,
          status: "success",
          startedAt: new Date(NOW - HOUR_MS * 12).toISOString(),
          durationSeconds: 10 * 60 + 5,
          taskCount: topology.nodes.length,
        },
        tasks: buildTasksForRun({
          projectId,
          pipelineId,
          runId: run3,
          topology,
          statusByKey: allSuccess(topology),
        }),
      },
      {
        run: {
          id: run4,
          pipelineId,
          projectId,
          status: "failed",
          startedAt: new Date(NOW - DAY_MS - HOUR_MS * 2).toISOString(),
          durationSeconds: 5 * 60 + 20,
          taskCount: topology.nodes.length,
          failedTaskCount: 1,
        },
        tasks: buildTasksForRun({
          projectId,
          pipelineId,
          runId: run4,
          topology,
          statusByKey: {
            extract: "success",
            normalize: "success",
            match: "failed",
            score: "success",
            write: "upstream_failed",
          },
          durationByKey: {
            extract: 46,
            normalize: 38,
            match: 110,
            score: 34,
            write: null,
          },
        }),
      },
    ];
  }

  if (idSuffix === "inventory") {
    const run1 = `run-inventory-1-${projectId}`;
    const run2 = `run-inventory-2-${projectId}`;
    const run3 = `run-inventory-3-${projectId}`;
    const run4 = `run-inventory-4-${projectId}`;
    const failedMap: Record<string, PipelineTaskStatus> = {
      extract: "success",
      validate: "success",
      transform: "failed",
      enrich: "upstream_failed",
      quality: "upstream_failed",
      publish: "upstream_failed",
    };
    return [
      {
        run: {
          id: run1,
          pipelineId,
          projectId,
          status: "failed",
          startedAt: new Date(NOW - HOUR_MS * 5).toISOString(),
          durationSeconds: 3 * 60 + 42,
          taskCount: topology.nodes.length,
          failedTaskCount: 1,
        },
        tasks: buildTasksForRun({
          projectId,
          pipelineId,
          runId: run1,
          topology,
          statusByKey: failedMap,
          durationByKey: {
            extract: 48,
            validate: 30,
            transform: 84,
            enrich: null,
            quality: null,
            publish: null,
          },
        }),
      },
      {
        run: {
          id: run2,
          pipelineId,
          projectId,
          status: "success",
          startedAt: new Date(NOW - HOUR_MS * 11).toISOString(),
          durationSeconds: 6 * 60 + 15,
          taskCount: topology.nodes.length,
        },
        tasks: buildTasksForRun({
          projectId,
          pipelineId,
          runId: run2,
          topology,
          statusByKey: allSuccess(topology),
        }),
      },
      {
        run: {
          id: run3,
          pipelineId,
          projectId,
          status: "success",
          startedAt: new Date(NOW - DAY_MS - HOUR_MS).toISOString(),
          durationSeconds: 5 * 60 + 50,
          taskCount: topology.nodes.length,
        },
        tasks: buildTasksForRun({
          projectId,
          pipelineId,
          runId: run3,
          topology,
          statusByKey: allSuccess(topology),
        }),
      },
      {
        run: {
          id: run4,
          pipelineId,
          projectId,
          status: "failed",
          startedAt: new Date(NOW - DAY_MS * 2 - HOUR_MS * 4).toISOString(),
          durationSeconds: 4 * 60 + 5,
          taskCount: topology.nodes.length,
          failedTaskCount: 1,
        },
        tasks: buildTasksForRun({
          projectId,
          pipelineId,
          runId: run4,
          topology,
          statusByKey: failedMap,
          durationByKey: {
            extract: 50,
            validate: 28,
            transform: 76,
            enrich: null,
            quality: null,
            publish: null,
          },
        }),
      },
    ];
  }

  if (idSuffix === "manual-export") {
    const run1 = `run-finance-1-${projectId}`;
    const run2 = `run-finance-2-${projectId}`;
    const failedMap: Record<string, PipelineTaskStatus> = {
      prepare: "success",
      assemble: "failed",
      deliver: "upstream_failed",
    };
    return [
      {
        run: {
          id: run1,
          pipelineId,
          projectId,
          status: "failed",
          startedAt: new Date(NOW - DAY_MS * 3).toISOString(),
          durationSeconds: 6 * 60 + 10,
          taskCount: topology.nodes.length,
          failedTaskCount: 1,
        },
        tasks: buildTasksForRun({
          projectId,
          pipelineId,
          runId: run1,
          topology,
          statusByKey: failedMap,
          durationByKey: { prepare: 120, assemble: 210, deliver: null },
        }),
      },
      {
        run: {
          id: run2,
          pipelineId,
          projectId,
          status: "success",
          startedAt: new Date(NOW - DAY_MS * 10).toISOString(),
          durationSeconds: 14 * 60 + 20,
          taskCount: topology.nodes.length,
        },
        tasks: buildTasksForRun({
          projectId,
          pipelineId,
          runId: run2,
          topology,
          statusByKey: allSuccess(topology),
          durationByKey: { prepare: 120, assemble: 400, deliver: 180 },
        }),
      },
    ];
  }

  return [];
}

const SEEDED_RUNS = PROTOTYPE_PROJECT_IDS.flatMap((projectId) =>
  PIPELINE_SEED_TEMPLATES.flatMap((template) => seedRunsForPipeline(projectId, template)),
);

export const SEED_PIPELINE_RUNS: PipelineRunRecord[] = SEEDED_RUNS.map((item) => item.run);

export const SEED_PIPELINE_TASKS: PipelineTaskRecord[] = SEEDED_RUNS.flatMap(
  (item) => item.tasks,
);

function seedVariablesForProject(projectId: string): PipelineVariableRecord[] {
  const salesId = pipelineIdFor(projectId, "sales-refresh");
  const customerId = pipelineIdFor(projectId, "customer-sync");
  const archiveId = pipelineIdFor(projectId, "archive-backfill");
  const financeId = pipelineIdFor(projectId, "manual-export");

  return [
    {
      id: `var-lookback-${projectId}`,
      pipelineId: salesId,
      projectId,
      key: "lookback_days",
      label: "Lookback days",
      description: "How many days of sales history to refresh on each run.",
      type: "number",
      value: 7,
      sensitive: false,
    },
    {
      id: `var-region-${projectId}`,
      pipelineId: salesId,
      projectId,
      key: "region_scope",
      label: "Region scope",
      description: "Limits which sales regions are included.",
      type: "select",
      value: "all",
      sensitive: false,
      allowedValues: ["all", "emea", "americas", "apac"],
      selectOptions: [
        { value: "all", label: "All regions" },
        { value: "emea", label: "EMEA" },
        { value: "americas", label: "Americas" },
        { value: "apac", label: "APAC" },
      ],
    },
    {
      id: `var-notify-${projectId}`,
      pipelineId: salesId,
      projectId,
      key: "notify_on_failure",
      label: "Notify on failure",
      description: "Send a notification when a run fails.",
      type: "boolean",
      value: true,
      sensitive: false,
    },
    {
      id: `var-api-${projectId}`,
      pipelineId: customerId,
      projectId,
      key: "crm_api_token",
      label: "CRM API token",
      description: "Credential used to read customer profiles. Stored securely.",
      type: "text",
      value: null,
      sensitive: true,
    },
    {
      id: `var-batch-${projectId}`,
      pipelineId: customerId,
      projectId,
      key: "batch_size",
      label: "Batch size",
      description: "Number of profiles processed per batch.",
      type: "number",
      value: 500,
      sensitive: false,
    },
    {
      id: `var-note-${projectId}`,
      pipelineId: archiveId,
      projectId,
      key: "archive_note",
      label: "Archive note",
      description: "Optional note applied to future archive runs.",
      type: "text",
      value: "",
      sensitive: false,
    },
    {
      id: `var-finance-format-${projectId}`,
      pipelineId: financeId,
      projectId,
      key: "export_format",
      label: "Export format",
      description: "File format used for finance exports.",
      type: "select",
      value: "csv",
      sensitive: false,
      allowedValues: ["csv", "xlsx"],
      selectOptions: [
        { value: "csv", label: "CSV" },
        { value: "xlsx", label: "Excel (.xlsx)" },
      ],
    },
  ];
}

export const SEED_PIPELINE_VARIABLES: PipelineVariableRecord[] =
  PROTOTYPE_PROJECT_IDS.flatMap((projectId) => seedVariablesForProject(projectId));

export function getTopologyForPipelineId(pipelineId: string): TopologyDef {
  const suffix = PIPELINE_SEED_TEMPLATES.find((t) =>
    pipelineId.includes(`-${t.idSuffix}-`),
  );
  return suffix?.topology ?? TOPOLOGY_LINEAR;
}

export function getPipelinesForProject(
  projectId: string,
  source: readonly ProjectPipelineRecord[] = SEED_PROJECT_PIPELINES,
): ProjectPipelineRecord[] {
  return source.filter((item) => item.projectId === projectId);
}

/**
 * Prototype: Project-scoped visible Pipeline count for nav/collectors.
 * Replace with mapped-pipeline/API counts when backend is wired.
 */
export function getVisiblePipelineCountForProject(
  projectId: string,
  source: readonly ProjectPipelineRecord[] = SEED_PROJECT_PIPELINES,
): number {
  return getPipelinesForProject(projectId, source).length;
}

export function getPipelineById(
  projectId: string,
  pipelineId: string,
  source: readonly ProjectPipelineRecord[] = SEED_PROJECT_PIPELINES,
): ProjectPipelineRecord | null {
  return (
    source.find(
      (item) => item.projectId === projectId && item.id === pipelineId,
    ) ?? null
  );
}

export function getRunsForPipeline(
  projectId: string,
  pipelineId: string,
  source: readonly PipelineRunRecord[] = SEED_PIPELINE_RUNS,
): PipelineRunRecord[] {
  return source
    .filter(
      (item) => item.projectId === projectId && item.pipelineId === pipelineId,
    )
    .slice()
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
}

export function getRunById(
  projectId: string,
  pipelineId: string,
  runId: string,
  source: readonly PipelineRunRecord[] = SEED_PIPELINE_RUNS,
): PipelineRunRecord | null {
  return (
    source.find(
      (item) =>
        item.projectId === projectId
        && item.pipelineId === pipelineId
        && item.id === runId,
    ) ?? null
  );
}

export function getTasksForRun(
  runId: string,
  source: readonly PipelineTaskRecord[] = SEED_PIPELINE_TASKS,
): PipelineTaskRecord[] {
  return source.filter((item) => item.runId === runId);
}

export function getVariablesForPipeline(
  projectId: string,
  pipelineId: string,
  source: readonly PipelineVariableRecord[] = SEED_PIPELINE_VARIABLES,
): PipelineVariableRecord[] {
  return source.filter(
    (item) => item.projectId === projectId && item.pipelineId === pipelineId,
  );
}

export function createPrototypeRunningRun(input: {
  projectId: string;
  pipeline: ProjectPipelineRecord;
}): { run: PipelineRunRecord; tasks: PipelineTaskRecord[] } {
  const topology = getTopologyForPipelineId(input.pipeline.id);
  const runId = `run-manual-${Date.now()}-${input.projectId}`;

  const depth = new Map<string, number>();
  function resolveDepth(key: string, visiting: Set<string>): number {
    const cached = depth.get(key);
    if (cached != null) return cached;
    if (visiting.has(key)) return 0;
    visiting.add(key);
    const ups = topology.edges.filter(([, to]) => to === key).map(([from]) => from);
    const value =
      ups.length === 0
        ? 0
        : Math.max(...ups.map((up) => resolveDepth(up, visiting))) + 1;
    visiting.delete(key);
    depth.set(key, value);
    return value;
  }
  for (const node of topology.nodes) resolveDepth(node.key, new Set());

  const depths = topology.nodes.map((node) => depth.get(node.key) ?? 0);
  const maxDepth = Math.max(0, ...depths);
  const runningDepth = Math.min(1, maxDepth);

  const statusByKey: Record<string, PipelineTaskStatus> = {};
  const durationByKey: Record<string, number | null> = {};
  let assignedRunning = false;
  for (const node of topology.nodes) {
    const d = depth.get(node.key) ?? 0;
    if (d < runningDepth) {
      statusByKey[node.key] = "success";
      durationByKey[node.key] = 40 + d * 12;
    } else if (d === runningDepth && !assignedRunning) {
      statusByKey[node.key] = "running";
      durationByKey[node.key] = null;
      assignedRunning = true;
    } else {
      statusByKey[node.key] = "queued";
      durationByKey[node.key] = null;
    }
  }

  const run: PipelineRunRecord = {
    id: runId,
    pipelineId: input.pipeline.id,
    projectId: input.projectId,
    status: "running",
    startedAt: new Date().toISOString(),
    durationSeconds: null,
    taskCount: topology.nodes.length,
  };
  const tasks = buildTasksForRun({
    projectId: input.projectId,
    pipelineId: input.pipeline.id,
    runId,
    topology,
    statusByKey,
    durationByKey,
  });
  return { run, tasks };
}

export function applyPrototypeTaskRetry(
  tasks: PipelineTaskRecord[],
  taskId: string,
): PipelineTaskRecord[] {
  const target = tasks.find((item) => item.id === taskId);
  if (!target) return tasks;
  // Production clear: target task only, within this run — no upstream/downstream expansion.
  const runId = target.runId;
  const taskKey = target.taskKey;
  return tasks.map((task) => {
    if (task.runId !== runId) return task;
    if (task.taskKey !== taskKey) return task;
    return {
      ...task,
      status: "queued",
      durationSeconds: null,
      attempt: task.attempt + 1,
    };
  });
}

/**
 * Prototype catalog for Settings → Analytics filters.
 *
 * This is a Luxia internal/platform-admin UX preview, not a product claim
 * that Organization Admin has cross-tenant visibility. Replace with
 * production tenant/org grants when the permission model is confirmed.
 */

export const ANALYTICS_ALL_SCOPE_ID = "all";

export interface AnalyticsTenantOption {
  id: string;
  name: string;
}

export interface AnalyticsOrganizationOption {
  id: string;
  name: string;
  tenantId: string;
}

export const ANALYTICS_TENANTS: AnalyticsTenantOption[] = [
  { id: "tenant-luxia", name: "Luxia" },
  { id: "tenant-northwind", name: "Northwind" },
  { id: "tenant-acme", name: "Acme Industries" },
  { id: "tenant-contoso", name: "Contoso" },
  { id: "tenant-globex", name: "Globex" },
  { id: "tenant-initech", name: "Initech" },
  { id: "tenant-umbrella", name: "Umbrella" },
  { id: "tenant-stark", name: "Stark Industries" },
  { id: "tenant-wayne", name: "Wayne Enterprises" },
  { id: "tenant-hooli", name: "Hooli" },
  { id: "tenant-pied-piper", name: "Pied Piper" },
  { id: "tenant-soylent", name: "Soylent" },
  { id: "tenant-massive", name: "Massive Dynamic" },
  { id: "tenant-oscorp", name: "Oscorp" },
  { id: "tenant-wonka", name: "Wonka" },
  { id: "tenant-vandelay", name: "Vandelay Industries" },
];

export const ANALYTICS_ORGANIZATIONS: AnalyticsOrganizationOption[] = [
  { id: "org-luxia-demo", name: "Luxia Demo", tenantId: "tenant-luxia" },
  { id: "org-luxia-ops", name: "Luxia Operations", tenantId: "tenant-luxia" },
  { id: "org-northwind-analytics", name: "Northwind Analytics", tenantId: "tenant-northwind" },
  { id: "org-northwind-support", name: "Northwind Support", tenantId: "tenant-northwind" },
  { id: "org-acme-corp", name: "Acme Corporate", tenantId: "tenant-acme" },
  { id: "org-acme-labs", name: "Acme Labs", tenantId: "tenant-acme" },
  { id: "org-contoso-hq", name: "Contoso HQ", tenantId: "tenant-contoso" },
  { id: "org-contoso-emea", name: "Contoso EMEA", tenantId: "tenant-contoso" },
  { id: "org-globex-main", name: "Globex Main", tenantId: "tenant-globex" },
  { id: "org-initech-it", name: "Initech IT", tenantId: "tenant-initech" },
  { id: "org-initech-finance", name: "Initech Finance", tenantId: "tenant-initech" },
  { id: "org-umbrella-rd", name: "Umbrella R&D", tenantId: "tenant-umbrella" },
  { id: "org-stark-rd", name: "Stark R&D", tenantId: "tenant-stark" },
  { id: "org-stark-defense", name: "Stark Defense", tenantId: "tenant-stark" },
  { id: "org-wayne-applied", name: "Wayne Applied Sciences", tenantId: "tenant-wayne" },
  { id: "org-hooli-nucleus", name: "Hooli Nucleus", tenantId: "tenant-hooli" },
  { id: "org-pied-piper-core", name: "Pied Piper Core", tenantId: "tenant-pied-piper" },
  { id: "org-soylent-ops", name: "Soylent Operations", tenantId: "tenant-soylent" },
  { id: "org-massive-lab", name: "Massive Dynamic Lab", tenantId: "tenant-massive" },
  { id: "org-oscorp-science", name: "Oscorp Science", tenantId: "tenant-oscorp" },
  { id: "org-wonka-factory", name: "Wonka Factory", tenantId: "tenant-wonka" },
  { id: "org-vandelay-import", name: "Vandelay Import", tenantId: "tenant-vandelay" },
  { id: "org-vandelay-latex", name: "Vandelay Latex", tenantId: "tenant-vandelay" },
];

export function organizationsForTenant(
  tenantId: string,
  organizations: AnalyticsOrganizationOption[] = ANALYTICS_ORGANIZATIONS,
): AnalyticsOrganizationOption[] {
  if (tenantId === ANALYTICS_ALL_SCOPE_ID) return organizations;
  return organizations.filter((item) => item.tenantId === tenantId);
}

export function analyticsScopeMatches(
  row: { tenantId: string; organizationId: string },
  tenantId: string,
  organizationId: string,
): boolean {
  if (organizationId !== ANALYTICS_ALL_SCOPE_ID) return row.organizationId === organizationId;
  if (tenantId !== ANALYTICS_ALL_SCOPE_ID) return row.tenantId === tenantId;
  return true;
}

export function analyticsScopeScale(tenantId: string, organizationId: string): number {
  if (organizationId !== ANALYTICS_ALL_SCOPE_ID) return 0.36;
  if (tenantId !== ANALYTICS_ALL_SCOPE_ID) return 0.62;
  return 1;
}

export function tenantLabel(tenantId: string): string {
  return ANALYTICS_TENANTS.find((item) => item.id === tenantId)?.name ?? tenantId;
}

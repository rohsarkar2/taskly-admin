/**
 * Maps API payloads onto the app's domain types.
 *
 * The wire shapes are narrower than what the UI renders — no avatar colour, and
 * a few fields go by different names — so this is where the gap is filled,
 * rather than in each component.
 */

import type { Employee, EmployeeStatus, Role } from "@/lib/types";
import { EMPLOYEE_STATUSES, ROLES } from "@/lib/types";
import type { ApiEmployee } from "./types";

/** The categorical slots, reused as avatar tints. */
const AVATAR_COLORS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#4a3aa7",
  "#008300",
  "#e34948",
];

/**
 * Picks a stable colour from the employee's id.
 *
 * Deterministic on purpose: a random pick would differ between the server and
 * client renders and trip hydration.
 */
export function avatarColorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/**
 * The API speaks snake_case (`team_lead`, `active`); the UI speaks title case
 * (`Team Lead`, `Active`). Comparing on a normalised key covers both, plus the
 * hyphenated and spaced variants.
 */
const normalizeKey = (value: string) =>
  value.trim().toLowerCase().replace(/[\s_-]+/g, "");

function toRole(value: string | undefined): Role {
  if (!value) return "Team Member";
  const key = normalizeKey(value);
  return ROLES.find((role) => normalizeKey(role) === key) ?? "Team Member";
}

function toStatus(value: string | undefined): EmployeeStatus {
  if (!value) return "Pending";
  const key = normalizeKey(value);
  return (
    EMPLOYEE_STATUSES.find((status) => normalizeKey(status) === key) ?? "Pending"
  );
}

/**
 * Converts a UI role back to the API's snake_case enum for writes.
 *
 * The list endpoint stores `team_lead`, so that is treated as canonical — the
 * written spec's `"Team Lead"` form appears to be display text only.
 */
export function toApiRole(role: Role): string {
  return role.trim().toLowerCase().replace(/\s+/g, "_");
}

export function toApiStatus(status: EmployeeStatus): string {
  return status.trim().toLowerCase();
}

/** Trims an ISO timestamp down to the `YYYY-MM-DD` the UI formats. */
function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

export function toEmployee(source: ApiEmployee): Employee {
  return {
    id: source.id,
    name: source.name,
    email: source.email,
    role: toRole(source.role),
    status: toStatus(source.status),
    // The API names these `createdAt` / `approvedAt`; the spec called them
    // `registeredAt` / `joinedAt`. Accept either.
    registeredAt:
      toDateOnly(source.registeredAt) ?? toDateOnly(source.createdAt) ?? "",
    joinedAt: toDateOnly(source.joinedAt) ?? toDateOnly(source.approvedAt),
    phone: source.phone ?? source.phoneNumber ?? undefined,
    jobTitle:
      source.jobTitle ?? source.designation ?? source.department ?? undefined,
    projectIds: source.projectIds ?? [],
    avatarColor: avatarColorFor(source.id || source.email || source.name),
  };
}

export function toEmployees(source: ApiEmployee[]): Employee[] {
  return source.map(toEmployee);
}

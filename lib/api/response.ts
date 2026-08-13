import type { ApiResponse } from "./types";

export function unwrapResponse<T>(body: unknown): ApiResponse<T> {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const enveloped = "data" in record && record.data !== undefined;

    return {
      success: typeof record.success === "boolean" ? record.success : true,
      message: typeof record.message === "string" ? record.message : "",
      data: (enveloped ? record.data : body) as T,
    };
  }

  return { success: true, message: "", data: body as T };
}

export interface ListResult<T> {
  message: string;
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

function firstArrayValue(container: Record<string, unknown>): unknown[] | null {
  for (const value of Object.values(container)) {
    if (Array.isArray(value)) return value;
  }
  return null;
}

export function unwrapList<T>(
  body: unknown,
  collectionKey?: string,
): ListResult<T> {
  const outer = isRecord(body) ? body : {};
  const message = typeof outer.message === "string" ? outer.message : "";

  const inner = isRecord(outer.data) ? outer.data : outer;

  const items = (Array.isArray(body)
    ? body
    : collectionKey && Array.isArray(inner[collectionKey])
      ? inner[collectionKey]
      : Array.isArray(outer.data)
        ? outer.data
        : Array.isArray(inner.data)
          ? inner.data
          : (firstArrayValue(inner) ?? [])) as T[];

  const paging = isRecord(outer.pagination)
    ? outer.pagination
    : isRecord(inner.pagination)
      ? inner.pagination
      : inner;

  const asNumber = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  const asBoolean = (value: unknown, fallback: boolean) =>
    typeof value === "boolean" ? value : fallback;

  const page = asNumber(paging.currentPage ?? paging.page, 1);
  const total = asNumber(paging.total, items.length);
  const limit = asNumber(paging.limit, items.length);

  return {
    message,
    items,
    page,
    limit,
    total,
    totalPages: asNumber(
      paging.totalPages,
      limit > 0 ? Math.ceil(total / limit) : 1,
    ),
    hasNextPage: asBoolean(paging.hasNextPage, page * limit < total),
    hasPrevPage: asBoolean(paging.hasPrevPage, page > 1),
  };
}


import { axiosPrivate } from "@/app/axios/Axios";
import { ADMIN_ENDPOINTS } from "./endpoints";
import { unwrapResponse } from "./response";
import type {
  ApiResponse,
  ReportCatalogData,
  ReportData,
  ReportFormat,
  ReportType,
} from "./types";

export async function getReportCatalog(): Promise<
  ApiResponse<ReportCatalogData>
> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.REPORTS);
  return unwrapResponse<ReportCatalogData>(data);
}

type ReportFilters = Record<string, string | number | boolean | undefined>;

function cleanFilters(filters: ReportFilters): ReportFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) =>
        value !== undefined && value !== "" && value !== "all" && value !== false,
    ),
  );
}

export async function getReport(
  type: ReportType,
  filters: ReportFilters = {},
): Promise<ApiResponse<ReportData>> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.REPORT(type), {
    params: { format: "json", ...cleanFilters(filters) },
  });
  return unwrapResponse<ReportData>(data);
}

const EXTENSIONS: Record<Exclude<ReportFormat, "json">, string> = {
  csv: "csv",
  excel: "xlsx",
  pdf: "pdf",
};

export async function downloadReport(
  type: ReportType,
  format: Exclude<ReportFormat, "json">,
  filters: ReportFilters = {},
): Promise<string> {
  const response = await axiosPrivate.get(ADMIN_ENDPOINTS.REPORT(type), {
    params: { format, ...cleanFilters(filters) },
    responseType: "blob",
  });

  const disposition = String(
    response.headers["content-disposition"] ?? "",
  );
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const filename =
    match?.[1] ??
    `taskly-${type}-${new Date().toISOString().slice(0, 10)}.${EXTENSIONS[format]}`;

  const url = URL.createObjectURL(response.data as Blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  return filename;
}

export type {
  ReportCatalogData,
  ReportColumn,
  ReportData,
  ReportDefinition,
  ReportFormat,
  ReportType,
} from "./types";

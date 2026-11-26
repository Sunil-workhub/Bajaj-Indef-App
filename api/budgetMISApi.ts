import axiosInstance from "./axiosInstance";
import type {
  ABPWiseResponse,
  BudgetMISPayload,
  BudgetMonthResponse,
  BudgetYearResponse,
  DropdownApiResponse,
  DropdownOption,
  GetAbpPartnersRequest,
  ProductWiseResponse,
} from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const mapDropdown = (r: DropdownApiResponse): DropdownOption[] => r.data ?? [];

export const buildLastNFinancialYears = (
  n: number,
  endFY?: string,
): string[] => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const fyStart = m >= 4 ? y : y - 1;
  const currentFY = `${fyStart}-${String((fyStart + 1) % 100).padStart(2, "0")}`;
  const finalEnd = endFY ?? currentFY;
  const start = Number(finalEnd.split("-")[0]);
  return Array.from({ length: n }, (_, i) => {
    const s = start - (n - 1 - i);
    return `${s}-${String((s + 1) % 100).padStart(2, "0")}`;
  });
};

export const computeStartEndYear = (
  timeComparison: "current_vs_last" | "last_5_years",
) => {
  const years = buildLastNFinancialYears(5);
  if (timeComparison === "last_5_years")
    return { startYear: years[0], endYear: years[4], years };
  return {
    startYear: years[3],
    endYear: years[4],
    years: [years[3], years[4]],
  };
};

/** "2025-26" → shift by -n FYs */
export const addFYYears = (fy: string, add: number): string => {
  const s = Number(fy.split("-")[0]) + add;
  return `${s}-${String((s + 1) % 100).padStart(2, "0")}`;
};

// ─── Payload builder ──────────────────────────────────────────────────────────
const parseFY = (fy: string) => {
  const s = Number(fy.split("-")[0]);
  return {
    fyStart: new Date(`${s}-04-01T00:00:00.000Z`),
    fyEnd: new Date(`${s + 1}-03-31T00:00:00.000Z`),
  };
};

const toISO = (d: Date) => d.toISOString();

/**
 * Builds the complete date-range + filter payload for both ABP and Product endpoints.
 * mtd = ""  → full-year range  |  mtd = "2025-11-30" → MTD range
 */
export const buildBudgetMISPayload = (args: {
  budgetYear: string;
  mtd: string;
  timeComparison: "current_vs_last" | "last_5_years";
  reportType: "budget_vs_sales" | "budget_vs_order_intake";
  marketType: "domestic" | "exports" | "both";
  analysisType: "abp_wise" | "product_wise";
  status: "all" | "active" | "inactive";
  achievement: string;
  region: string;
  salesPerson: string;
  abp: string;
  budgetYearIndex?: number;
}): BudgetMISPayload => {
  const isLast5 = args.timeComparison === "last_5_years";
  const isMTD = !!args.mtd;
  const mtdEndDate = isMTD ? new Date(`${args.mtd}T00:00:00.000Z`) : null;

  const getRange = (yearOffset: number) => {
    const fy = addFYYears(args.budgetYear, -yearOffset);
    const { fyStart, fyEnd } = parseFY(fy);
    if (isMTD && mtdEndDate) {
      const end = new Date(mtdEndDate);
      end.setUTCFullYear(end.getUTCFullYear() - yearOffset);
      const start = new Date(end);
      start.setUTCDate(1);
      return { start: toISO(start), end: toISO(end), start_c: toISO(fyStart) };
    }
    return {
      start: toISO(fyStart),
      end: toISO(fyEnd),
      start_c: toISO(fyStart),
    };
  };

  const cy = getRange(0);
  const l1 = getRange(1);
  const l2 = isLast5 ? getRange(2) : null;
  const l3 = isLast5 ? getRange(3) : null;
  const l4 = isLast5 ? getRange(4) : null;
  const l5 = isLast5 ? getRange(5) : null;

  const marketMap = { domestic: "D", exports: "E", both: "B" } as const;
  const statusMap = { all: "B", active: "A", inactive: "I" } as const;

  return {
    start: cy.start,
    end: cy.end,
    start_c: cy.start_c,
    lStart: l1.start,
    lEnd: l1.end,
    lStart_c: l1.start_c,
    l2Start: l2?.start ?? null,
    l2End: l2?.end ?? null,
    l2Start_c: l2?.start_c ?? null,
    l3Start: l3?.start ?? null,
    l3End: l3?.end ?? null,
    l3Start_c: l3?.start_c ?? null,
    l4Start: l4?.start ?? null,
    l4End: l4?.end ?? null,
    l4Start_c: l4?.start_c ?? null,
    l5Start: l5?.start ?? null,
    l5End: l5?.end ?? null,
    l5Start_c: l5?.start_c ?? null,
    market: marketMap[args.marketType],
    dataMode: args.reportType === "budget_vs_order_intake" ? "O" : "S",
    last5Years: isLast5,
    budgetYearIndex: args.budgetYearIndex ?? 0,
    region: args.region || null,
    salesRep: args.salesPerson || null,
    partyNo: args.abp || null,
    activeStatus: statusMap[args.status],
    achievement: args.achievement || "all",
    viewMode: args.analysisType === "abp_wise" ? "ABP" : "Product",
  };
};

// ─── Dropdown APIs ────────────────────────────────────────────────────────────
export const getRegions = async (): Promise<DropdownOption[]> => {
  const res = await axiosInstance.post<DropdownApiResponse>("/GetRegions");
  return mapDropdown(res.data);
};

export const getSalespersons = async (
  region: string,
): Promise<DropdownOption[]> => {
  const res = await axiosInstance.post<DropdownApiResponse>(
    "/GetSalespersons",
    {
      region: region === "All" ? "" : region,
    },
  );
  return mapDropdown(res.data);
};

export const getAbpPartners = async (
  payload: GetAbpPartnersRequest,
): Promise<DropdownOption[]> => {
  const res = await axiosInstance.post<DropdownApiResponse>("/GetAbpPartners", {
    region: payload.region === "All" ? "" : payload.region,
    salesRep: payload.salesRep === "All" ? "" : payload.salesRep,
  });
  return mapDropdown(res.data);
};

// ─── Year / Month APIs ────────────────────────────────────────────────────────
export const getBudgetYears = async (): Promise<BudgetYearResponse> => {
  const res = await axiosInstance.get("/GetBudgetYears");
  return res.data;
};

export const getBudgetMonths = async (
  budgetYear: string,
): Promise<BudgetMonthResponse> => {
  const res = await axiosInstance.get(`/GetBudgetMonths/${budgetYear}`);
  return res.data;
};

// ─── MIS Data APIs ─────────────────────────────────────────────────────────────
export const getBudgetMISABP = async (
  payload: BudgetMISPayload,
): Promise<ABPWiseResponse> => {
  const res = await axiosInstance.post<ABPWiseResponse>(
    "/GetBudgetMIS_ABP",
    payload,
  );
  return res.data;
};

export const getBudgetMISProduct = async (
  payload: BudgetMISPayload,
): Promise<ProductWiseResponse> => {
  const res = await axiosInstance.post<ProductWiseResponse>(
    "/GetBudgetMIS_Product",
    payload,
  );
  return res.data;
};

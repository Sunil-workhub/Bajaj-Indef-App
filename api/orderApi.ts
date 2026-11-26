// src/api/orderIntakeApi.ts
import axiosInstance from "./axiosInstance";
import { AdjustmentData, MonthlyData, OrderIntakeData } from "./types";

// Updated API response interfaces to match actual response
interface OrderIntakeApiRow {
  month: string;
  amA_QTY: string;
  amA_VALUE: string;
  dC_QTY: string;
  dC_VALUE: string;
  scM_QTY: string;
  scM_VALUE: string;
  abP_EXPORT_QTY: string;
  abP_EXPORT_VALUE: string;
  dC_EXPORT_QTY: string;
  dC_EXPORT_VALUE: string;
  total: string;
}

interface OrderIntakeAdjustmentApiRow {
  month: string; // "Opening", "Cancelled", "rebook"
  amA_QTY: string;
  amA_VALUE: string;
  dC_QTY: string;
  dC_VALUE: string;
  scM_QTY: string;
  scM_VALUE: string;
  abP_EXPORT_QTY: string;
  abP_EXPORT_VALUE: string;
  dC_EXPORT_QTY: string;
  dC_EXPORT_VALUE: string;
  total: string;
}

interface OrderIntakeYesterdayApiRow {
  month: string; // "Yesterday"
  amA_QTY: string;
  amA_VALUE: string;
  dC_QTY: string;
  dC_VALUE: string;
  scM_QTY: string;
  scM_VALUE: string;
  abP_EXPORT_QTY: string;
  abP_EXPORT_VALUE: string;
  dC_EXPORT_QTY: string;
  dC_EXPORT_VALUE: string;
  total: string;
}

interface OrderIntakeApiResponse {
  status_Code: number;
  status: string;
  message: string;
  data: {
    intake: OrderIntakeApiRow[];
    intakeMisc: OrderIntakeAdjustmentApiRow[];
    intakePrev: OrderIntakeApiRow[];
    intakeYest: OrderIntakeYesterdayApiRow[];
  };
}

// Helper function to parse formatted number strings to numbers
const parseFormattedNumber = (formattedStr: string): number => {
  if (!formattedStr || formattedStr === "0" || formattedStr === "-") return 0;
  // Remove commas and convert to number
  const cleanStr = formattedStr.replace(/,/g, "");
  return parseInt(cleanStr, 10) || 0;
};

// Transform API row to frontend format
const transformMonthlyData = (
  apiRow:
    | OrderIntakeApiRow
    | OrderIntakeAdjustmentApiRow
    | OrderIntakeYesterdayApiRow
): MonthlyData => {
  // Clean up month name (remove \r\n if present)
  const month = apiRow.month.replace(/\r?\n/g, "").trim();

  return {
    month,
    abp: parseFormattedNumber(apiRow.amA_VALUE), // amA_VALUE maps to abp
    abpExp: parseFormattedNumber(apiRow.abP_EXPORT_VALUE), // abP_EXPORT_VALUE maps to abpExp
    dc: parseFormattedNumber(apiRow.dC_VALUE), // dC_VALUE maps to dc
    dcExp: parseFormattedNumber(apiRow.dC_EXPORT_VALUE), // dC_EXPORT_VALUE maps to dcExp
    total: parseFormattedNumber(apiRow.total),
    scm: parseFormattedNumber(apiRow.scM_VALUE), // scM_VALUE maps to scm
  };
};

// Calculate totals from array of monthly data
const calculateTotal = (
  data: MonthlyData[],
  monthLabel: string = "Total"
): MonthlyData => {
  return data.reduce(
    (total, current) => ({
      month: monthLabel,
      abp: total.abp + current.abp,
      abpExp: total.abpExp + current.abpExp,
      dc: total.dc + current.dc,
      dcExp: total.dcExp + current.dcExp,
      total: total.total + current.total,
      scm: total.scm + current.scm,
    }),
    {
      month: monthLabel,
      abp: 0,
      abpExp: 0,
      dc: 0,
      dcExp: 0,
      total: 0,
      scm: 0,
    }
  );
};

// NEW: Calculate adjustments total with formula: Opening - Cancelled + Rebook
const calculateAdjustmentsTotal = (
  opening: MonthlyData,
  cancelled: MonthlyData,
  rebook: MonthlyData
): MonthlyData => {
  return {
    month: "Total",
    abp: opening.abp - cancelled.abp + rebook.abp,
    abpExp: opening.abpExp - cancelled.abpExp + rebook.abpExp,
    dc: opening.dc - cancelled.dc + rebook.dc,
    dcExp: opening.dcExp - cancelled.dcExp + rebook.dcExp,
    total: opening.total - cancelled.total + rebook.total,
    scm: opening.scm - cancelled.scm + rebook.scm,
  };
};

// Single API call to fetch complete order intake report
export const fetchOrderIntakeReport = async (): Promise<OrderIntakeData> => {
  try {
    console.log("🔄 Fetching order intake data from API...");

    const response = await axiosInstance.post<OrderIntakeApiResponse>(
      "/GetOrderIntakeData",
      {} // Empty body as per your requirement
    );

    console.log("📊 Order Intake API Response:", response.data);

    if (response.data.status_Code !== 200) {
      throw new Error(response.data.message || "API call failed");
    }

    const apiData = response.data.data;

    // Transform current year data (intake)
    const currentYear = apiData.intake.map(transformMonthlyData);
    const currentYearTotal = calculateTotal(currentYear, "Total");

    // Transform adjustments data (intakeMisc)
    const adjustmentsRaw = apiData.intakeMisc;

    const opening = adjustmentsRaw.find((item) =>
      item.month.toLowerCase().includes("opening")
    );
    const cancelled = adjustmentsRaw.find((item) =>
      item.month.toLowerCase().includes("cancelled")
    );
    const rebook = adjustmentsRaw.find((item) =>
      item.month.toLowerCase().includes("rebook")
    );

    if (!opening || !cancelled || !rebook) {
      console.warn("⚠️ Some adjustment data missing:", {
        opening,
        cancelled,
        rebook,
      });
    }

    const adjustments: AdjustmentData = {
      opening: opening
        ? transformMonthlyData(opening)
        : {
            month: "Opening",
            abp: 0,
            abpExp: 0,
            dc: 0,
            dcExp: 0,
            total: 0,
            scm: 0,
          },
      cancelled: cancelled
        ? transformMonthlyData(cancelled)
        : {
            month: "Cancelled",
            abp: 0,
            abpExp: 0,
            dc: 0,
            dcExp: 0,
            total: 0,
            scm: 0,
          },
      rebook: rebook
        ? transformMonthlyData(rebook)
        : {
            month: "Rebook",
            abp: 0,
            abpExp: 0,
            dc: 0,
            dcExp: 0,
            total: 0,
            scm: 0,
          },
    };

    // CHANGED: Use the new calculation formula for adjustments total
    const adjustmentsTotal = calculateAdjustmentsTotal(
      adjustments.opening,
      adjustments.cancelled,
      adjustments.rebook
    );

    // Transform previous year data (intakePrev)
    const previousYear = apiData.intakePrev.map(transformMonthlyData);
    const previousYearTotal = calculateTotal(previousYear, "Total");

    // Transform yesterday data (intakeYest)
    const yesterdayRaw = apiData.intakeYest[0]; // Should be single item array
    const yesterday = yesterdayRaw
      ? transformMonthlyData(yesterdayRaw)
      : {
          month: "Yesterday",
          abp: 0,
          abpExp: 0,
          dc: 0,
          dcExp: 0,
          total: 0,
          scm: 0,
        };

    const result: OrderIntakeData = {
      currentYear,
      currentYearTotal,
      adjustments,
      adjustmentsTotal,
      previousYear,
      previousYearTotal,
      yesterday,
    };

    console.log("✅ Transformed order intake data:", result);
    return result;
  } catch (error) {
    console.error("❌ Error fetching order intake report:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch order intake report: ${error.message}`);
    }
    throw new Error("Failed to fetch order intake report");
  }
};

// Helper function to format currency for display
export const formatCurrency = (amount: number): string => {
  if (amount === 0) return "0";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to format number with commas
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("en-IN").format(value);
};

// Legacy API functions (kept for backward compatibility, but now just call the main function)
export const fetchCurrentYearOrderIntake = async (): Promise<MonthlyData[]> => {
  const data = await fetchOrderIntakeReport();
  return data.currentYear;
};

export const fetchOrderIntakeAdjustments =
  async (): Promise<AdjustmentData> => {
    const data = await fetchOrderIntakeReport();
    return data.adjustments;
  };

export const fetchPreviousYearOrderIntake = async (): Promise<
  MonthlyData[]
> => {
  const data = await fetchOrderIntakeReport();
  return data.previousYear;
};

export const fetchYesterdayOrderIntake = async (): Promise<MonthlyData> => {
  const data = await fetchOrderIntakeReport();
  return data.yesterday;
};

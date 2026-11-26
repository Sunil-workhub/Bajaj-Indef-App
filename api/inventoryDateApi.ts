// src/api/inventoryDateApi.ts - Updated with Indian number formatting
import axiosInstance from "./axiosInstance";
import { InventoryDateApiResponse, InventoryDateItem } from "./types";

// Optimized helper function with Indian number formatting
const formatInventoryNumber = (value: string | number): string => {
  if (value === 0 || value === "0") return "0";
  if (value === null || value === undefined || value === "") return "0";

  // If already formatted with commas, return as is
  if (
    typeof value === "string" &&
    value.includes(",") &&
    !isNaN(parseFloat(value.replace(/,/g, "")))
  ) {
    return value;
  }
  
  const num =
    typeof value === "string"
      ? parseFloat(value.replace(/,/g, ""))
      : Number(value);

  if (isNaN(num)) return "0";

  // ✅ Indian grouping (lakhs and crores) + no decimals
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// Transform detailed aging data
const transformInventoryDateData = (apiData: any[]): InventoryDateItem[] => {
  if (!Array.isArray(apiData)) {
    throw new Error("Invalid data structure received from API");
  }

  console.log(`📊 Processing ${apiData.length} inventory records...`);

  return apiData.map((item, index) => ({
    inventoryClass: item.inventoryClass || `Unknown-${index}`,
    days1To180: formatInventoryNumber(item.days1To180),
    days181To365: formatInventoryNumber(item.days181To365),
    days366To540: formatInventoryNumber(item.days366To540),
    days541To730: formatInventoryNumber(item.days541To730),
    days731To1095: formatInventoryNumber(item.days731To1095),
    days1096To1460: formatInventoryNumber(item.days1096To1460),
    days1461To1825: formatInventoryNumber(item.days1461To1825),
    days1826To2190: formatInventoryNumber(item.days1826To2190),
    days2191To2555: formatInventoryNumber(item.days2191To2555),
    days2555Plus: formatInventoryNumber(item.days2555Plus),
    total: formatInventoryNumber(item.total),
  }));
};

// Transform imported components
const transformImportedComponents = (apiData: any[]) => {
  if (!Array.isArray(apiData)) return [];

  return apiData.map((item) => ({
    subClass: item.inV_SUB_CLASS || "",
    total: formatInventoryNumber(item.cTotal),
  }));
};

// Main API call
export const fetchInventoryDateData = async () => {
  const startTime = performance.now();

  try {
    console.log("🚀 Starting inventory aging API call...");

    const response = await axiosInstance.post<InventoryDateApiResponse>(
      "/GetInventoryAgingByDate",
      {},
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    if (!response.data || response.data.status_Code !== 200) {
      throw new Error(response.data?.message || "API returned error status");
    }

    const { data } = response.data;

    const result = {
      detailedAgingData: transformInventoryDateData(
        data.detailedAgingData || [],
      ),
      importedComponents: transformImportedComponents(
        data.importedComponents || [],
      ),
      importedTradedComponents: transformImportedComponents(
        data.importedTradedComponents || [],
      ),
      bottomTotals: {
        khopoli: formatInventoryNumber(data.bottomTotals?.khopoli || 0),
        mfg: formatInventoryNumber(data.bottomTotals?.mfg || 0),
        pune: formatInventoryNumber(data.bottomTotals?.pune || 0),
        mfg_84: formatInventoryNumber(data.bottomTotals?.mfg_84 || 0),
      },
    };

    const totalTime = performance.now();
    console.log(
      `✅ Total processing time: ${(totalTime - startTime).toFixed(2)}ms`,
    );

    return result;
  } catch (error: any) {
    console.error("❌ Error fetching inventory data:", error);
    throw new Error(`Failed to fetch inventory data: ${error.message}`);
  }
};

export const parseInventoryNumber = (formattedStr: string): number => {
  if (!formattedStr || formattedStr === "0") return 0;
  const cleanValue = formattedStr.replace(/,/g, "");
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

export const calculateInventoryDateTotals = (data: InventoryDateItem[]) => {
  const totals: (string | number)[] = [
    "Total",
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    totals[1] = (totals[1] as number) + parseInventoryNumber(item.days1To180);
    totals[2] = (totals[2] as number) + parseInventoryNumber(item.days181To365);
    totals[3] = (totals[3] as number) + parseInventoryNumber(item.days366To540);
    totals[4] = (totals[4] as number) + parseInventoryNumber(item.days541To730);
    totals[5] =
      (totals[5] as number) + parseInventoryNumber(item.days731To1095);
    totals[6] =
      (totals[6] as number) + parseInventoryNumber(item.days1096To1460);
    totals[7] =
      (totals[7] as number) + parseInventoryNumber(item.days1461To1825);
    totals[8] =
      (totals[8] as number) + parseInventoryNumber(item.days1826To2190);
    totals[9] =
      (totals[9] as number) + parseInventoryNumber(item.days2191To2555);
    totals[10] =
      (totals[10] as number) + parseInventoryNumber(item.days2555Plus);
    totals[11] = (totals[11] as number) + parseInventoryNumber(item.total);
  }

  // ✅ FIXED: Changed from "en-US" to "en-IN" for Indian number formatting
  return totals.map((value, index) => {
    if (index === 0) return value;
    return (value as number).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  });
};

// Optimized currency formatting
export const formatInventoryCurrency = (amount: string | number): string => {
  const num =
    typeof amount === "string" ? parseInventoryNumber(amount) : amount;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

// Note: parseCache is not defined in the original code - removing this function
// or add the cache definition above if needed

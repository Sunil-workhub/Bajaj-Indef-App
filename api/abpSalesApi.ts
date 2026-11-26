// src/api/abpSalesApi.ts
import axiosInstance from "./axiosInstance";
import { AbpSalesOverviewApiResponse, ABPSalesData } from "./types";

// Transform API response to frontend format
const transformAbpSalesData = (
  apiResponse: AbpSalesOverviewApiResponse
): {
  data: ABPSalesData[];
  total: ABPSalesData;
} => {
  // Check if response is successful
  if (apiResponse.status_Code !== 200 || !apiResponse.data) {
    throw new Error(
      apiResponse.message || "API returned unsuccessful response"
    );
  }

  // Transform the rows array - note the nested data structure
  const data: ABPSalesData[] = apiResponse.data.data.map((item) => ({
    abpName: item.abpName,
    bookedQty: item.bookedQty,
    bookedValue: item.bookedValue,
    billedQty: item.billedQty,
    billedValue: item.billedValue,
    pendingQty: item.pendingQty,
    pendingValue: item.pendingValue,
  }));

  // Transform the total object - note accessing apiResponse.data.total
  const total: ABPSalesData = {
    abpName: "Total",
    bookedQty: apiResponse.data.total.bookedQty,
    bookedValue: apiResponse.data.total.bookedValue,
    billedQty: apiResponse.data.total.billedQty,
    billedValue: apiResponse.data.total.billedValue,
    pendingQty: apiResponse.data.total.pendingQty,
    pendingValue: apiResponse.data.total.pendingValue,
  };

  return { data, total };
};

export const fetchABPSalesData = async (): Promise<{
  data: ABPSalesData[];
  total: ABPSalesData;
}> => {
  try {
    const response = await axiosInstance.post<AbpSalesOverviewApiResponse>(
      "/GetAbpWiseSalesOverview",
      {} // Empty request body
    );

    console.log("Raw ABP API Response:", response.data);

    // Check if response structure is valid
    if (!response.data || !response.data.data) {
      throw new Error("Invalid response structure from API");
    }

    return transformAbpSalesData(response.data);
  } catch (error: any) {
    console.error("Error fetching ABP sales data:", error);

    // More detailed error logging
    if (error.response) {
      console.error("API Error Status:", error.response.status);
      console.error("API Error Data:", error.response.data);
    }

    throw new Error(`Failed to fetch ABP sales data: ${error.message}`);
  }
};

// src/api/salesApi.ts
import axiosInstance from "./axiosInstance";
import {
  SalesSummaryApiResponse,
  SalesRequest,
  SalesResponse,
  SalesSummaryItem,
  MonthlyBreakdownItem,
} from "./types";

// Transform API response to frontend format
const transformSalesData = (
  apiResponse: SalesSummaryApiResponse
): SalesResponse => {
  // Transform summary data
  const summary = apiResponse.data.summary.map((item) => ({
    description: item.description,
    currentMonth: item.currentMonth,
    ytd: item.ytd,
  }));

  // Transform monthly breakdown data
  const monthlyBreakdown = apiResponse.data.monthlyBreakdown.map((item) => ({
    month: item.month,
    currentYear: item.currentYear,
    previousYear: item.previousYear,
  }));

  return {
    summary,
    todaySale: apiResponse.data.todaySale,
    monthlyBreakdown,
  };
};

export const getSalesSummary = async (
  requestPayload: SalesRequest = {}
): Promise<SalesResponse> => {
  try {
    const response = await axiosInstance.post<SalesSummaryApiResponse>(
      "/GetSalesSummary",
      requestPayload
    );

    console.log("Raw Sales Summary Response:", response.data); // Debug log

    // Check if the API call was successful
    if (response.data.status_Code !== 200) {
      throw new Error(response.data.message || "API call failed");
    }

    return transformSalesData(response.data);
  } catch (error) {
    console.error("Error fetching sales summary:", error);
    throw new Error("Failed to fetch sales summary");
  }
};

// Additional helper functions for specific data access
export const getTodaySales = async (
  requestPayload: SalesRequest = {}
): Promise<string> => {
  const data = await getSalesSummary(requestPayload);
  return data.todaySale;
};

export const getSummaryOnly = async (
  requestPayload: SalesRequest = {}
): Promise<SalesSummaryItem[]> => {
  const data = await getSalesSummary(requestPayload);
  return data.summary;
};

export const getMonthlyBreakdownOnly = async (
  requestPayload: SalesRequest = {}
): Promise<MonthlyBreakdownItem[]> => {
  const data = await getSalesSummary(requestPayload);
  return data.monthlyBreakdown;
};

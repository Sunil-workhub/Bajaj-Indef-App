// src/api/commissioningApi.ts
import axiosInstance from "./axiosInstance";
import {
  CommissioningApiResponse,
  CommissioningData,
  CommissioningDataLegacy,
  CommissioningDetailApiDto,
  CommissioningItem,
  DueType,
} from "./types";

// Transform API response to frontend format
const transformCommissioningData = (
  apiResponse: CommissioningApiResponse,
): CommissioningData => {
  // Check if response is successful
  if (apiResponse.status_Code !== 200 || !apiResponse.data) {
    throw new Error(
      apiResponse.message || "API returned unsuccessful response",
    );
  }

  return {
    dashboard: {
      total: apiResponse.data.dashboard.total,
      closed: apiResponse.data.dashboard.closed,
      pending: apiResponse.data.dashboard.pending,
      cancelled: apiResponse.data.dashboard.cancelled,
      today: apiResponse.data.dashboard.today,
      overdue: apiResponse.data.dashboard.overdue,
    },
    details: apiResponse.data.details.map((item) => ({
      jobNo: item.jobNo,
      serialNumber: item.serialNumber,
      qrCode: item.qrCode,
      customerName: item.customerName?.trim() ?? "",
      contactPerson: item.contactPerson,
      designation: item.designation,
      customerEmail: item.customerEmail,
      customerMobile: item.customerMobile,
      installAddress: item.installAddress,
      commissioningStart: item.commissioningStart,
      amaName: item.amaName,
    })),
  };
};

// Transform for legacy screen compatibility
const transformToLegacyFormat = (
  apiResponse: CommissioningApiResponse,
): CommissioningDataLegacy => {
  if (apiResponse.status_Code !== 200 || !apiResponse.data) {
    throw new Error(
      apiResponse.message || "API returned unsuccessful response",
    );
  }

  return {
    dueToday: apiResponse.data.dashboard.today,
    overDue: apiResponse.data.dashboard.overdue,
    commissioned: apiResponse.data.dashboard.closed, // closed = commissioned
    pending: apiResponse.data.dashboard.pending,
    cancelled: apiResponse.data.dashboard.cancelled,
    totalRequest: apiResponse.data.dashboard.total,
  };
};

// Transform details for legacy screen format
const transformDetailsToLegacyItems = (
  details: CommissioningDetailApiDto[],
  category: string,
): CommissioningItem[] => {
  return details.map((item, index) => ({
    id: `${item.jobNo}-${index}`,
    companyName: item.customerName.trim(),
    location: item.installAddress,
    abpAssigned: item.amaName,
    contactPerson: item.contactPerson,
    designation: item.designation,
    serialNo: item.serialNumber,
    qrCode: item.qrCode,
    jobNo: item.jobNo,
    dueDate: formatDate(item.commissioningStart),
    status: mapCategoryToStatus(category),
  }));
};

// Helper function to format date - UPDATED for API format
const formatDate = (dateString: string): string => {
  try {
    if (!dateString || dateString.trim() === "") return "";

    // 1. Try standard parsing first
    let date = new Date(dateString);

    // 2. If it fails (common on Android), manually parse "M/D/YYYY"
    if (isNaN(date.getTime())) {
      // Splits "9/6/2025 12:00:00 AM" into ["9", "6", "2025"]
      const parts = dateString.split(" ")[0].split("/");
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10) - 1; // JS months are 0-11
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        date = new Date(year, month, day);
      }
    }

    // 3. Check validity again
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date received: ${dateString}`);
      return dateString;
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    return dateString;
  }
};

// Helper function to map category to status
const mapCategoryToStatus = (category: string): CommissioningItem["status"] => {
  switch (category) {
    case "due_today":
      return "due_today";
    case "over_due":
      return "over_due";
    case "commissioned":
      return "commissioned";
    case "pending":
      return "pending";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
};

// Fetch dashboard data only (no details) - FIXED
export const fetchCommissioningDashboard =
  async (): Promise<CommissioningData> => {
    try {
      const response = await axiosInstance.post<CommissioningApiResponse>(
        "/GetCommissioningDashboard",
        "", // Send empty string, not empty object
      );

      // Check if response structure is valid
      if (!response.data || !response.data.data) {
        throw new Error("Invalid response structure from API");
      }

      return transformCommissioningData(response.data);
    } catch (error: any) {
      // More detailed error logging
      if (error.response) {
        console.error("API Error Status:", error.response.status);
        console.error("API Error Data:", error.response.data);
      }

      throw new Error(
        `Failed to fetch commissioning dashboard data: ${error.message}`,
      );
    }
  };

// Fetch dashboard with details for specific due type - FIXED
export const fetchCommissioningWithDetails = async (
  dueType: DueType,
): Promise<CommissioningData> => {
  try {
    // Send the dueType string directly, not as an object
    const requestBody = dueType || "";

    const response = await axiosInstance.post<CommissioningApiResponse>(
      "/GetCommissioningDashboard",
      requestBody,
    );

    // Check if response structure is valid
    if (!response.data || !response.data.data) {
      throw new Error("Invalid response structure from API");
    }

    return transformCommissioningData(response.data);
  } catch (error: any) {
    console.error(
      `Error fetching commissioning ${dueType || "dashboard"}:`,
      error,
    );

    // More detailed error logging
    if (error.response) {
      console.error("API Error Status:", error.response.status);
      console.error("API Error Data:", error.response.data);
    }

    throw new Error(
      `Failed to fetch commissioning ${dueType || "dashboard"} data: ${
        error.message
      }`,
    );
  }
};

// Legacy functions for existing screen compatibility - FIXED
export const fetchCommissioningOverview =
  async (): Promise<CommissioningDataLegacy> => {
    try {
      const response = await axiosInstance.post<CommissioningApiResponse>(
        "/GetCommissioningDashboard",
        "", // Send empty string
      );

      // Check if response structure is valid
      if (!response.data || !response.data.data) {
        throw new Error("Invalid response structure from API");
      }

      return transformToLegacyFormat(response.data);
    } catch (error: any) {
      console.error("Error fetching commissioning overview:", error);

      // More detailed error logging
      if (error.response) {
        console.error("API Error Status:", error.response.status);
        console.error("API Error Data:", error.response.data);
      }

      throw new Error(
        `Failed to fetch commissioning overview data: ${error.message}`,
      );
    }
  };

export const fetchCommissioningDetails = async (
  category: string,
): Promise<CommissioningItem[]> => {
  try {
    let dueType: DueType = null;

    // Map category to API parameter
    if (category === "due_today") dueType = "TODAY";
    else if (category === "over_due") dueType = "OVERDUE";

    // Send the dueType string directly
    const requestBody = dueType || "";

    const response = await axiosInstance.post<CommissioningApiResponse>(
      "/GetCommissioningDashboard",
      requestBody,
    );

    // Check if response structure is valid
    if (!response.data || !response.data.data) {
      throw new Error("Invalid response structure from API");
    }

    return transformDetailsToLegacyItems(response.data.data.details, category);
  } catch (error: any) {
    console.error(
      `Error fetching commissioning details for ${category}:`,
      error,
    );

    // More detailed error logging
    if (error.response) {
      console.error("API Error Status:", error.response.status);
      console.error("API Error Data:", error.response.data);
    }

    throw new Error(
      `Failed to fetch commissioning details for ${category}: ${error.message}`,
    );
  }
};

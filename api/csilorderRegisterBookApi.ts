// src/api/orderRegisterApi.ts
import axiosInstance from "./axiosInstance";
import {
  OrderBookData,
  OrderRegisterBookApiResponse,
  OrderRegisterBookRequest,
  SummaryBookData,
} from "./types";

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

// Helper function to format date and time separately if needed
const formatDateTime = (dateString: string): { date: string; time: string } => {
  try {
    if (!dateString) return { date: "", time: "" };

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return { date: dateString, time: "" };
    }

    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });

    const formattedTime = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return { date: formattedDate, time: formattedTime };
  } catch (error) {
    console.error(`Error formatting datetime "${dateString}":`, error);
    return { date: dateString, time: "" };
  }
};

// Transform API response to frontend format
const transformOrderRegisterData = (
  apiResponse: OrderRegisterBookApiResponse,
): {
  orders: OrderBookData[];
  summary: SummaryBookData;
} => {
  console.log("Raw API Response:", apiResponse.data);

  // Check if data exists
  if (!apiResponse.data.data || !Array.isArray(apiResponse.data.data)) {
    console.warn("No order data found in API response");
    return {
      orders: [],
      summary: { spares: 0, mains: 0, total: 0 },
    };
  }

  const orders: OrderBookData[] = apiResponse.data.data.map((item) => {
    // Log the date formats for debugging
    console.log("Original dates:", {
      bookedDate: item.bookedDate,
      promiseDate: item.promiseDate,
      creationDate: item.creationDate,
    });

    return {
      orderNo: item.orderNumber || "",
      buyer: item.buyer || "",
      enteredOn: formatDate(item.bookedDate || item.creationDate || ""),
      promiseDt: formatDate(item.promiseDate || ""),
      itemCode: item.orderedItem || "",
      description: item.itemDescription || "",
      qty: item.pendingQuantity || 0,
      value: item.asseValue || 0,
    };
  });

  // Calculate summary from the actual data
  const totalValue = apiResponse.data.summary?.totalAsseValue;
  const spareValue = apiResponse.data.summary?.totalAmount;

  const summary: SummaryBookData = {
    spares: spareValue, // 20% assumed as spares
    mains: totalValue, // 80% assumed as mains
    total: totalValue,
  };

  console.log("Transformed data:", { ordersCount: orders.length, summary });

  return { orders, summary };
};

export const fetchOrderRegisterData = async (
  requestPayload: OrderRegisterBookRequest = {},
): Promise<OrderBookData[]> => {
  try {
    const response = await axiosInstance.post<OrderRegisterBookApiResponse>(
      "/GetCSILOrderRegisterBooked",
      requestPayload,
    );

    console.log("Raw Order Register Response:", response.data);

    // Check if the API call was successful
    if (response.data.status_Code !== 200) {
      throw new Error(response.data.message || "API call failed");
    }

    const { orders } = transformOrderRegisterData(response.data);
    return orders;
  } catch (error) {
    console.error("Error fetching order register data:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch order register data");
  }
};

export const fetchSummaryBookData = async (
  requestPayload: OrderRegisterBookRequest = {},
): Promise<SummaryBookData> => {
  try {
    const response = await axiosInstance.post<OrderRegisterBookApiResponse>(
      "/GetCSILOrderRegisterBooked",
      requestPayload,
    );

    console.log("Raw Summary Response:", response.data);

    // Check if the API call was successful
    if (response.data.status_Code !== 200) {
      throw new Error(response.data.message || "API call failed");
    }

    const { summary } = transformOrderRegisterData(response.data);
    return summary;
  } catch (error) {
    console.error("Error fetching summary data:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch summary data");
  }
};

// Export the helper functions if needed elsewhere
export { formatDate, formatDateTime };

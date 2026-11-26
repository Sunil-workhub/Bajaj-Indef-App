// src/api/orderRegisterApi.ts
import axiosInstance from "./axiosInstance";
import {
  OrderData,
  OrderRegisterApiResponse,
  OrderRegisterApiRow,
  SummaryData,
} from "./types";

// Helper function to format date
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

// Transform API response to frontend format
const transformOrderRegisterData = (
  apiResponse: OrderRegisterApiResponse,
): {
  orders: OrderData[];
  summary: SummaryData;
} => {
  // Extract orders from first result set (resultSetIndex: 0)
  const ordersResultSet = apiResponse.data.results.find(
    (result) => result.resultSetIndex === 0,
  );

  if (!ordersResultSet) {
    throw new Error("Orders result set not found");
  }

  const orderRows = ordersResultSet.rows as OrderRegisterApiRow[];

  const orders: OrderData[] = orderRows.map((item) => ({
    orderNo: item.ORDER_NUMBER,
    buyer: item.BUYER,
    enteredOn: formatDate(item.CREATION_DATE),
    promiseDt: formatDate(item.PROMISE_DATE),
    itemCode: item.ORDERED_ITEM,
    description: item.ITEM_DESC,
    qty: item.PENDING_QUANTITY,
    value: item.ASSE_VALUE,
  }));

  // Extract total asset value from second result set (resultSetIndex: 1)
  const asseValueResultSet = apiResponse.data.results.find(
    (result) => result.resultSetIndex === 1,
  );
  const totalAsseValue = asseValueResultSet?.rows[0]?.asse_value || 0;

  // Extract total amount from third result set (resultSetIndex: 2)
  const totalAmtResultSet = apiResponse.data.results.find(
    (result) => result.resultSetIndex === 2,
  );
  const totalAmount = totalAmtResultSet?.rows[0]?.total_amt || 0;

  // Create summary - you can adjust the spares/mains logic based on your business rules
  // For now, I'll put 80% in mains and 20% in spares as an example
  const summary: SummaryData = {
    spares: totalAmount, // 20% assumed as spares
    mains: totalAsseValue, // 80% assumed as mains
    total: totalAsseValue,
  };

  return { orders, summary };
};

export const fetchOrderRegisterData = async (): Promise<OrderData[]> => {
  try {
    const response = await axiosInstance.get<OrderRegisterApiResponse>(
      "/GetCSILOrderRegisterRaw",
    );

    console.log("Raw Order Register Response:", response.data); // Debug log

    // Check if the API call was successful
    if (response.data.status_Code !== 200) {
      throw new Error(response.data.message || "API call failed");
    }

    const { orders } = transformOrderRegisterData(response.data);
    return orders;
  } catch (error) {
    console.error("Error fetching order register data:", error);
    throw new Error("Failed to fetch order register data");
  }
};

export const fetchSummaryData = async (): Promise<SummaryData> => {
  try {
    const response = await axiosInstance.get<OrderRegisterApiResponse>(
      "/GetCSILOrderRegisterRaw",
    );

    console.log("Raw Summary Response:", response.data); // Debug log

    // Check if the API call was successful
    if (response.data.status_Code !== 200) {
      throw new Error(response.data.message || "API call failed");
    }

    const { summary } = transformOrderRegisterData(response.data);
    return summary;
  } catch (error) {
    console.error("Error fetching summary data:", error);
    throw new Error("Failed to fetch summary data");
  }
};

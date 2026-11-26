// src/api/productSalesApi.ts
import axiosInstance from "./axiosInstance";
import {
  ProductSalesOverviewApiResponse,
  ProductSalesRequest,
  ProductSalesData,
} from "./types";

// Transform API response to frontend format
const transformProductSalesData = (
  apiResponse: ProductSalesOverviewApiResponse
): {
  data: ProductSalesData[];
  total: ProductSalesData;
} => {
  // Transform the rows array
  const data: ProductSalesData[] = apiResponse.data.data.map((item) => ({
    product: item.product,
    soldQty: item.soldQty,
    soldValue: item.soldValue,
    pendingQty: item.pendingQty,
    pendingValue: item.pendingValue,
  }));

  // Transform the total object
  const total: ProductSalesData = {
    product: "Total",
    soldQty: apiResponse.data.total.soldQty,
    soldValue: apiResponse.data.total.soldValue,
    pendingQty: apiResponse.data.total.pendingQty,
    pendingValue: apiResponse.data.total.pendingValue,
  };

  return { data, total };
};

export const fetchProductSalesData = async (
  requestPayload: ProductSalesRequest = {}
): Promise<{
  data: ProductSalesData[];
  total: ProductSalesData;
}> => {
  try {
    const response = await axiosInstance.post<ProductSalesOverviewApiResponse>(
      "/GetProductSalesOverview",
      requestPayload
    );

    console.log("Raw API Response:", response.data); // Debug log

    // Check if the API call was successful
    if (response.data.status_Code !== 200) {
      throw new Error(response.data.message || "API call failed");
    }

    return transformProductSalesData(response.data);
  } catch (error) {
    console.error("Error fetching product sales data:", error);
    throw new Error("Failed to fetch product sales data");
  }
};

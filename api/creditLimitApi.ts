// src/api/creditLimitApi.ts
import axiosInstance from "./axiosInstance";
import {
  CreditLimitApiResponse,
  CreditLimitData,
  UpdateOrderIntakeRequest,
} from "./types";

// Transform API response to frontend format
const transformCreditLimitData = (
  apiResponse: CreditLimitApiResponse
): CreditLimitData[] => {
  // Check if response is successful
  if (apiResponse.status_Code !== 200 || !apiResponse.data) {
    throw new Error(
      apiResponse.message || "API returned unsuccessful response"
    );
  }

  console.log("Raw Credit Limit API Data:", apiResponse.data);

  // Transform the nested data array
  return apiResponse.data.map((item) => ({
    id: item.customeR_NUMBER, // Using customer number as unique ID
    companyName: item.customeR_NAME,
    creditLimit: item.overalL_CREDIT_LIMIT,
    outstanding: item.outstandainG_AMT,
    orderIntake: item.ordeR_INTAKE,
    pendingOrder: item.pendinG_ORDER,
    creditHold: item.credit_hold === "Y",
    customerNumber: item.customeR_NUMBER,
  }));
};

// Fetch all credit limits - Changed to POST
export const fetchCreditLimits = async (): Promise<CreditLimitData[]> => {
  try {
    const response = await axiosInstance.post<CreditLimitApiResponse>(
      "/GetCreditLimits",
      {} // Empty request body
    );

    console.log("Raw Credit Limit Response:", response.data);

    // Check if response structure is valid
    if (!response.data || !response.data.data) {
      throw new Error("Invalid response structure from API");
    }

    return transformCreditLimitData(response.data);
  } catch (error: any) {
    console.error("Error fetching credit limits:", error);

    // More detailed error logging
    if (error.response) {
      console.error("API Error Status:", error.response.status);
      console.error("API Error Data:", error.response.data);
    }

    throw new Error(`Failed to fetch credit limit data: ${error.message}`);
  }
};

// Update order intake - Changed to POST (assuming backend changed too)
export const updateOrderIntake = async (
  customerNumber: string,
  orderIntake: number
): Promise<CreditLimitData[]> => {
  try {
    const requestBody: UpdateOrderIntakeRequest = {
      customerNumber,
      orderIntake,
    };

    const response = await axiosInstance.post<CreditLimitApiResponse>(
      "/UpdateOrderIntake",
      requestBody
    );

    console.log("Update Order Intake Response:", response.data);

    // Check if response structure is valid
    if (!response.data || !response.data.data) {
      throw new Error("Invalid response structure from API");
    }

    return transformCreditLimitData(response.data);
  } catch (error: any) {
    console.error("Error updating order intake:", error);

    // More detailed error logging
    if (error.response) {
      console.error("API Error Status:", error.response.status);
      console.error("API Error Data:", error.response.data);
    }

    throw new Error(`Failed to update order intake: ${error.message}`);
  }
};

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to format number
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Helper function to get credit status
export const getCreditStatus = (data: CreditLimitData): string => {
  if (data.creditHold) {
    return "HOLD";
  }

  const totalCommitment =
    data.outstanding + data.orderIntake + data.pendingOrder;
  const availableCredit = data.creditLimit - totalCommitment;

  if (availableCredit <= 0) {
    return "EXCEEDED";
  } else if (availableCredit < data.creditLimit * 0.1) {
    // Less than 10% available
    return "WARNING";
  } else {
    return "NORMAL";
  }
};

// Helper function to get available credit
export const getAvailableCredit = (data: CreditLimitData): number => {
  const totalCommitment =
    data.outstanding + data.orderIntake + data.pendingOrder;
  return Math.max(0, data.creditLimit - totalCommitment);
};

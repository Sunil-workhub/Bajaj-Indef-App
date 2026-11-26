// api/debtorsAgingApi.ts
import axiosInstance from "./axiosInstance";
import {
  CustomerTypesApiResponse,
  CustomerTypeTab,
  DebtorsAgingApiResponse,
  DebtorsAgingResponse,
} from "./types";

export const debtorsAgingApi = {
  /**
   * Get all available customer types for tabs - Changed to POST
   */
  async getCustomerTypes(): Promise<CustomerTypeTab[]> {
    try {
      const response = await axiosInstance.post<CustomerTypesApiResponse>(
        "/GetCustomerTypes",
        {} // Empty request body
      );

      console.log("Raw Customer Types Response:", response.data);

      // Check if response is successful and has valid structure
      if (response.data.status_Code !== 200 || !response.data.data) {
        throw new Error(
          response.data.message || "API returned unsuccessful response"
        );
      }

      // Check if response structure is valid
      if (!response.data.data.customerTypes) {
        throw new Error("Invalid response structure from API");
      }

      return response.data.data.customerTypes;
    } catch (error: any) {
      console.error("Error fetching customer types:", error);

      // More detailed error logging
      if (error.response) {
        console.error("API Error Status:", error.response.status);
        console.error("API Error Data:", error.response.data);
      }

      throw this.handleError(error, "Failed to fetch customer types");
    }
  },

  /**
   * Get the aging report for a specific customer type - Changed to POST
   * Pass "ALL" to get all data
   */
  async getDebtorsAgingReport(type: string): Promise<DebtorsAgingResponse> {
    try {
      // Send type as string directly in request body
      const response = await axiosInstance.post<DebtorsAgingApiResponse>(
        "/GetDebtorsAgingReport",
        type // Send the type string directly (not as object)
      );

      console.log("Raw Debtors Aging Report Response:", response.data);

      // Check if response is successful and has valid structure
      if (response.data.status_Code !== 200 || !response.data.data) {
        throw new Error(
          response.data.message || "API returned unsuccessful response"
        );
      }

      // Transform API response to frontend format
      return {
        data: response.data.data.data,
        summary: response.data.data.summary,
        selectedType: response.data.data.selectedType,
      };
    } catch (error: any) {
      console.error("Error fetching debtors aging report:", error);

      // More detailed error logging
      if (error.response) {
        console.error("API Error Status:", error.response.status);
        console.error("API Error Data:", error.response.data);
      }

      throw this.handleError(error, "Failed to fetch debtors aging report");
    }
  },

  /**
   * Handle API errors consistently
   */
  handleError(error: any, defaultMessage: string): Error {
    if (error.response?.status === 404) {
      return new Error("No data found for the selected customer type");
    } else if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    } else if (error.message) {
      return new Error(error.message);
    } else {
      return new Error(defaultMessage);
    }
  },

  /**
   * Format number for display
   */
  formatNumber(value: number): string {
    if (value === 0) return "0.00";
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  },

  /**
   * Format currency for display
   */
  formatCurrency(value: number): string {
    if (value === 0) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  },

  /**
   * Convert API data to table format for display - Updated for new columns
   */
  convertToTableFormat(response: DebtorsAgingResponse): string[][] {
    const tableData = response.data.map((item) => [
      item.sNo.toString(),
      item.customerAccount,
      item.customerName,
      item.customerType,
      this.formatNumber(item.balance),
      this.formatNumber(item.notDue),
      this.formatNumber(item.days0To30),
      this.formatNumber(item.days31To60),
      this.formatNumber(item.days61To90),
      this.formatNumber(item.days91To120),
      this.formatNumber(item.days121To180),
      this.formatNumber(item.days181To365),
      this.formatNumber(item.days365To730),
      this.formatNumber(item.days731To1095),
      this.formatNumber(item.above1095),
    ]);

    // Add totals row from summary
    if (response.summary) {
      tableData.push([
        "",
        "",
        "Total",
        "",
        this.formatNumber(response.summary.totalBalance),
        this.formatNumber(response.summary.totalNotDue),
        this.formatNumber(response.summary.totalDays0To30),
        this.formatNumber(response.summary.totalDays31To60),
        this.formatNumber(response.summary.totalDays61To90),
        this.formatNumber(response.summary.totalDays91To120),
        this.formatNumber(response.summary.totalDays121To180),
        this.formatNumber(response.summary.totalDays181To365),
        this.formatNumber(response.summary.totalDays365To730),
        this.formatNumber(response.summary.totalDays731To1095),
        this.formatNumber(response.summary.totalAbove1095),
      ]);
    }

    return tableData;
  },

  /**
   * Get aging status based on balance distribution - Updated for new columns
   */
  getAgingStatus(item: DebtorsAgingResponse["data"][0]): string {
    const totalOverdue =
      item.days0To30 +
      item.days31To60 +
      item.days61To90 +
      item.days91To120 +
      item.days121To180 +
      item.days181To365 +
      item.days365To730 +
      item.days731To1095 +
      item.above1095;

    if (totalOverdue === 0) {
      return "CURRENT";
    } else if (item.above1095 > 0) {
      return "CRITICAL";
    } else if (item.days731To1095 > 0) {
      return "SEVERE_RISK";
    } else if (item.days365To730 > 0) {
      return "HIGH_RISK";
    } else if (item.days181To365 > 0) {
      return "MODERATE_RISK";
    } else if (item.days121To180 > 0) {
      return "ELEVATED_RISK";
    } else if (item.days91To120 > 0) {
      return "WATCH_LIST";
    } else {
      return "LOW_RISK";
    }
  },

  /**
   * Calculate overdue percentage - Updated for new columns
   */
  getOverduePercentage(item: DebtorsAgingResponse["data"][0]): number {
    if (item.balance === 0) return 0;

    const totalOverdue =
      item.days0To30 +
      item.days31To60 +
      item.days61To90 +
      item.days91To120 +
      item.days121To180 +
      item.days181To365 +
      item.days365To730 +
      item.days731To1095 +
      item.above1095;

    return Math.round((totalOverdue / Math.abs(item.balance)) * 100);
  },

  /**
   * Get risk color based on aging category
   */
  getRiskColor(item: DebtorsAgingResponse["data"][0]): string {
    const status = this.getAgingStatus(item);

    switch (status) {
      case "CURRENT":
        return "#10b981"; // green
      case "LOW_RISK":
        return "#3b82f6"; // blue
      case "WATCH_LIST":
        return "#8b5cf6"; // purple
      case "ELEVATED_RISK":
        return "#f59e0b"; // amber
      case "MODERATE_RISK":
        return "#f97316"; // orange
      case "HIGH_RISK":
        return "#ef4444"; // red
      case "SEVERE_RISK":
        return "#dc2626"; // dark red
      case "CRITICAL":
        return "#991b1b"; // darker red
      default:
        return "#6b7280"; // gray
    }
  },

  /**
   * Calculate days weighted average
   */
  getWeightedAverageDays(item: DebtorsAgingResponse["data"][0]): number {
    const totalOverdue =
      item.days0To30 +
      item.days31To60 +
      item.days61To90 +
      item.days91To120 +
      item.days121To180 +
      item.days181To365 +
      item.days365To730 +
      item.days731To1095 +
      item.above1095;

    if (totalOverdue === 0) return 0;

    const weightedSum =
      item.days0To30 * 15 + // midpoint 0-30
      item.days31To60 * 45 + // midpoint 31-60
      item.days61To90 * 75 + // midpoint 61-90
      item.days91To120 * 105 + // midpoint 91-120
      item.days121To180 * 150 + // midpoint 121-180
      item.days181To365 * 273 + // midpoint 181-365
      item.days365To730 * 548 + // midpoint 366-730
      item.days731To1095 * 913 + // midpoint 731-1095
      item.above1095 * 1200; // estimate for above 1095

    return Math.round(weightedSum / totalOverdue);
  },
};

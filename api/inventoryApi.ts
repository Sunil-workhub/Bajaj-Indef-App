// api/inventoryApi.ts - Updated
import axiosInstance from "./axiosInstance";
import {
  InventoryAgingApiResponse,
  InventoryAgingResponse,
  MonthOption,
  MonthsApiResponse,
} from "./types";

export const inventoryApi = {
  /**
   * Get available months for inventory aging - Changed to POST
   */
  async getAvailableMonths(): Promise<MonthOption[]> {
    try {
      const response = await axiosInstance.post<MonthsApiResponse>(
        "/GetAvailableInventoryAgingMonths",
        {},
      );

      console.log("Raw Available Months Response:", response.data);

      if (response.data.status_Code !== 200 || !response.data.data) {
        throw new Error(
          response.data.message || "API returned unsuccessful response",
        );
      }

      return response.data.data.map((month) => ({
        monthDescription: month.monthDescription,
        monthId: month.monthId,
      }));
    } catch (error: any) {
      console.error("Error fetching available months:", error);

      if (error.response) {
        console.error("API Error Status:", error.response.status);
        console.error("API Error Data:", error.response.data);
      }

      throw this.handleError(error, "Failed to fetch available months");
    }
  },

  /**
   * Get inventory aging data for specific month - Changed to POST
   */
  async getInventoryAgingData(
    monthDescription: string,
  ): Promise<InventoryAgingResponse> {
    try {
      if (!monthDescription?.trim()) {
        throw new Error("Month description is required");
      }

      const response = await axiosInstance.post<InventoryAgingApiResponse>(
        "/GetInventoryAgingData",
        monthDescription,
      );

      console.log("Raw Inventory Aging Data Response:", response.data);

      if (response.data.status_Code !== 200 || !response.data.data) {
        throw new Error(
          response.data.message || "API returned unsuccessful response",
        );
      }

      const { data } = response.data;

      // Transform imported components
      const importedComponents = (data.importedComponents || []).map(
        (item) => ({
          subClass: item.invSubClass,
          total: this.formatNumber(item.cTotal),
        }),
      );

      // Transform imported traded components
      const importedTradedComponents = (
        data.importedTradedComponents || []
      ).map((item) => ({
        subClass: item.invSubClass,
        total: this.formatNumber(item.cTotal),
      }));

      // Format bottom totals
      const bottomTotals = {
        khopoli: this.formatNumber(data.bottomTotals?.khopoli || 0),
        mfg: this.formatNumber(data.bottomTotals?.mfg || 0),
        pune: this.formatNumber(data.bottomTotals?.pune || 0),
        mfg84: this.formatNumber(data.bottomTotals?.mfg84 || 0),
      };

      return {
        agingData: data.agingData,
        selectedMonth: data.selectedMonth,
        summary: data.summary,
        importedComponents,
        importedTradedComponents,
        bottomTotals,
      };
    } catch (error: any) {
      console.error("Error fetching inventory aging data:", error);

      if (error.response) {
        console.error("API Error Status:", error.response.status);
        console.error("API Error Data:", error.response.data);
      }

      throw this.handleError(error, "Failed to fetch inventory aging data");
    }
  },

  /**
   * Handle API errors consistently
   */
  handleError(error: any, defaultMessage: string): Error {
    if (error.response?.status === 404) {
      return new Error("No data found for the selected month");
    } else if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    } else if (error.message) {
      return new Error(error.message);
    } else {
      return new Error(defaultMessage);
    }
  },

  /**
   * Format number for display with Indian formatting
   */
  formatNumber(value: number): string {
    if (value === 0) return "0";
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  },

  /**
   * Format currency for display
   */
  formatCurrency(value: number): string {
    if (value === 0) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  },

  /**
   * Convert API data to table format for display
   */
  convertToTableFormat(response: InventoryAgingResponse): string[][] {
    const tableData = response.agingData.map((item) => [
      item.inventoryClass,
      this.formatNumber(item.days1To180),
      this.formatNumber(item.days181To365),
      this.formatNumber(item.days366To730),
      this.formatNumber(item.days731To1095),
      this.formatNumber(item.days1096To1460),
      this.formatNumber(item.days1461Plus),
      this.formatNumber(item.total),
    ]);

    // Add totals row from summary
    if (response.summary) {
      tableData.push([
        "Total",
        this.formatNumber(response.summary.totalDays1To180),
        this.formatNumber(response.summary.totalDays181To365),
        this.formatNumber(response.summary.totalDays366To730),
        this.formatNumber(response.summary.totalDays731To1095),
        this.formatNumber(response.summary.totalDays1096To1460),
        this.formatNumber(response.summary.totalDays1461Plus),
        this.formatNumber(response.summary.grandTotal),
      ]);

      // Add percentages row from summary
      tableData.push([
        "Percentage(%)",
        `${response.summary.percentage1To180.toFixed(2)}%`,
        `${response.summary.percentage181To365.toFixed(2)}%`,
        `${response.summary.percentage366To730.toFixed(2)}%`,
        `${response.summary.percentage731To1095.toFixed(2)}%`,
        `${response.summary.percentage1096To1460.toFixed(2)}%`,
        `${response.summary.percentage1461Plus.toFixed(2)}%`,
        "100.00%",
      ]);
    }

    return tableData;
  },
};

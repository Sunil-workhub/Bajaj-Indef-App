const API_BASE_URL = "http://192.168.1.3:7071/api"; // Replace with your actual API URL

// API Response Types
export interface InventoryAgingItem {
  inventoryClass: string;
  days1To180: string;
  days181To365: string;
  days366To730: string;
  days731To1095: string;
  days1096To1460: string;
  days1461Plus: string;
  total: string;
}

export interface OrderIntakeItem {
  month: string;
  abp: string;
  abpExport: string;
  dc: string;
  dcExport: string;
  total: string;
  scm: string;
}

export interface SalesSummaryItem {
  description: string;
  currentMonth: string;
  ytd: string;
}

export interface MonthlyBreakdownItem {
  month: string;
  currentYear: string;
  previousYear: string;
}

export interface SalesResponse {
  summary: SalesSummaryItem[];
  todaySale: string;
  monthlyBreakdown: MonthlyBreakdownItem[];
}

class ApiService {
  private async fetchData<T>(endpoint: string): Promise<T> {
    try {
      console.log(`Making API call to: ${API_BASE_URL}${endpoint}`);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      console.log(`API Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // console.log(`API Response data:`, data);
      return data;
    } catch (error) {
      console.error(`Error fetching data from ${endpoint}:`, error);
      throw error;
    }
  }

  async getInventoryAging(): Promise<InventoryAgingItem[]> {
    return this.fetchData<InventoryAgingItem[]>("/inventory/aging");
  }

  async getOrderIntake(): Promise<OrderIntakeItem[]> {
    return this.fetchData<OrderIntakeItem[]>("/order/intake");
  }

  async getSalesSummary(): Promise<SalesResponse> {
    return this.fetchData<SalesResponse>("/sales/summary");
  }
}

export const apiService = new ApiService();

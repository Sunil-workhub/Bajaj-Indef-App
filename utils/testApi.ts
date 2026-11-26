import { apiService } from "../services/apiService";

export const testApiConnection = async () => {
  try {
    console.log("Testing API connection...");

    // Test inventory endpoint
    const inventoryData = await apiService.getInventoryAging();
    console.log("✅ Inventory API works:", inventoryData);

    // Test order endpoint
    const orderData = await apiService.getOrderIntake();
    console.log("✅ Order API works:", orderData);

    // Test sales endpoint
    const salesData = await apiService.getSalesSummary();
    console.log("✅ Sales API works:", salesData);

    return true;
  } catch (error) {
    console.error("❌ API test failed:", error);
    return false;
  }
};

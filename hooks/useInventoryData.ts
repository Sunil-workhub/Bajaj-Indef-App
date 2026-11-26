import { useState, useEffect } from "react";
import { apiService, InventoryAgingItem } from "../services/apiService";

export const useInventoryData = () => {
  const [data, setData] = useState<InventoryAgingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching inventory data...");
      const inventoryData = await apiService.getInventoryAging();
      console.log("Inventory data received:", inventoryData);
      setData(inventoryData);
    } catch (err) {
      console.error("Error fetching inventory data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch inventory data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};

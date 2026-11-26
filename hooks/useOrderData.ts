import { useState, useEffect } from "react";
import { apiService, OrderIntakeItem } from "../services/apiService";

export const useOrderData = () => {
  const [data, setData] = useState<OrderIntakeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching order data...");
      const orderData = await apiService.getOrderIntake();
      console.log("Order data received:", orderData);
      setData(orderData);
    } catch (err) {
      console.error("Error fetching order data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch order data"
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

// hooks/useSalesData.ts
import { useCallback, useState } from "react";
import { getSalesSummary } from "../api/salesApi"; // updated import
import { SalesResponse } from "../api/types"; // updated import

export const useSalesData = () => {
  const [data, setData] = useState<SalesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSalesSummary(); // updated call
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
};

export function apiMessage(error: any, fallback: string): string {
  const candidates = [
    error?.response?.data?.message,
    error?.response?.data?.data?.message,
    error?.data?.message,
    error?.message,
  ];
  const message = candidates.find((x) => typeof x === "string" && x.trim());
  return message || fallback;
}

export function unwrapApi<T = any>(response: any): T {
  // Accept either the API envelope or a full Axios response.
  const payload =
    response?.data?.status_Code !== undefined ? response.data : response;
  if (payload?.status_Code !== undefined) {
    const ok =
      Number(payload.status_Code) >= 200 &&
      Number(payload.status_Code) < 300 &&
      String(payload.status ?? "Success").toLowerCase() !== "failed";
    if (!ok) throw new Error(payload.message || "Request failed.");
    return payload.data as T;
  }
  return payload as T;
}

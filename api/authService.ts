// src/api/authService.ts
import axiosInstance from "./axiosInstance";
import {
  ApiResponseWrapper,
  CheckDeviceResponseData,
  LoginResponseData,
  MenuAccessResponseData,
  RegisterResponseData,
} from "./types";

// Read the backend's error message before validating the response data.
function extractError(error: unknown, fallback: string): Error {
  const e = error as any;
  const message = e?.response?.data?.message ?? e?.data?.message ?? e?.message;
  const result = new Error(
    typeof message === "string" && message.trim() ? message : fallback,
  ) as Error & { httpStatus?: number; status_Code?: number };
  result.httpStatus = e?.response?.status;
  result.status_Code = e?.response?.data?.status_Code ?? e?.status_Code;
  return result;
}

async function postAuth<T>(
  url: string,
  payload: object,
  fallback: string,
): Promise<T> {
  try {
    const response = await axiosInstance.post<ApiResponseWrapper<T>>(
      url,
      payload,
    );
    const body = response.data;
    if (!body || typeof body.status_Code !== "number") {
      throw new Error("Invalid response from server.");
    }
    if (
      body.status_Code < 200 ||
      body.status_Code >= 300 ||
      String(body.status).toLowerCase() === "failed"
    ) {
      const rejected = new Error(body.message || fallback) as Error & {
        status_Code?: number;
      };
      rejected.status_Code = body.status_Code;
      throw rejected;
    }
    if (body.data == null) {
      throw new Error("Server returned no data for a successful request.");
    }
    return body.data;
  } catch (error) {
    throw extractError(error, fallback);
  }
}

export const registerUser = (email: string): Promise<RegisterResponseData> =>
  postAuth("/Register", { email }, "Unable to register.");

export interface LoginPayload {
  email: string;
  password: string;
  deviceId: string;
  platform?: string;
  deviceLabel?: string;
}

export const loginUser = (payload: LoginPayload): Promise<LoginResponseData> =>
  postAuth("/Login", payload, "Unable to log in.");

export const checkDeviceAccess = (
  deviceId: string,
): Promise<CheckDeviceResponseData> =>
  postAuth(
    "/CheckDevice",
    { deviceId: "304e6701fdc0aa75" },
    "Device validation failed.",
  );

export const getMenuAccess = (
  userId: number,
  orgId: number,
): Promise<MenuAccessResponseData> =>
  postAuth("/GetMenuAccess", { userId, orgId }, "Unable to load menu access.");

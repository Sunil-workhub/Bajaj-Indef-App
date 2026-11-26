import axiosInstance from "./axiosInstance";
import {
  AdditionalPasswordData,
  AssetMasterData,
  PinValidationApiResponse,
  PinValidationRequest,
  PinValidationResponse,
  SearchPasswordsApiResponse,
  SearchPasswordsRequest,
  SearchPasswordsResponse,
  UpdatePasswordApiResponse,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
} from "./types";

// ========== PIN VALIDATION API ==========
const transformPinValidationData = (
  apiResponse: PinValidationApiResponse,
): PinValidationResponse => {
  return {
    isValid: apiResponse.data,
    message: apiResponse.message,
  };
};

export const validateUserPin = async (
  pin: number,
): Promise<PinValidationResponse> => {
  try {
    const requestPayload: PinValidationRequest = { pin };

    const response = await axiosInstance.post<PinValidationApiResponse>(
      "/GetUserByPin",
      requestPayload,
    );

    if (response.data.status_Code !== 200) {
      throw new Error(response.data.message || "PIN validation failed");
    }

    return transformPinValidationData(response.data);
  } catch (error) {
    console.error("Error validating PIN:", error);
    throw new Error("Failed to validate PIN. Please try again.");
  }
};

// ========== SEARCH PASSWORDS API ==========
// NOTE: apiResponse.data is expected to be an ARRAY now.
const transformSearchPasswordsData = (
  apiResponse: SearchPasswordsApiResponse,
  type: "1" | "2",
): SearchPasswordsResponse => {
  const rows = apiResponse.data ?? [];

  if (type === "1") {
    const assetList: AssetMasterData[] = rows.map((x) => ({
      empId: x.asset_Id,
      empName: x.serialno,
      code: x.asset_Id ?? "",
      adminPassword: x.admin_Pass ?? "",
      avAdminPassword: x.av_Valid_Admin_Pwd ?? "",
      avLockPassword: x.av_Valid_Lock_Pwd ?? "",
    }));

    return { type: "assetMaster", data: assetList };
  }

  const additionalList: AdditionalPasswordData[] = rows.map((x) => ({
    empId: x.addln_Pwd_Id,
    empName: x.short_Desc,
    username: x.addln_User ?? "",
    url: x.siteurl ?? "",
    password: x.addln_Pwd ?? "",
  }));

  return { type: "additionalPassword", data: additionalList };
};

export const searchPasswords = async (
  type: "1" | "2",
  searchValue: string,
): Promise<SearchPasswordsResponse> => {
  try {
    const requestPayload: SearchPasswordsRequest = { type, searchValue };

    const response = await axiosInstance.post<SearchPasswordsApiResponse>(
      "/SearchPasswords",
      requestPayload,
    );

    if (response.data.status_Code !== 200) {
      throw new Error(response.data.message || "Search failed");
    }

    return transformSearchPasswordsData(response.data, type);
  } catch (error) {
    console.error("Error searching passwords:", error);
    throw new Error("Failed to fetch password data. Please try again.");
  }
};

// Helper functions for specific searches (return LISTS)
export const searchAssetMaster = async (
  searchValue: string,
): Promise<AssetMasterData[]> => {
  const result = await searchPasswords("1", searchValue);
  if (result.type !== "assetMaster") throw new Error("Invalid response type");
  return result.data as AssetMasterData[];
};

export const searchAdditionalPassword = async (
  searchValue: string,
): Promise<AdditionalPasswordData[]> => {
  const result = await searchPasswords("2", searchValue);
  if (result.type !== "additionalPassword")
    throw new Error("Invalid response type");
  return result.data as AdditionalPasswordData[];
};

// ========== UPDATE PASSWORD API ==========
const transformUpdatePasswordData = (
  apiResponse: UpdatePasswordApiResponse,
): UpdatePasswordResponse => {
  return {
    success: apiResponse.status_Code === 200,
    message: apiResponse.message,
  };
};

export const updatePasswordByType = async (
  type: 1 | 2 | 3 | 4,
  password: string,
  recordId: number,
): Promise<UpdatePasswordResponse> => {
  try {
    const requestPayload: UpdatePasswordRequest = {
      type,
      password,
      recordId,
    };

    const response = await axiosInstance.post<UpdatePasswordApiResponse>(
      "/UpdatePasswordByType",
      requestPayload,
    );

    return transformUpdatePasswordData(response.data);
  } catch (error) {
    console.error("Error updating password:", error);
    throw new Error("Failed to update password. Please try again.");
  }
};

// Helper functions for specific password updates
export const updateAdminPassword = async (
  password: string,
  recordId: number,
): Promise<UpdatePasswordResponse> =>
  updatePasswordByType(1, password, recordId);

export const updateAvAdminPassword = async (
  password: string,
  recordId: number,
): Promise<UpdatePasswordResponse> =>
  updatePasswordByType(2, password, recordId);

export const updateAvLockPassword = async (
  password: string,
  recordId: number,
): Promise<UpdatePasswordResponse> =>
  updatePasswordByType(3, password, recordId);

export const updateAdditionalPassword = async (
  password: string,
  recordId: number,
): Promise<UpdatePasswordResponse> =>
  updatePasswordByType(4, password, recordId);

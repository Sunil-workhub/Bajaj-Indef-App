// src/api/axiosInstance.ts
import axios from "axios";
import Constants from "expo-constants";

const AUTH_KEY =
  "0oIHvQu7ouEpuBWJhLTFKYU5+gSzcZo0w7RTpdgdJKHNQEGjgNhBZFYVGI9pRH4x";

// const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? "";
const apoi = Constants.expoConfig?.extra?.apiUrl;
// console.log(apoi);
const axiosInstance = axios.create({
  // baseURL: "https://localhost:7299/api/IMLEC", // Replace with your actual base URL
  baseURL: "https://imlws.indef.com/api/IMLEC",
  // baseURL: "https://uatimlws.indef.com/api/IMLEC",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: AUTH_KEY,
    // "Authorization": key =${HARDCODED_TOKEN} // Pass hardcoded token
  },
  timeout: 10000, // 10 seconds
});

// Optional: request/response interceptors
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token here if needed
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  },
);

export default axiosInstance;

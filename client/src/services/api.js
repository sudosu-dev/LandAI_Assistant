import axios from "axios";

let logoutCallback = null;
let isLoggingOut = false; // Prevent multiple logout calls

export const setLogoutCallback = (callback) => {
  logoutCallback = callback;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only trigger logout on 401 if we have a callback and aren't already logging out
    if (error.response?.status === 401 && logoutCallback && !isLoggingOut) {
      isLoggingOut = true;
      logoutCallback();
      // Reset the flag after a brief delay
      setTimeout(() => {
        isLoggingOut = false;
      }, 1000);
    }
    return Promise.reject(error);
  }
);

export default api;

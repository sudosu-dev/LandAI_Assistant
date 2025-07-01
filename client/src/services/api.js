import axios from "axios";

let logoutCallback = null;

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
    if (error.response?.status === 401 && logoutCallback) {
      logoutCallback();
    }
    return Promise.reject(error);
  }
);

export default api;

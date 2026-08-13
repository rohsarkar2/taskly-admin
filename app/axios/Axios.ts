import axios from "axios";
import { store } from "@/lib/redux/store";
import { setTokens, clearTokens } from "@/lib/redux/slices/authSlice";
import { ADMIN_ENDPOINTS } from "@/lib/api/endpoints";

export const axiosPublic = axios.create({
  baseURL: process.env.NEXT_PUBLIC_TASKLY_BASE_URL || "http://localhost:8080",
});

export const axiosPrivate = axios.create({
  baseURL: process.env.NEXT_PUBLIC_TASKLY_BASE_URL || "http://localhost:8080",
});

axiosPrivate.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const accessToken = state.auth.accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const state = store.getState();
        const refreshToken = state.auth.refreshToken;

        if (!refreshToken) {
          store.dispatch(clearTokens());
          if (typeof window !== "undefined") {
            window.location.href = "/sign-in";
          }
          return Promise.reject(error);
        }

        const response = await axiosPublic.post(
          ADMIN_ENDPOINTS.REFRESH_TOKEN,
          { refreshToken },
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data.data;

        store.dispatch(
          setTokens({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          }),
        );

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosPrivate(originalRequest);
      } catch (refreshError) {
        store.dispatch(clearTokens());
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

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

// Request interceptor to add access token
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

// Response interceptor to handle token refresh
axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const state = store.getState();
        const refreshToken = state.auth.refreshToken;

        if (!refreshToken) {
          // No refresh token, clear auth and redirect to login
          store.dispatch(clearTokens());
          if (typeof window !== "undefined") {
            window.location.href = "/sign-in";
          }
          return Promise.reject(error);
        }

        // Try to refresh the token. This deliberately stays inline rather than
        // calling `lib/api/auth.ts` — that module imports these instances, so
        // reaching back into it here would be a cycle.
        const response = await axiosPublic.post(
          ADMIN_ENDPOINTS.REFRESH_TOKEN,
          { refreshToken },
        );

        // Responses are enveloped as { success, message, data }.
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // Update tokens in Redux and sessionStorage
        store.dispatch(
          setTokens({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          }),
        );

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosPrivate(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
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

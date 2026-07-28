import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
  withCredentials: false,
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Refresh-token rotation: on a 401, try once to exchange the refresh token for a
// new access/refresh pair (via the auth store) before giving up and logging out.
let refreshPromise: Promise<string | null> | null = null;

export function registerRefreshHandler(handler: () => Promise<string | null>) {
  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;
      if (error.response?.status === 401 && !original._retry) {
        original._retry = true;
        refreshPromise ??= handler().finally(() => {
          refreshPromise = null;
        });
        const newToken = await refreshPromise;
        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      }
      return Promise.reject(error);
    },
  );
}

/**
 * API service — Axios instance with JWT interceptors.
 *
 * Base URL is configured with your local LAN IP (192.168.1.28:8000/api)
 * so your physical Android phone on the same Wi-Fi can connect directly.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

// ── Configuration ──────────────────────────────────────────────────────
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.32:8000/api";


// ── Token storage keys ─────────────────────────────────────────────────
const ACCESS_TOKEN_KEY = "calltracer_access_token";
const REFRESH_TOKEN_KEY = "calltracer_refresh_token";

// ── Token helpers ──────────────────────────────────────────────────────

export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveTokens(
  access: string,
  refresh: string
): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

// ── Axios instance ─────────────────────────────────────────────────────

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: attach JWT ────────────────────────────────────

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 → logout ──────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear tokens and redirect to login
      await clearTokens();
      router.replace("/(auth)/login");
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };

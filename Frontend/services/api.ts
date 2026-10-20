/**
 * API service — Axios instance with dynamic LAN host detection and JWT interceptors.
 * Automatically resolves the host machine's active IP via Expo Constants so physical
 * mobile devices on the Wi-Fi network connect seamlessly without manual IP changes.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveApiBaseUrl(): string {
  // 1. Explicit env override if specified and not the stale .57 or .8 IP
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes("192.168.1.57") && !envUrl.includes("192.168.1.8")) {
    return envUrl;
  }

  // 2. Web browser or local simulator
  if (Platform.OS === "web") {
    return "http://localhost:8000/api";
  }

  // 3. Dynamic Expo host detection (matches whatever LAN IP your laptop currently has)
  const host = Constants.expoConfig?.hostUri?.split(":")?.[0];
  if (host) {
    return `http://${host}:8000/api`;
  }

  // 4. Current Wi-Fi LAN IP fallback
  return "http://192.168.1.36:8000/api";
}

const API_BASE_URL = resolveApiBaseUrl();

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
      await clearTokens();
      router.replace("/(auth)/login");
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };

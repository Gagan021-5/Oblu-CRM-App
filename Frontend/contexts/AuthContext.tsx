/**
 * AuthContext — provides authentication state and methods to the entire app.
 *
 * Exposes: user, isLoading, login(), register(), logout()
 * Stores JWT tokens in expo-secure-store.
 * Decodes the JWT to extract role and connect_code.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import api, {
  saveTokens,
  clearTokens,
  getAccessToken,
} from "@/services/api";

// ── Types ──────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  username: string;
  role: "user" | "admin";
  consent_given?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  role?: "user" | "admin";
  device_id?: string;
  device_model?: string;
}

// ── JWT Decode helper ──────────────────────────────────────────────────

function decodeJWT(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// ── Context ────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({} as AuthUser),
  register: async () => {},
  logout: async () => {},
});

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

// ── Provider ───────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on app mount
  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          const decoded = decodeJWT(token);
          if (decoded && decoded.exp * 1000 > Date.now()) {
            setUser({
              id: decoded.user_id,
              username: decoded.username,
              role: decoded.role,
              consent_given: decoded.consent_given || false,
            });
          } else {
            await clearTokens();
          }
        }
      } catch {
        await clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<AuthUser> => {
    const response = await api.post("/auth/login/", { username, password });
    const { access, refresh, user: userData } = response.data;

    await saveTokens(access, refresh);
    const authUser: AuthUser = {
      id: userData?.id || response.data.user_id,
      username: userData?.username || response.data.username,
      role: userData?.role || response.data.role,
      consent_given: userData?.consent_given || false,
    };
    setUser(authUser);
    return authUser;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const regResp = await api.post("/auth/register/", data);
    const { tokens, user: userData } = regResp.data;

    if (tokens?.access && tokens?.refresh) {
      await saveTokens(tokens.access, tokens.refresh);
      setUser({
        id: userData.id,
        username: userData.username,
        role: userData.role,
        consent_given: userData.consent_given || false,
      });
    } else {
      // Fallback: login explicitly
      const loginResp = await api.post("/auth/login/", {
        username: data.username,
        password: data.password,
      });
      const { access, refresh, user: loginUser } = loginResp.data;
      await saveTokens(access, refresh);
      setUser({
        id: loginUser?.id,
        username: loginUser?.username,
        role: loginUser?.role,
        consent_given: loginUser?.consent_given,
      });
    }
  }, []);

  const logout = useCallback(async () => {
    await clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, hasAccessToken, setAccessToken, setAuthFailureHandler, setTokenRefreshHandler } from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/api-error";
import type { AuthResponse, AuthUser } from "@/types/auth";
import type { LoginFormValues, RegisterAgencyFormValues } from "./auth.schemas";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (values: LoginFormValues) => Promise<void>;
  registerAgency: (values: RegisterAgencyFormValues) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function dashboardPathForRole(role: AuthUser["role"]) {
  return role === "SUPER_ADMIN" ? "/super-admin/dashboard" : "/agency/dashboard";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setToken] = useState<string | null>(() => localStorage.getItem("accessToken"));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const applyAuth = useCallback((response: AuthResponse) => {
    setUser(response.user);
    setToken(response.accessToken);
    setAccessToken(response.accessToken);
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    setAccessToken(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const response = await api.post<AuthResponse>("/auth/refresh");
    applyAuth(response.data);
  }, [applyAuth]);

  useEffect(() => {
    setAuthFailureHandler(() => {
      clearAuth();
      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    });
    setTokenRefreshHandler((token) => setToken(token));

    return () => {
      setAuthFailureHandler(null);
      setTokenRefreshHandler(null);
    };
  }, [clearAuth, location.pathname, navigate]);

  useEffect(() => {
    if (!hasAccessToken()) {
      clearAuth();
      setIsLoading(false);
      return;
    }

    refreshSession()
      .catch(() => clearAuth())
      .finally(() => setIsLoading(false));
  }, [clearAuth, refreshSession]);

  const login = useCallback(
    async (values: LoginFormValues) => {
      const response = await api.post<AuthResponse>("/auth/login", values);
      applyAuth(response.data);
      toast.success("Connexion réussie");
      navigate(dashboardPathForRole(response.data.user.role), { replace: true });
    },
    [applyAuth, navigate]
  );

  const registerAgency = useCallback(
    async (values: RegisterAgencyFormValues) => {
      const response = await api.post<AuthResponse>("/auth/register-agency", {
        agency: {
          name: values.agencyName,
          email: values.agencyEmail,
          phone: values.agencyPhone || undefined,
          address: values.agencyAddress || undefined,
          city: values.agencyCity || undefined
        },
        admin: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone || undefined,
          password: values.password
        }
      });
      applyAuth(response.data);
      toast.success("Agence créée avec essai gratuit activé");
      navigate(dashboardPathForRole(response.data.user.role), { replace: true });
    },
    [applyAuth, navigate]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      toast.error("Déconnexion distante impossible", { description: getApiErrorMessage(error) });
    } finally {
      clearAuth();
      toast.success("Déconnexion réussie");
      navigate("/login", { replace: true });
    }
  }, [clearAuth, navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      login,
      registerAgency,
      logout,
      refreshSession
    }),
    [accessToken, isLoading, login, logout, refreshSession, registerAgency, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

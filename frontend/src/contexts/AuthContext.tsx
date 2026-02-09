import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import api, { type User } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isOperator: boolean;
  canWrite: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem("token"),
    loading: true,
  });

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setState({ user: null, token: null, loading: false });
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setState({ user: data.data, token, loading: false });
    } catch {
      localStorage.removeItem("token");
      setState({ user: null, token: null, loading: false });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post("/auth/login", { email, password });
      const token = data.data.token;
      localStorage.setItem("token", token);
      setState((prev) => ({ ...prev, token }));
      await fetchUser();
    },
    [fetchUser]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem("token");
    setState({ user: null, token: null, loading: false });
  }, []);

  const isAdmin = state.user?.role === "Admin";
  const isOperator = state.user?.role === "Operator";
  const canWrite = isAdmin || isOperator;

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, isAdmin, isOperator, canWrite }}
    >
      {children}
    </AuthContext.Provider>
  );
}

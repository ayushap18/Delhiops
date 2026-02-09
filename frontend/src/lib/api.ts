import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await api.post("/auth/refresh");
        const newToken = data.data.token;
        localStorage.setItem("token", newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  requestId?: string;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface AqiReading {
  id: number;
  timestamp: string;
  location: Location;
  aqi: number;
  pm2_5: number | null;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
}

export interface CrimeReport {
  id: number;
  type: string;
  location: Location;
  severity: string;
  timestamp: string;
  status: "reported" | "investigating" | "resolved" | "closed";
}

export interface TrafficData {
  id: number;
  congestion_level: number;
  speed: number;
  timestamp: string;
}

export interface Camera {
  id: number;
  location: Location;
  status: "online" | "offline" | "maintenance";
  coordinates: string;
  feed_url: string;
}

export interface Incident {
  id: number;
  type: string;
  severity: string;
  location: Location;
  timestamp: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
}

export interface User {
  id: number;
  email: string;
  role: "Admin" | "Operator" | "Viewer";
}

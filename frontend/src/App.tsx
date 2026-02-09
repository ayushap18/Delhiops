import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const AqiPage = lazy(() => import("@/pages/AqiPage"));
const TrafficPage = lazy(() => import("@/pages/TrafficPage"));
const CrimePage = lazy(() => import("@/pages/CrimePage"));
const CamerasPage = lazy(() => import("@/pages/CamerasPage"));
const IncidentsPage = lazy(() => import("@/pages/IncidentsPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const AiTerminalPage = lazy(() => import("@/pages/AiTerminalPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <SocketProvider>
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="aqi" element={<AqiPage />} />
                  <Route path="traffic" element={<TrafficPage />} />
                  <Route path="crime" element={<CrimePage />} />
                  <Route path="cameras" element={<CamerasPage />} />
                  <Route path="incidents" element={<IncidentsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="ai-terminal" element={<AiTerminalPage />} />
                  <Route
                    path="admin"
                    element={
                      <ProtectedRoute roles={["Admin"]}>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

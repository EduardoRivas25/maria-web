import { createHashRouter, Outlet } from "react-router-dom";
import App from "./App";
import { AuthProvider, ProtectedRoute, AuthCallback } from "./lib/auth";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import TasksPage from "./pages/TasksPage";
import CalendarPage from "./pages/CalendarPage";
import EmailPage from "./pages/EmailPage";
import FilesPage from "./pages/FilesPage";
import ProductivityPage from "./pages/ProductivityPage";
import FinancesPage from "./pages/FinancesPage";
import SettingsPage from "./pages/SettingsPage";
import ClassroomPage from "./pages/ClassroomPage";

/**
 * Root layout — wraps all routes with AuthProvider so auth state
 * is available everywhere (landing, callback, dashboard).
 */
function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export const router = createHashRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <App />,
      },
      {
        path: "/auth/callback",
        element: <AuthCallback />,
      },
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <DashboardHome /> },
          { path: "tareas", element: <TasksPage /> },
          { path: "clases", element: <ClassroomPage /> },
          { path: "calendario", element: <CalendarPage /> },
          { path: "correos", element: <EmailPage /> },
          { path: "archivos", element: <FilesPage /> },
          { path: "productividad", element: <ProductivityPage /> },
          { path: "finanzas", element: <FinancesPage /> },
          { path: "configuracion", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

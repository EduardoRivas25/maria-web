import { createBrowserRouter } from "react-router-dom";
import App from "./App";
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

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
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
]);

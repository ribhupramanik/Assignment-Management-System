import { Route, Routes } from "react-router-dom";

import HomeRedirect from "./components/HomeRedirect";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import StudentHomePage from "./pages/StudentHomePage";
import StudentGroupsPage from "./pages/StudentGroupsPage";
import StudentAssignmentsPage from "./pages/StudentAssignmentsPage";
import StudentProgressPage from "./pages/StudentProgressPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentHomePage />} />
        <Route path="groups" element={<StudentGroupsPage />} />
        <Route path="assignments" element={<StudentAssignmentsPage />} />
        <Route path="progress" element={<StudentProgressPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

export default App;

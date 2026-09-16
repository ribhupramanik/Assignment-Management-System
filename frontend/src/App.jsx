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
import AdminHomePage from "./pages/AdminHomePage";
import AdminAssignmentsPage from "./pages/AdminAssignmentsPage";
import AdminAssignmentDetailPage from "./pages/AdminAssignmentDetailPage";
import AdminSubmissionTrackingPage from './pages/AdminSubmissionTrackingPage'
import NotFoundPage from './pages/NotFoundPage'

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
      >
        <Route index element={<AdminHomePage />} />
        <Route path="assignments" element={<AdminAssignmentsPage />} />
        <Route path="assignments/:assignmentId" element={<AdminAssignmentDetailPage />} />
        <Route path="assignments/:assignmentId/submissions" element={<AdminSubmissionTrackingPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;

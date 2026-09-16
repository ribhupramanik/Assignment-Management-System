import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const AdminHomePage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-gray-500">Professor Dashboard</p>

        <h2 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          Welcome, {user.name}
        </h2>

        <p className="mt-2 text-gray-600">
          Manage assignments and monitor student progress from your dashboard.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Assignment Management
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          Create assignments for all students or selected groups.
        </p>

        <Link
          to="/admin/assignments"
          className="mt-5 inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Manage assignments
        </Link>
      </div>
    </div>
  );
};

export default AdminHomePage;

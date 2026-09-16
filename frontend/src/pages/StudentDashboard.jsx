import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const StudentDashboard = () => {
  const { user, logout } = useAuth();

  const navClass = ({ isActive }) =>
    [
      "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition md:block md:px-3",
      isActive
        ? "bg-gray-900 text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
    ].join(" ");

  return (
    <main className="min-h-screen overflow-x-hidden bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Joineazy</h1>

            <p className="text-sm text-gray-500">Student Portal</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>

              <p className="text-xs text-gray-500">{user.student_id}</p>
            </div>

            <button
              onClick={logout}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:px-4"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-4 py-5 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:px-8">
        <aside className="min-w-0 overflow-x-auto rounded-xl border border-gray-200 bg-white p-2 md:h-fit md:p-3">
          <nav className="flex min-w-max gap-2 md:block md:min-w-0 md:space-y-1">
            <NavLink to="/student" end className={navClass}>
              Overview
            </NavLink>

            <NavLink to="/student/groups" className={navClass}>
              My Groups
            </NavLink>
            <NavLink to="/student/assignments" className={navClass}>
              Assignments
            </NavLink>

            <NavLink to="/student/progress" className={navClass}>
              Progress
            </NavLink>
          </nav>
        </aside>

        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </main>
  );
};

export default StudentDashboard;

import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

const StudentHomePage = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-gray-500">
          Student Dashboard
        </p>

        <h2 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          Welcome, {user.name}
        </h2>

        <p className="mt-2 text-gray-600">
          Manage your groups and assignment activity
          from your dashboard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Student ID
          </p>

          <p className="mt-2 text-lg font-semibold text-gray-900">
            {user.student_id}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">
            Email
          </p>

          <p className="mt-2 break-all text-lg font-semibold text-gray-900">
            {user.email}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Groups
        </h3>

        <p className="mt-2 text-gray-600">
          Create a group, view its members, or add
          students using their email or student ID.
        </p>

        <Link
          to="/student/groups"
          className="mt-5 inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Manage groups
        </Link>
      </div>
    </div>
  )
}

export default StudentHomePage
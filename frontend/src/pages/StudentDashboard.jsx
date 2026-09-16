import { useAuth } from '../context/AuthContext'

const StudentDashboard = () => {
  const {
    user,
    logout,
  } = useAuth()

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">

        <div className="flex items-center justify-between rounded-xl bg-white p-6 border border-gray-200">
          <div>
            <p className="text-sm text-gray-500">
              Student dashboard
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              Welcome, {user.name}
            </h1>

            <p className="mt-1 text-gray-600">
              {user.student_id}
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Logout
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
          Student dashboard features will be added next.
        </div>

      </div>
    </main>
  )
}

export default StudentDashboard
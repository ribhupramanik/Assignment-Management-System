import { Link } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

const NotFoundPage = () => {
  const { user } = useAuth()

  const homePath =
    user?.role === 'admin'
      ? '/admin'
      : user?.role === 'student'
        ? '/student'
        : '/login'

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center">

        <p className="text-sm font-medium text-gray-500">
          404
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Page not found
        </h1>

        <p className="mt-3 text-gray-600">
          The page you're looking for doesn't
          exist.
        </p>

        <Link
          to={homePath}
          className="mt-6 inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Return to dashboard
        </Link>

      </div>
    </main>
  )
}

export default NotFoundPage
import { useState } from 'react'
import {
  Link,
  useNavigate,
} from 'react-router-dom'

import api from '../api/api'

const RegisterPage = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    studentId: '',
    email: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [submitting, setSubmitting] =
    useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSubmitting(true)

    try {
      await api.post('/auth/register', form)

      navigate('/login', {
        state: {
          registered: true,
        },
      })
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Unable to register'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-gray-200">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create account
          </h1>

          <p className="mt-2 text-gray-600">
            Register as a Joineazy student.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full name
            </label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Student ID
            </label>

            <input
              name="studentId"
              value={form.studentId}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>

            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              name="password"
              type="password"
              minLength={8}
              value={form.password}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
            />

            <p className="mt-1 text-xs text-gray-500">
              Minimum 8 characters.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {submitting
              ? 'Creating account...'
              : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-medium text-gray-900 underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}

export default RegisterPage
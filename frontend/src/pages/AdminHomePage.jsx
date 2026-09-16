import { useCallback, useEffect, useState } from "react";

import { Link } from "react-router-dom";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const formatDate = (value) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const statusLabel = {
  no_students: "No Students",
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

const AdminHomePage = () => {
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/dashboard/analytics");

      setAnalytics(response.data);
    } catch (error) {
      setAnalytics(null);

      setError(
        error.response?.data?.message || "Unable to load dashboard analytics",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Unable to load dashboard"}
        </div>

        <button
          type="button"
          onClick={loadAnalytics}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Try again
        </button>
      </div>
    );
  }

  const {
    summary,
    assignment_performance: assignmentPerformance,
    group_performance: groupPerformance,
  } = analytics;

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            Professor Dashboard
          </p>

          <h2 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            Welcome, {user.name}
          </h2>

          <p className="mt-2 text-gray-600">
            Monitor assignments, submissions, and group performance.
          </p>
        </div>

        <Link
          to="/admin/assignments"
          className="inline-flex w-fit rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Manage assignments
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Students</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {summary.total_students}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Groups</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {summary.total_groups}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Assignments</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {summary.total_assignments}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Overdue</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {summary.overdue_assignments}
          </p>
        </div>
      </div>

      {/* Overall Confirmation */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Overall submission confirmation
            </p>

            <h3 className="mt-1 text-xl font-bold text-gray-900">
              Student completion
            </h3>
          </div>

          <p className="text-3xl font-bold text-gray-900">
            {summary.overall_confirmation_percentage}%
          </p>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gray-900 transition-all"
            style={{
              width: `${Math.min(
                100,
                Math.max(0, summary.overall_confirmation_percentage),
              )}%`,
            }}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">Expected</p>

            <p className="mt-1 text-xl font-semibold text-gray-900">
              {summary.expected_confirmations}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Confirmed</p>

            <p className="mt-1 text-xl font-semibold text-gray-900">
              {summary.confirmed_submissions}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Pending</p>

            <p className="mt-1 text-xl font-semibold text-gray-900">
              {summary.pending_submissions}
            </p>
          </div>
        </div>
      </div>

      {/* Assignment Performance */}
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Assignment performance
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Submission completion for each assignment.
            </p>
          </div>

          <Link
            to="/admin/assignments"
            className="shrink-0 text-sm font-medium text-gray-900 underline"
          >
            View all
          </Link>
        </div>

        {assignmentPerformance.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            No assignments available.
          </div>
        ) : (
          <div className="space-y-4">
            {assignmentPerformance.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="break-words font-semibold text-gray-900">
                        {assignment.title}
                      </h4>

                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        {assignment.scope === "all" ? "All students" : "Groups"}
                      </span>

                      {assignment.is_overdue && (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                          Overdue
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      Due {formatDate(assignment.due_date)}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {statusLabel[assignment.status] || assignment.status}
                  </span>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Confirmed</p>

                    <p className="mt-1 font-medium text-gray-900">
                      {assignment.confirmed_students} /{" "}
                      {assignment.total_students} students
                    </p>
                  </div>

                  <p className="text-lg font-bold text-gray-900">
                    {assignment.completion_percentage}%
                  </p>
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gray-900"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, assignment.completion_percentage),
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-4">
                  <Link
                    to={`/admin/assignments/${assignment.id}/submissions`}
                    className="text-sm font-medium text-gray-900 underline"
                  >
                    View submissions
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group Performance */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Group performance
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Overall assignment completion by group.
          </p>
        </div>

        {groupPerformance.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            No groups available.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {groupPerformance.map((group) => (
              <div
                key={group.id}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="break-words font-semibold text-gray-900">
                      {group.name}
                    </h4>

                    <p className="mt-1 text-sm text-gray-500">
                      {group.member_count}{" "}
                      {group.member_count === 1 ? "member" : "members"}
                      {" · "}
                      {group.total_assignments}{" "}
                      {group.total_assignments === 1
                        ? "assignment"
                        : "assignments"}
                    </p>
                  </div>

                  <span className="shrink-0 text-lg font-bold text-gray-900">
                    {group.completion_percentage}%
                  </span>
                </div>

                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gray-900"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, group.completion_percentage),
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Expected</p>

                    <p className="mt-1 font-medium text-gray-900">
                      {group.expected_confirmations}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Confirmed</p>

                    <p className="mt-1 font-medium text-gray-900">
                      {group.confirmed_submissions}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Pending</p>

                    <p className="mt-1 font-medium text-gray-900">
                      {group.pending_submissions}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHomePage;

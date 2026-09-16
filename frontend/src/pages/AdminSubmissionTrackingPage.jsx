import { useCallback, useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import api from "../api/api";

const formatDate = (value) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const AdminSubmissionTrackingPage = () => {
  const { assignmentId } = useParams();

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/admin/assignments/${assignmentId}/submissions`,
      );

      setData(response.data);
    } catch (error) {
      setData(null);

      setError(
        error.response?.data?.message || "Unable to load submission tracking",
      );
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Loading submission tracking...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Link
          to="/admin/assignments"
          className="text-sm font-medium text-gray-900 underline"
        >
          Back to assignments
        </Link>
      </div>
    );
  }

  const { assignment, summary, groups, students } = data;

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            to={`/admin/assignments/${assignmentId}`}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Assignment details
          </Link>

          <Link
            to="/admin/assignments"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            All assignments
          </Link>
        </div>

        <p className="mt-5 text-sm font-medium text-gray-500">
          Submission Tracking
        </p>

        <h2 className="mt-1 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
          {assignment.title}
        </h2>

        <p className="mt-2 text-gray-600">
          Monitor student confirmations and group completion.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Overall Progress */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">Overall completion</p>

            <h3 className="mt-1 text-xl font-bold text-gray-900">
              {assignment.scope === "all" ? "All students" : "Assigned groups"}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Due {formatDate(assignment.due_date)}
            </p>
          </div>

          <p className="text-3xl font-bold text-gray-900">
            {summary.completion_percentage}%
          </p>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gray-900 transition-all"
            style={{
              width: `${Math.min(
                100,
                Math.max(0, summary.completion_percentage),
              )}%`,
            }}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <p className="text-sm text-gray-500">Students</p>

            <p className="mt-1 text-xl font-semibold text-gray-900">
              {summary.total_students}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Confirmed</p>

            <p className="mt-1 text-xl font-semibold text-gray-900">
              {summary.confirmed_students}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Pending</p>

            <p className="mt-1 text-xl font-semibold text-gray-900">
              {summary.pending_students}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Late</p>

            <p className="mt-1 text-xl font-semibold text-gray-900">
              {summary.late_confirmations}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Completion</p>

            <p className="mt-1 text-xl font-semibold text-gray-900">
              {summary.completion_percentage}%
            </p>
          </div>
        </div>
      </div>

      {/* Group Progress */}
      {groups.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Group progress
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Submission completion by group.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {groups.map((group) => (
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
                      {group.confirmed_members} of {group.total_members}{" "}
                      confirmed
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

                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Pending</p>

                    <p className="mt-1 font-medium text-gray-900">
                      {group.pending_members}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Late</p>

                    <p className="mt-1 font-medium text-gray-900">
                      {group.late_confirmations}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Status</p>

                    <p className="mt-1 font-medium capitalize text-gray-900">
                      {group.status.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h3 className="font-semibold text-gray-900">Student submissions</h3>

          <p className="mt-1 text-sm text-gray-500">
            Individual confirmation status for this assignment.
          </p>
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No eligible students found.
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-gray-100 sm:hidden">
              {students.map((student) => (
                <div key={student.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-gray-900">
                        {student.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {student.student_id}
                      </p>

                      <p className="mt-1 break-all text-xs text-gray-500">
                        {student.email}
                      </p>
                    </div>

                    {!student.confirmed ? (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        Pending
                      </span>
                    ) : student.is_late ? (
                      <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Confirmed Late
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                        Confirmed
                      </span>
                    )}
                  </div>

                  {student.confirmed && (
                    <p className="mt-3 text-xs text-gray-500">
                      Confirmed {formatDate(student.confirmed_at)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="px-5 py-3 font-medium">Student</th>

                    <th className="px-5 py-3 font-medium">Student ID</th>

                    <th className="px-5 py-3 font-medium">Status</th>

                    <th className="px-5 py-3 font-medium">Confirmed at</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {student.name}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {student.email}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {student.student_id}
                      </td>

                      <td className="px-5 py-4">
                        {!student.confirmed ? (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            Pending
                          </span>
                        ) : student.is_late ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            Confirmed Late
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                            Confirmed
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {student.confirmed
                          ? formatDate(student.confirmed_at)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSubmissionTrackingPage;

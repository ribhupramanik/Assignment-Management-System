import { useCallback, useEffect, useState } from "react";

import api from "../api/api";

const formatDate = (value) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const statusLabel = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

const StudentProgressPage = () => {
  const [groups, setGroups] = useState([]);

  const [selectedGroupId, setSelectedGroupId] = useState(null);

  const [progress, setProgress] = useState(null);

  const [loadingGroups, setLoadingGroups] = useState(true);

  const [loadingProgress, setLoadingProgress] = useState(false);

  const [error, setError] = useState("");

  const loadGroups = useCallback(async () => {
    try {
      setLoadingGroups(true);
      setError("");

      const response = await api.get("/groups/mine");

      const fetchedGroups = response.data.groups;

      setGroups(fetchedGroups);

      setSelectedGroupId((currentId) => {
        const stillExists =
          currentId &&
          fetchedGroups.some((group) => String(group.id) === String(currentId));

        if (stillExists) {
          return currentId;
        }

        return fetchedGroups[0]?.id || null;
      });
    } catch (error) {
      setError(error.response?.data?.message || "Unable to load groups");
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  const loadProgress = useCallback(async (groupId) => {
    if (!groupId) {
      setProgress(null);
      return;
    }

    try {
      setLoadingProgress(true);
      setError("");

      const response = await api.get(`/groups/${groupId}/progress`);

      setProgress(response.data);
    } catch (error) {
      setProgress(null);

      setError(error.response?.data?.message || "Unable to load progress");
    } finally {
      setLoadingProgress(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (selectedGroupId) {
      loadProgress(selectedGroupId);
    }
  }, [selectedGroupId, loadProgress]);

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <p className="text-sm font-medium text-gray-500">Performance</p>

        <h2 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          Group Progress
        </h2>

        <p className="mt-2 text-gray-600">
          Track assignment completion for your groups.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loadingGroups ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Loading groups...
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="font-medium text-gray-900">No groups available</p>

          <p className="mt-1 text-sm text-gray-500">
            Create or join a group to track progress.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <label
              htmlFor="progress-group"
              className="block text-sm font-medium text-gray-700"
            >
              Select group
            </label>

            <select
              id="progress-group"
              value={selectedGroupId || ""}
              onChange={(event) => setSelectedGroupId(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900 sm:max-w-sm"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {loadingProgress ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
              Loading progress...
            </div>
          ) : progress ? (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Overall progress</p>

                    <h3 className="mt-1 text-xl font-bold text-gray-900">
                      {progress.group.name}
                    </h3>
                  </div>

                  <p className="text-3xl font-bold text-gray-900">
                    {progress.summary.overall_percentage}%
                  </p>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-gray-900 transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, progress.summary.overall_percentage),
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-500">Assignments</p>

                    <p className="mt-1 text-xl font-semibold text-gray-900">
                      {progress.summary.total_assignments}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Completed</p>

                    <p className="mt-1 text-xl font-semibold text-gray-900">
                      {progress.summary.completed_assignments}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Overall</p>

                    <p className="mt-1 text-xl font-semibold text-gray-900">
                      {progress.summary.overall_percentage}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {progress.assignments.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                    No assignments are currently assigned to this group.
                  </div>
                ) : (
                  progress.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h4 className="break-words font-semibold text-gray-900">
                            {assignment.title}
                          </h4>

                          <p className="mt-1 text-sm text-gray-500">
                            Due {formatDate(assignment.due_date)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            {statusLabel[assignment.status] ||
                              assignment.status}
                          </span>

                          {assignment.is_overdue && (
                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Confirmed</p>

                          <p className="mt-1 font-medium text-gray-900">
                            {assignment.confirmed_members} /{" "}
                            {assignment.total_members} members
                          </p>
                        </div>

                        <p className="text-lg font-bold text-gray-900">
                          {assignment.completion_percentage}%
                        </p>
                      </div>

                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-gray-900 transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, assignment.completion_percentage),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
};

export default StudentProgressPage;

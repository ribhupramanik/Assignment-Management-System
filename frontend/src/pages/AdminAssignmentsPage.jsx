import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/api";

const initialForm = {
  title: "",
  description: "",
  dueDate: "",
  onedriveLink: "",
  scope: "all",
  groupIds: [],
};

const formatDate = (value) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const AdminAssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);

  const [groups, setGroups] = useState([]);

  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [assignmentsResponse, groupsResponse] = await Promise.all([
        api.get("/admin/assignments"),
        api.get("/admin/groups"),
      ]);

      setAssignments(assignmentsResponse.data.assignments);

      setGroups(groupsResponse.data.groups);
    } catch (error) {
      setError(
        error.response?.data?.message || "Unable to load assignment data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleScopeChange = (event) => {
    const scope = event.target.value;

    setForm((current) => ({
      ...current,
      scope,
      groupIds: scope === "all" ? [] : current.groupIds,
    }));
  };

  const handleGroupToggle = (groupId) => {
    setForm((current) => {
      const alreadySelected = current.groupIds.some(
        (id) => String(id) === String(groupId),
      );

      return {
        ...current,

        groupIds: alreadySelected
          ? current.groupIds.filter((id) => String(id) !== String(groupId))
          : [...current.groupIds, Number(groupId)],
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Assignment title is required");
      return;
    }

    if (!form.dueDate) {
      setError("Due date is required");
      return;
    }

    if (!form.onedriveLink.trim()) {
      setError("OneDrive submission link is required");
      return;
    }

    if (form.scope === "groups" && form.groupIds.length === 0) {
      setError("Select at least one group");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        title: form.title.trim(),

        description: form.description.trim(),

        dueDate: new Date(form.dueDate).toISOString(),

        onedriveLink: form.onedriveLink.trim(),

        scope: form.scope,

        groupIds: form.scope === "groups" ? form.groupIds : [],
      };

      const response = await api.post("/admin/assignments", payload);

      setForm(initialForm);

      await loadData();

      setSuccess(`${response.data.assignment.title} created successfully`);
    } catch (error) {
      setError(error.response?.data?.message || "Unable to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <p className="text-sm font-medium text-gray-500">Coursework</p>

        <h2 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          Assignments
        </h2>

        <p className="mt-2 text-gray-600">
          Create assignments and assign them to all students or specific groups.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Create Assignment */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Create assignment
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Add assignment information and choose who should receive it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>

            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={200}
              required
              placeholder="e.g. Database Fundamentals"
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Assignment instructions..."
              className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-medium text-gray-700"
              >
                Due date
              </label>

              <input
                id="dueDate"
                name="dueDate"
                type="datetime-local"
                value={form.dueDate}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="scope"
                className="block text-sm font-medium text-gray-700"
              >
                Assign to
              </label>

              <select
                id="scope"
                name="scope"
                value={form.scope}
                onChange={handleScopeChange}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
              >
                <option value="all">All students</option>

                <option value="groups">Specific groups</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="onedriveLink"
              className="block text-sm font-medium text-gray-700"
            >
              OneDrive submission link
            </label>

            <input
              id="onedriveLink"
              name="onedriveLink"
              type="url"
              value={form.onedriveLink}
              onChange={handleChange}
              required
              placeholder="https://..."
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
            />
          </div>

          {form.scope === "groups" && (
            <div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Select groups
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Choose one or more groups for this assignment.
                </p>
              </div>

              {groups.length === 0 ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  No student groups are currently available.
                </div>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groups.map((group) => {
                    const selected = form.groupIds.some(
                      (id) => String(id) === String(group.id),
                    );

                    return (
                      <label
                        key={group.id}
                        className={[
                          "cursor-pointer rounded-lg border p-4 transition",
                          selected
                            ? "border-gray-900 bg-gray-50"
                            : "border-gray-200 hover:border-gray-400",
                        ].join(" ")}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => handleGroupToggle(group.id)}
                            className="mt-1"
                          />

                          <div className="min-w-0">
                            <p className="break-words text-sm font-medium text-gray-900">
                              {group.name}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {group.member_count}{" "}
                              {group.member_count === 1 ? "member" : "members"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Created by {group.created_by_name}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                submitting || (form.scope === "groups" && groups.length === 0)
              }
              className="w-full rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting ? "Creating..." : "Create assignment"}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Assignments */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h3 className="font-semibold text-gray-900">Existing assignments</h3>
        </div>

        {loading ? (
          <p className="p-5 text-sm text-gray-500">Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium text-gray-900">No assignments yet</p>

            <p className="mt-1 text-sm text-gray-500">
              Create your first assignment using the form above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="break-words font-semibold text-gray-900">
                        {assignment.title}
                      </h4>

                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        {assignment.scope === "all" ? "All students" : "Groups"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      Due {formatDate(assignment.due_date)}
                    </p>

                    {assignment.scope === "groups" &&
                      assignment.assigned_groups?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {assignment.assigned_groups.map((group) => (
                            <span
                              key={group.id}
                              className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600"
                            >
                              {group.name}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>

                  <div className="w-full sm:w-auto">
                    <p className="mb-2 text-sm text-gray-500 sm:text-right">
                      {assignment.scope === "all"
                        ? "All students"
                        : `${assignment.assigned_group_count} ${
                            assignment.assigned_group_count === 1
                              ? "group"
                              : "groups"
                          }`}
                    </p>

                    <div className="grid grid-cols-2 gap-2 sm:flex">
                      <Link
                        to={`/admin/assignments/${assignment.id}`}
                        className="whitespace-nowrap rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        View / Edit
                      </Link>

                      <Link
                        to={`/admin/assignments/${assignment.id}/submissions`}
                        className="whitespace-nowrap rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Submissions
                      </Link>
                    </div>
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

export default AdminAssignmentsPage;

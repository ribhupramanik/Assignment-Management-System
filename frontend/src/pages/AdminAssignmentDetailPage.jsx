import { useCallback, useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import api from "../api/api";

const toDateTimeLocal = (value) => {
  if (!value) return "";

  const date = new Date(value);

  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const formatDate = (value) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const AdminAssignmentDetailPage = () => {
  const { assignmentId } = useParams();

  const [assignment, setAssignment] = useState(null);

  const [groups, setGroups] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    onedriveLink: "",
    scope: "all",
    groupIds: [],
  });

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const loadAssignment = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [assignmentResponse, groupsResponse] = await Promise.all([
        api.get(`/admin/assignments/${assignmentId}`),

        api.get("/admin/groups"),
      ]);

      const fetchedAssignment = assignmentResponse.data.assignment;

      setAssignment(fetchedAssignment);

      setGroups(groupsResponse.data.groups);

      setForm({
        title: fetchedAssignment.title || "",

        description: fetchedAssignment.description || "",

        dueDate: toDateTimeLocal(fetchedAssignment.due_date),

        onedriveLink: fetchedAssignment.onedrive_link || "",

        scope: fetchedAssignment.scope,

        groupIds:
          fetchedAssignment.assigned_groups?.map((group) => Number(group.id)) ||
          [],
      });
    } catch (error) {
      setError(error.response?.data?.message || "Unable to load assignment");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadAssignment();
  }, [loadAssignment]);

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
      const exists = current.groupIds.some(
        (id) => String(id) === String(groupId),
      );

      return {
        ...current,

        groupIds: exists
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
      setSaving(true);

      const payload = {
        title: form.title.trim(),

        description: form.description.trim(),

        dueDate: new Date(form.dueDate).toISOString(),

        onedriveLink: form.onedriveLink.trim(),

        scope: form.scope,

        groupIds: form.scope === "groups" ? form.groupIds : [],
      };

      await api.patch(`/admin/assignments/${assignmentId}`, payload);

      await loadAssignment();

      setSuccess("Assignment updated successfully");
    } catch (error) {
      setError(error.response?.data?.message || "Unable to update assignment");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Loading assignment...
      </div>
    );
  }

  if (!assignment) {
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

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <Link
          to="/admin/assignments"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← All assignments
        </Link>

        <p className="mt-5 text-sm font-medium text-gray-500">
          Assignment Management
        </p>

        <h2 className="mt-1 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
          {assignment.title}
        </h2>

        <p className="mt-2 text-gray-600">
          View and update assignment details.
        </p>
        <div className="mt-4">
          <Link
            to={`/admin/assignments/${assignmentId}/submissions`}
            className="inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            View submissions
          </Link>
        </div>
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Scope</p>

          <p className="mt-2 font-semibold text-gray-900">
            {assignment.scope === "all" ? "All students" : "Specific groups"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Due date</p>

          <p className="mt-2 font-semibold text-gray-900">
            {formatDate(assignment.due_date)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Assigned groups</p>

          <p className="mt-2 font-semibold text-gray-900">
            {assignment.scope === "all"
              ? "All students"
              : assignment.assigned_groups?.length || 0}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Edit assignment
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Changes will immediately affect the students who can access this
            assignment.
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
              rows={5}
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
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
            />
          </div>

          {form.scope === "groups" && (
            <div>
              <p className="text-sm font-medium text-gray-700">
                Assigned groups
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Select one or more student groups.
              </p>

              {groups.length === 0 ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  No groups are available.
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
                saving || (form.scope === "groups" && groups.length === 0)
              }
              className="w-full rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAssignmentDetailPage;

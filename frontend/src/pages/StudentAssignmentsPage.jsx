import { useCallback, useEffect, useState } from "react";

import api from "../api/api";

const formatDate = (value) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const StudentAssignmentsPage = () => {
  const [assignments, setAssignments] = useState([]);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

  const [assignment, setAssignment] = useState(null);

  const [submissionStatus, setSubmissionStatus] = useState(null);

  const [loadingAssignments, setLoadingAssignments] = useState(true);

  const [loadingDetails, setLoadingDetails] = useState(false);

  const [confirming, setConfirming] = useState(false);

  const [showConfirmation, setShowConfirmation] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAssignments = useCallback(async () => {
    try {
      setLoadingAssignments(true);
      setError("");

      const response = await api.get("/assignments");

      const fetchedAssignments = response.data.assignments;

      setAssignments(fetchedAssignments);

      setSelectedAssignmentId((currentId) => {
        const stillExists =
          currentId &&
          fetchedAssignments.some(
            (item) => String(item.id) === String(currentId),
          );

        if (stillExists) {
          return currentId;
        }

        return fetchedAssignments[0]?.id || null;
      });
    } catch (error) {
      setError(error.response?.data?.message || "Unable to load assignments");
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  const loadAssignmentDetails = useCallback(async (assignmentId) => {
    if (!assignmentId) {
      setAssignment(null);
      setSubmissionStatus(null);
      return;
    }

    try {
      setLoadingDetails(true);
      setError("");

      const [assignmentResponse, submissionResponse] = await Promise.all([
        api.get(`/assignments/${assignmentId}`),

        api.get(`/assignments/${assignmentId}/submission`),
      ]);

      setAssignment(assignmentResponse.data.assignment);

      setSubmissionStatus(submissionResponse.data);
    } catch (error) {
      setAssignment(null);
      setSubmissionStatus(null);

      setError(
        error.response?.data?.message || "Unable to load assignment details",
      );
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    if (selectedAssignmentId) {
      setShowConfirmation(false);

      loadAssignmentDetails(selectedAssignmentId);
    }
  }, [selectedAssignmentId, loadAssignmentDetails]);

  const handleConfirmSubmission = async () => {
    try {
      setConfirming(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        `/assignments/${selectedAssignmentId}/submission/confirm`,
        {
          confirmed: true,
        },
      );

      setSubmissionStatus({
        success: true,
        confirmed: true,
        submission: response.data.submission,
      });

      setShowConfirmation(false);

      setSuccess("Submission confirmed successfully");
    } catch (error) {
      setError(error.response?.data?.message || "Unable to confirm submission");
    } finally {
      setConfirming(false);
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
          View your assignments, access submission links, and confirm completed
          submissions.
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

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
        {/* Assignment List */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h3 className="font-semibold text-gray-900">Your assignments</h3>
          </div>

          {loadingAssignments ? (
            <p className="p-5 text-sm text-gray-500">Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-medium text-gray-900">No assignments yet</p>

              <p className="mt-1 text-sm text-gray-500">
                Assignments posted by your professor will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {assignments.map((item) => {
                const selected =
                  String(item.id) === String(selectedAssignmentId);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setSelectedAssignmentId(item.id);
                    }}
                    className={[
                      "w-full px-5 py-4 text-left transition",
                      selected ? "bg-gray-50" : "hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="break-words font-medium text-gray-900">
                        {item.title}
                      </p>

                      {item.is_overdue && (
                        <span className="shrink-0 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                          Overdue
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      Due {formatDate(item.due_date)}
                    </p>

                    <div className="mt-2">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        {item.scope === "all"
                          ? "All students"
                          : "Group assignment"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Assignment Detail */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {!selectedAssignmentId ? (
            <div className="p-10 text-center text-gray-500">
              Select an assignment to view its details.
            </div>
          ) : loadingDetails ? (
            <p className="p-6 text-sm text-gray-500">Loading assignment...</p>
          ) : assignment ? (
            <>
              <div className="border-b border-gray-200 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500">
                      Assignment
                    </p>

                    <h3 className="mt-1 break-words text-xl font-bold text-gray-900 sm:text-2xl">
                      {assignment.title}
                    </h3>
                  </div>

                  {assignment.is_overdue ? (
                    <span className="w-fit shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                      Overdue
                    </span>
                  ) : (
                    <span className="w-fit shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      Active
                    </span>
                  )}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Due date
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(assignment.due_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Posted by
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {assignment.created_by_name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                <div>
                  <h4 className="font-semibold text-gray-900">Description</h4>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                    {assignment.description || "No description provided."}
                  </p>
                </div>

                {assignment.scope === "groups" &&
                  assignment.matched_groups?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Assigned through
                      </h4>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {assignment.matched_groups.map((group) => (
                          <span
                            key={group.id}
                            className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                          >
                            {group.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                <div>
                  <h4 className="font-semibold text-gray-900">Submission</h4>

                  <p className="mt-2 text-sm text-gray-600">
                    Upload your work using the professor's OneDrive link.
                  </p>

                  <a
                    href={assignment.onedrive_link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50 sm:w-auto"
                  >
                    Open OneDrive submission link
                  </a>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  {submissionStatus?.confirmed ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                      <p className="font-semibold text-green-800">
                        Submission confirmed
                      </p>

                      <p className="mt-1 text-sm text-green-700">
                        Confirmed on{" "}
                        {formatDate(submissionStatus.submission?.confirmed_at)}
                      </p>
                    </div>
                  ) : !showConfirmation ? (
                    <div>
                      <p className="text-sm text-gray-600">
                        Once you've uploaded your work to OneDrive, confirm your
                        submission below.
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setSuccess("");
                          setError("");
                          setShowConfirmation(true);
                        }}
                        className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 sm:w-auto"
                      >
                        Yes, I have submitted
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <h4 className="font-semibold text-amber-900">
                        Confirm submission?
                      </h4>

                      <p className="mt-1 text-sm text-amber-800">
                        Please confirm that you have uploaded your assignment
                        using the OneDrive link.
                      </p>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={handleConfirmSubmission}
                          disabled={confirming}
                          className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {confirming ? "Confirming..." : "Confirm submission"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowConfirmation(false)}
                          disabled={confirming}
                          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StudentAssignmentsPage;

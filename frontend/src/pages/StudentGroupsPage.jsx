import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import api from '../api/api'
import { useAuth } from '../context/AuthContext'

const StudentGroupsPage = () => {
  const { user } = useAuth()

  const [groups, setGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] =
    useState(null)

  const [members, setMembers] = useState([])

  const [groupName, setGroupName] = useState('')
  const [memberIdentifier, setMemberIdentifier] =
    useState('')

  const [loadingGroups, setLoadingGroups] =
    useState(true)

  const [loadingMembers, setLoadingMembers] =
    useState(false)

  const [creatingGroup, setCreatingGroup] =
    useState(false)

  const [addingMember, setAddingMember] =
    useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadGroups = useCallback(async () => {
    try {
      setLoadingGroups(true)

      const response = await api.get('/groups/mine')

      const fetchedGroups = response.data.groups

      setGroups(fetchedGroups)

      setSelectedGroupId((currentId) => {
        const currentStillExists =
          currentId &&
          fetchedGroups.some(
            (group) =>
              String(group.id) ===
              String(currentId)
          )

        if (currentStillExists) {
          return currentId
        }

        return fetchedGroups[0]?.id || null
      })
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Unable to load groups'
      )
    } finally {
      setLoadingGroups(false)
    }
  }, [])

  const loadMembers = useCallback(
    async (groupId) => {
      if (!groupId) {
        setMembers([])
        return
      }

      try {
        setLoadingMembers(true)

        const response = await api.get(
          `/groups/${groupId}/members`
        )

        setMembers(response.data.members)
      } catch (error) {
        setMembers([])

        setError(
          error.response?.data?.message ||
            'Unable to load group members'
        )
      } finally {
        setLoadingMembers(false)
      }
    },
    []
  )

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  useEffect(() => {
    if (selectedGroupId) {
      loadMembers(selectedGroupId)
    } else {
      setMembers([])
    }
  }, [
    selectedGroupId,
    loadMembers,
  ])

  const selectedGroup = groups.find(
    (group) =>
      String(group.id) ===
      String(selectedGroupId)
  )

  const isCreator =
    selectedGroup &&
    String(selectedGroup.created_by) ===
      String(user.id)

  const handleCreateGroup = async (event) => {
    event.preventDefault()

    const normalizedName = groupName.trim()

    if (!normalizedName) {
      setError('Group name is required')
      return
    }

    try {
      setError('')
      setSuccess('')
      setCreatingGroup(true)

      const response = await api.post(
        '/groups',
        {
          name: normalizedName,
        }
      )

      const createdGroup = response.data.group

      setGroupName('')

      await loadGroups()

      setSelectedGroupId(createdGroup.id)

      setSuccess(
        `${createdGroup.name} created successfully`
      )
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Unable to create group'
      )
    } finally {
      setCreatingGroup(false)
    }
  }

  const handleAddMember = async (event) => {
    event.preventDefault()

    const identifier =
      memberIdentifier.trim()

    if (!identifier) {
      setError(
        'Enter a student email or student ID'
      )
      return
    }

    try {
      setError('')
      setSuccess('')
      setAddingMember(true)

      const response = await api.post(
        `/groups/${selectedGroupId}/members`,
        {
          identifier,
        }
      )

      setMemberIdentifier('')

      await Promise.all([
        loadGroups(),
        loadMembers(selectedGroupId),
      ])

      setSuccess(
        `${response.data.member.name} added to the group`
      )
    } catch (error) {
      setError(
        error.response?.data?.message ||
          'Unable to add member'
      )
    } finally {
      setAddingMember(false)
    }
  }

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <p className="text-sm font-medium text-gray-500">
          Groups
        </p>

        <h2 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          My Groups
        </h2>

        <p className="mt-2 text-gray-600">
          Create groups and manage student members.
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

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="font-semibold text-gray-900">
          Create a group
        </h3>

        <form
          onSubmit={handleCreateGroup}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={groupName}
            onChange={(event) =>
              setGroupName(event.target.value)
            }
            placeholder="e.g. Team Alpha"
            maxLength={100}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
          />

          <button
            type="submit"
            disabled={creatingGroup}
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creatingGroup
              ? 'Creating...'
              : 'Create group'}
          </button>
        </form>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
        <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h3 className="font-semibold text-gray-900">
              Your groups
            </h3>
          </div>

          {loadingGroups ? (
            <p className="p-5 text-sm text-gray-500">
              Loading groups...
            </p>
          ) : groups.length === 0 ? (
            <div className="p-6 text-center">
              <p className="font-medium text-gray-900">
                No groups yet
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Create your first group using the
                form above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {groups.map((group) => {
                const selected =
                  String(group.id) ===
                  String(selectedGroupId)

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => {
                      setError('')
                      setSuccess('')
                      setSelectedGroupId(group.id)
                    }}
                    className={[
                      'w-full px-5 py-4 text-left transition',
                      selected
                        ? 'bg-gray-50'
                        : 'hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 break-words font-medium text-gray-900">
                        {group.name}
                      </p>

                      {selected && (
                        <span className="h-2 w-2 rounded-full bg-gray-900" />
                      )}
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {group.member_count}{' '}
                      {group.member_count === 1
                        ? 'member'
                        : 'members'}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {!selectedGroup ? (
            <div className="p-10 text-center text-gray-500">
              Select or create a group to view its
              members.
            </div>
          ) : (
            <>
              <div className="border-b border-gray-200 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="break-words text-lg font-semibold text-gray-900">
                      {selectedGroup.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {isCreator
                        ? 'You created this group'
                        : `Created by ${selectedGroup.created_by_name}`}
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {selectedGroup.member_count}{' '}
                    {selectedGroup.member_count === 1
                      ? 'member'
                      : 'members'}
                  </span>
                </div>
              </div>

              {isCreator && (
                <div className="border-b border-gray-200 p-5">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Add member
                  </h4>

                  <p className="mt-1 text-sm text-gray-500">
                    Search using a student email or
                    student ID.
                  </p>

                  <form
                    onSubmit={handleAddMember}
                    className="mt-4 flex flex-col gap-3 sm:flex-row"
                  >
                    <input
                      type="text"
                      value={memberIdentifier}
                      onChange={(event) =>
                        setMemberIdentifier(
                          event.target.value
                        )
                      }
                      placeholder="student@email.com or STU002"
                      className="min-w-0 w-full flex-1 rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-gray-900"
                    />

                    <button
                      type="submit"
                      disabled={addingMember}
                      className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {addingMember
                        ? 'Adding...'
                        : 'Add member'}
                    </button>
                  </form>
                </div>
              )}

              <div className="p-5">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900">
                    Members
                  </h4>
                </div>

                {loadingMembers ? (
                  <p className="text-sm text-gray-500">
                    Loading members...
                  </p>
                ) : members.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No members found.
                  </p>
                ) : (
                  <>
                  {/* Mobile member cards */}
                  <div className="space-y-3 sm:hidden">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words font-medium text-gray-900">
                              {member.name}
                            </p>

                            <p className="mt-1 break-all text-xs text-gray-500">
                              {member.email}
                            </p>

                            <p className="mt-2 text-sm text-gray-600">
                              {member.student_id}
                            </p>
                          </div>

                          {member.is_creator ? (
                            <span className="shrink-0 rounded-full bg-gray-900 px-2.5 py-1 text-xs font-medium text-white">
                              Creator
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                              Member
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop/tablet member table */}
                  <div className="hidden overflow-x-auto sm:block">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500">
                          <th className="pb-3 pr-4 font-medium">
                            Student
                          </th>

                          <th className="pb-3 pr-4 font-medium">
                            Student ID
                          </th>

                          <th className="pb-3 font-medium">
                            Role
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {members.map((member) => (
                          <tr key={member.id}>
                            <td className="py-4 pr-4">
                              <p className="font-medium text-gray-900">
                                {member.name}
                              </p>

                              <p className="mt-0.5 text-xs text-gray-500">
                                {member.email}
                              </p>
                            </td>

                            <td className="py-4 pr-4 text-gray-600">
                              {member.student_id}
                            </td>

                            <td className="py-4">
                              {member.is_creator ? (
                                <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-medium text-white">
                                  Creator
                                </span>
                              ) : (
                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                  Member
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentGroupsPage
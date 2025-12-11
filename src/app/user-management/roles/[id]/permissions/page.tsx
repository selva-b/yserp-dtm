'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { getApiUrl } from '@/lib/config'
import AppLayout from '@/components/layout/AppLayout'
import { PermissionTreeNode, RoleDetail } from '@/types/user'

interface PermissionState {
  [key: string]: boolean
}

export default function RolePermissionsPage() {
  const router = useRouter()
  const params = useParams()
  const roleId = params.id as string

  const [role, setRole] = useState<RoleDetail | null>(null)
  const [permissionsTree, setPermissionsTree] = useState<PermissionTreeNode[]>([])
  const [permissionStates, setPermissionStates] = useState<PermissionState>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchRoleAndPermissions()
  }, [roleId])

  const fetchRoleAndPermissions = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Fetch role details and permissions tree in parallel
      const [roleResponse, treeResponse] = await Promise.all([
        apiClient(getApiUrl(`v1/roles/${roleId}`), { method: 'GET' }),
        apiClient(getApiUrl('v1/permissions/tree'), { method: 'GET' }),
      ])

      if (!roleResponse.ok || !treeResponse.ok) {
        throw new Error('Failed to fetch role or permissions')
      }

      const roleData: RoleDetail = await roleResponse.json()
      const treeData: PermissionTreeNode[] = await treeResponse.json()

      setRole(roleData)
      setPermissionsTree(treeData)

      // Initialize permission states from role permissions
      const initialStates: PermissionState = {}
      roleData.permissions.forEach((perm) => {
        initialStates[perm.key] = perm.granted
      })
      setPermissionStates(initialStates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  // Get all leaf permission keys from tree node
  const getLeafKeys = (node: PermissionTreeNode): string[] => {
    if (!node.children || node.children.length === 0) {
      return [node.key]
    }
    return node.children.flatMap((child) => getLeafKeys(child))
  }

  // Check if all children are checked
  const areAllChildrenChecked = (node: PermissionTreeNode): boolean => {
    const leafKeys = getLeafKeys(node)
    return leafKeys.every((key) => permissionStates[key])
  }

  // Check if some children are checked
  const areSomeChildrenChecked = (node: PermissionTreeNode): boolean => {
    const leafKeys = getLeafKeys(node)
    return leafKeys.some((key) => permissionStates[key])
  }

  // Toggle permission
  const togglePermission = (node: PermissionTreeNode) => {
    if (role?.locked) return

    const newStates = { ...permissionStates }

    if (node.children && node.children.length > 0) {
      // Parent node - toggle all children
      const allChecked = areAllChildrenChecked(node)
      const leafKeys = getLeafKeys(node)

      leafKeys.forEach((key) => {
        newStates[key] = !allChecked
      })
    } else {
      // Leaf node - toggle single permission
      newStates[node.key] = !permissionStates[node.key]
    }

    setPermissionStates(newStates)
  }

  // Save permissions
  const handleSave = async () => {
    if (!role) return

    setIsSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      // Convert permission states to API payload
      const permissions = Object.entries(permissionStates).map(([key, granted]) => {
        const permission = role.permissions.find((p) => p.key === key)
        if (!permission) {
          console.warn(`Permission key ${key} not found in role permissions`)
          return null
        }
        return {
          permissionId: permission.permissionId,
          granted,
        }
      }).filter(Boolean) as { permissionId: string; granted: boolean }[]

      const response = await apiClient(
        getApiUrl(`v1/roles/${roleId}/permissions`),
        {
          method: 'PUT',
          body: JSON.stringify({ permissions }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update permissions')
      }

      setSuccessMessage('Permissions updated successfully.')

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)

      // Refresh role data
      await fetchRoleAndPermissions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions')
    } finally {
      setIsSaving(false)
    }
  }

  // Render tree node recursively
  const renderTreeNode = (node: PermissionTreeNode, level: number = 0): JSX.Element => {
    const isParent = node.children && node.children.length > 0
    const isChecked = isParent
      ? areAllChildrenChecked(node)
      : permissionStates[node.key] || false
    const isIndeterminate =
      isParent && !isChecked && areSomeChildrenChecked(node)

    return (
      <div key={node.key} className="space-y-2">
        <div
          className={`flex items-start ${level > 0 ? 'ml-6' : ''}`}
          style={{ paddingLeft: level > 0 ? `${level * 1}rem` : undefined }}
        >
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              checked={isChecked}
              ref={(input) => {
                if (input) {
                  input.indeterminate = isIndeterminate || false
                }
              }}
              onChange={() => togglePermission(node)}
              disabled={role?.locked}
              className={`h-4 w-4 rounded border-gray-300 ${
                role?.locked
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-primary-600 focus:ring-primary-500 cursor-pointer'
              }`}
              id={`perm-${node.key}`}
            />
          </div>
          <div className="ml-3">
            <label
              htmlFor={`perm-${node.key}`}
              className={`text-sm ${
                isParent ? 'font-medium text-gray-900' : 'font-normal text-gray-700'
              } ${role?.locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {node.label}
            </label>
            {node.description && !isParent && (
              <p className="text-xs text-gray-500 mt-0.5">{node.description}</p>
            )}
          </div>
        </div>

        {/* Render children */}
        {isParent && (
          <div className="space-y-2">
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-primary-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading permissions...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !role) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="py-6 px-6">
            <h1 className="text-3xl font-bold text-gray-900">Manage Permissions</h1>
          </div>
        </header>
        <main className="px-6 py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="rounded-md bg-red-50 p-4" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  <div className="mt-2">
                    <button
                      onClick={() => router.push('/user-management/roles')}
                      className="text-sm font-medium text-red-800 underline hover:text-red-900"
                    >
                      Go back to roles
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="py-6 px-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Manage Permissions: {role?.name}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Configure what actions this role can perform
              </p>
            </div>
            <button
              onClick={() => router.push('/user-management/roles')}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              Back to Roles
            </button>
          </div>
        </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Locked Role Warning */}
          {role?.locked && (
            <div className="rounded-md bg-yellow-50 p-4 mb-6" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    This is a locked system role
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Permissions for this role cannot be modified to ensure system integrity.
                    You can view the permissions below but cannot make changes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="rounded-md bg-green-50 p-4 mb-6" role="alert" aria-live="polite">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">{successMessage}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && role && (
            <div className="rounded-md bg-red-50 p-4 mb-6" role="alert" aria-live="polite">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Permissions Tree */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900">Permissions</h2>
              <p className="mt-1 text-sm text-gray-500">
                Select the permissions this role should have. Parent items will check/uncheck
                all children.
              </p>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {permissionsTree.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No permissions available
                </div>
              ) : (
                permissionsTree.map((node) => renderTreeNode(node))
              )}
            </div>

            {/* Save Button */}
            {!role?.locked && (
              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isSaving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Permissions'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
    </AppLayout>
  )
}

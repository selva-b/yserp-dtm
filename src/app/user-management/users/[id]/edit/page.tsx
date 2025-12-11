'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiClient } from '@/lib/api-client'
import { getApiUrl } from '@/lib/config'
import AppLayout from '@/components/layout/AppLayout'
import { UpdateUserDto, Role, User, UserStatus } from '@/types/user'

// Validation schema for edit
const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Enter first name.')
    .min(2, 'First name must be at least 2 characters.')
    .max(80, 'First name must not exceed 80 characters.')
    .regex(/^[a-zA-Z\s\-_.]+$/, 'Only letters, spaces, -, _, . allowed.'),
  lastName: z
    .string()
    .min(1, 'Enter last name.')
    .min(2, 'Last name must be at least 2 characters.')
    .max(80, 'Last name must not exceed 80 characters.')
    .regex(/^[a-zA-Z\s\-_.]+$/, 'Only letters, spaces, -, _, . allowed.'),
  email: z
    .string()
    .min(1, 'Enter email address.')
    .email('Enter a valid email.')
    .max(255, 'Email must not exceed 255 characters.'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim().length === 0 || /^[\d\s\-+().]+$/.test(val),
      'Enter a valid phone number.'
    ),
  department: z
    .string()
    .min(1, 'Enter department.')
    .min(2, 'Department must be at least 2 characters.')
    .max(80, 'Department must not exceed 80 characters.')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Only letters, numbers, spaces, -, _, . allowed.'),
  roleId: z.string().min(1, 'Select a role.'),
  address: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim().length === 0 || val.trim().length >= 2,
      'Address must be at least 2 characters.'
    ),
  bio: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim().length === 0 || val.trim().length <= 500,
      'Bio must not exceed 500 characters.'
    ),
  status: z.nativeEnum(UserStatus),
  isActive: z.boolean(),
})

type UpdateUserFormData = z.infer<typeof updateUserSchema>

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // User data state
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userError, setUserError] = useState('')

  // Roles state
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)
  const [rolesError, setRolesError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  })

  // Fetch user and roles on mount
  useEffect(() => {
    fetchUser()
    fetchRoles()
  }, [userId])

  const fetchUser = async () => {
    setIsLoadingUser(true)
    setUserError('')

    try {
      const response = await apiClient(getApiUrl(`v1/users/${userId}`), {
        method: 'GET',
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found')
        }
        throw new Error('Failed to fetch user')
      }

      const data: User = await response.json()
      setUser(data)

      // Pre-fill form with user data
      reset({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || '',
        department: data.department,
        roleId: data.roleId,
        address: data.address || '',
        bio: data.bio || '',
        status: data.status,
        isActive: data.isActive,
      })
    } catch (err) {
      setUserError(err instanceof Error ? err.message : 'Failed to load user')
    } finally {
      setIsLoadingUser(false)
    }
  }

  const fetchRoles = async () => {
    setIsLoadingRoles(true)
    setRolesError('')

    try {
      const response = await apiClient(getApiUrl('v1/roles'), {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch roles')
      }

      const data: Role[] = await response.json()
      setRoles(data)
    } catch (err) {
      setRolesError('Failed to load roles')
    } finally {
      setIsLoadingRoles(false)
    }
  }

  const onSubmit = async (data: UpdateUserFormData) => {
    setGlobalError('')
    setSuccessMessage('')
    setIsSubmitting(true)

    // Prepare data for API (only include changed fields)
    const payload: UpdateUserDto = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || undefined,
      department: data.department.trim(),
      roleId: data.roleId,
      address: data.address?.trim() || undefined,
      bio: data.bio?.trim() || undefined,
      isActive: data.isActive,
    }

    try {
      const response = await apiClient(getApiUrl(`v1/users/${userId}`), {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Handle field errors
        if (responseData.fieldErrors && typeof responseData.fieldErrors === 'object') {
          Object.entries(responseData.fieldErrors).forEach(([field, message]) => {
            setError(field as keyof UpdateUserFormData, {
              type: 'server',
              message: message as string,
            })
          })
          // Focus first invalid field
          const firstErrorField = Object.keys(responseData.fieldErrors)[0]
          document.getElementById(firstErrorField)?.focus()
        } else {
          setGlobalError(responseData.message || 'Failed to update user.')
        }
        return
      }

      // Success
      setSuccessMessage('User updated successfully.')

      // Redirect to user detail page after 2 seconds
      setTimeout(() => {
        router.push(`/user-management/users/${userId}`)
      }, 2000)
    } catch (error) {
      setGlobalError('Unable to connect. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoadingUser) {
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
          <p className="mt-4 text-gray-600">Loading user...</p>
        </div>
      </div>
    )
  }

  // User not found error
  if (userError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="py-6 px-6">
            <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          </div>
        </header>
        <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
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
                  <h3 className="text-sm font-medium text-red-800">{userError}</h3>
                  <div className="mt-2">
                    <button
                      onClick={() => router.push('/user-management/users')}
                      className="text-sm font-medium text-red-800 underline hover:text-red-900"
                    >
                      Go back to users list
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
              <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
              <p className="mt-1 text-sm text-gray-600">
                Update user information for {user?.fullName}
              </p>
            </div>
            <button
              onClick={() => router.push(`/user-management/users/${userId}`)}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              Back to User Details
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Global Error */}
            {globalError && (
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
                    <h3 className="text-sm font-medium text-red-800">{globalError}</h3>
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
                    <p className="mt-1 text-sm text-green-700">
                      Redirecting to user details...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Roles Loading Error */}
            {rolesError && (
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
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">{rolesError}</h3>
                    <div className="mt-2">
                      <button
                        onClick={fetchRoles}
                        className="text-sm font-medium text-yellow-800 underline hover:text-yellow-900"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="bg-white shadow rounded-lg">
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-6">
                {/* Personal Information Section */}
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* First Name */}
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        {...register('firstName')}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                        placeholder="John"
                        aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                        aria-invalid={!!errors.firstName}
                      />
                      {errors.firstName && (
                        <p
                          className="mt-1 text-sm text-red-600"
                          id="firstName-error"
                          role="alert"
                        >
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        {...register('lastName')}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                        placeholder="Doe"
                        aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                        aria-invalid={!!errors.lastName}
                      />
                      {errors.lastName && (
                        <p
                          className="mt-1 text-sm text-red-600"
                          id="lastName-error"
                          role="alert"
                        >
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        {...register('email')}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                        placeholder="john.doe@company.com"
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        aria-invalid={!!errors.email}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600" id="email-error" role="alert">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        {...register('phone')}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                        placeholder="+1 (555) 123-4567"
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                        aria-invalid={!!errors.phone}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600" id="phone-error" role="alert">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Work Information Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Work Information
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Department */}
                    <div>
                      <label
                        htmlFor="department"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Department <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="department"
                        type="text"
                        {...register('department')}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.department ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                        placeholder="Engineering"
                        aria-describedby={errors.department ? 'department-error' : undefined}
                        aria-invalid={!!errors.department}
                      />
                      {errors.department && (
                        <p
                          className="mt-1 text-sm text-red-600"
                          id="department-error"
                          role="alert"
                        >
                          {errors.department.message}
                        </p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <label htmlFor="roleId" className="block text-sm font-medium text-gray-700">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="roleId"
                        {...register('roleId')}
                        disabled={isLoadingRoles}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.roleId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${isLoadingRoles ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                        aria-describedby={errors.roleId ? 'roleId-error' : undefined}
                        aria-invalid={!!errors.roleId}
                      >
                        <option value="">
                          {isLoadingRoles ? 'Loading roles...' : 'Select a role'}
                        </option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      {errors.roleId && (
                        <p className="mt-1 text-sm text-red-600" id="roleId-error" role="alert">
                          {errors.roleId.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Information Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Additional Information
                  </h3>
                  <div className="space-y-6">
                    {/* Address */}
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <textarea
                        id="address"
                        rows={3}
                        {...register('address')}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                        placeholder="123 Main St, City, State, ZIP"
                        aria-describedby={errors.address ? 'address-error' : undefined}
                        aria-invalid={!!errors.address}
                      />
                      {errors.address && (
                        <p className="mt-1 text-sm text-red-600" id="address-error" role="alert">
                          {errors.address.message}
                        </p>
                      )}
                    </div>

                    {/* Bio */}
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        rows={4}
                        {...register('bio')}
                        className={`mt-1 block w-full px-3 py-2 border ${errors.bio ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                        placeholder="Brief description about the user..."
                        aria-describedby={errors.bio ? 'bio-error' : undefined}
                        aria-invalid={!!errors.bio}
                      />
                      {errors.bio && (
                        <p className="mt-1 text-sm text-red-600" id="bio-error" role="alert">
                          {errors.bio.message}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-gray-500">Maximum 500 characters</p>
                    </div>
                  </div>
                </div>

                {/* Account Status Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Account Status
                  </h3>
                  <div className="space-y-6">
                    {/* Status Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        User Status
                      </label>

                      <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
    bg-gray-100 text-gray-700 sm:text-sm cursor-not-allowed">
                        {user?.status || 'N/A'}
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        Status reflects the user's account state: Pending (awaiting setup), Invited (invitation sent), Active (verified and enabled), Inactive (disabled).
                      </p>
                    </div>



                    {/* Active Checkbox */}
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="isActive"
                          type="checkbox"
                          {...register('isActive')}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="isActive" className="font-medium text-gray-700">
                          Account Enabled
                        </label>
                        <p className="text-sm text-gray-500">
                          When disabled, user will not be able to sign in. All their sessions will be
                          terminated.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="border-t border-gray-200 pt-6 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => router.push(`/user-management/users/${userId}`)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isLoadingRoles}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSubmitting || isLoadingRoles
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                      }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
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
                        Updating...
                      </>
                    ) : (
                      'Update User'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import {
  useEndUsers,
  useContractors,
  useConsultants,
  useUsers,
  useMainSystems,
  useSubSystems,
  useBidsList,
} from '@/hooks/useProjectsForm'
import { useCreateProject } from '@/hooks/useProjects'
import { refreshCsrfToken } from '@/lib/api-client'

export default function CreateProjectPage() {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const createProjectMutation = useCreateProject()

  const [formData, setFormData] = useState<{
    projectName: string
    endUser: string
    mainContractor: string
    consultant: string
    clientType: string
    industry: string
    cityTown: string
    state: string
    country: string
    projectStartDate: string
    projectClosingDate: string
    referenceBid: string
    projectManager: string
    draftingManager: string
    status: 'open' | 'in_progress' | 'completed' | 'cancelled'
    systems: string[]
    subSystems: string[]
  }>({
    projectName: '',
    endUser: '',
    mainContractor: '',
    consultant: '',
    clientType: '',
    industry: '',
    cityTown: '',
    state: '',
    country: '',
    projectStartDate: '',
    projectClosingDate: '',
    referenceBid: '',
    projectManager: '',
    draftingManager: '',
    status: 'open',
    systems: [],
    subSystems: [],
  })

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Dropdown filter state
  const [filterDropdown, setFilterDropdown] = useState('all') // 'all' or system.id

  // Fetch data from APIs
  const { data: endUsers = [], isLoading: loadingEndUsers } = useEndUsers()
  const { data: contractors = [], isLoading: loadingContractors } = useContractors()
  const { data: consultants = [], isLoading: loadingConsultants } = useConsultants()
  const { data: users = [], isLoading: loadingUsers } = useUsers()
  const { data: bids = [], isLoading: loadingBids } = useBidsList()
  const { data: mainSystems = [], isLoading: loadingSystems } = useMainSystems()

  // Load ALL subsystems for ALL main systems (not just selected ones)
  const allMainSystemIds = mainSystems.map((system: any) => system.id)
  const { data: subSystems = [], isLoading: loadingSubSystems } = useSubSystems(allMainSystemIds)

  // Industries list (static for now)
  const industries = [
    'Commercial',
    'Residential',
    'Industrial',
    'Infrastructure',
    'Energy',
    'Healthcare',
    'Education',
    'Transportation',
    'Manufacturing',
  ]

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubSystemChange = (subSystemId: string, mainSystemId: string) => {
    setFormData((prev) => {
      const isCurrentlySelected = prev.subSystems.includes(subSystemId)

      if (isCurrentlySelected) {
        // Deselect subsystem
        const updatedSubSystems = prev.subSystems.filter((id) => id !== subSystemId)

        // Check if there are any other subsystems from the same main system still selected
        const hasOtherSubSystemsFromSameMainSystem = subSystems
          .filter((sub: any) => sub.mainSystemId === mainSystemId)
          .some((sub: any) => updatedSubSystems.includes(sub.id))

        // If no subsystems from this main system are selected, deselect the main system too
        const updatedSystems = hasOtherSubSystemsFromSameMainSystem
          ? prev.systems
          : prev.systems.filter(id => id !== mainSystemId)

        return {
          ...prev,
          systems: updatedSystems,
          subSystems: updatedSubSystems
        }
      } else {
        // Select subsystem and ensure parent main system is also selected
        const mainSystemAlreadySelected = prev.systems.includes(mainSystemId)
        return {
          ...prev,
          systems: mainSystemAlreadySelected ? prev.systems : [...prev.systems, mainSystemId],
          subSystems: [...prev.subSystems, subSystemId]
        }
      }
    })
  }

  // Get selected systems count
  const selectedSystemsCount = formData.systems.length
  const selectedSubSystemsCount = formData.subSystems.length

  // Get system icon/color based on system name
  const getSystemIcon = (systemName: string) => {
    const name = systemName.toLowerCase()
    if (name.includes('hvac')) return { icon: '❄️', color: 'bg-cyan-100', badge: 'HVAC' }
    if (name.includes('electrical') || name.includes('electric')) return { icon: '⚡', color: 'bg-yellow-100', badge: 'ELEC' }
    if (name.includes('plumb')) return { icon: '💧', color: 'bg-blue-100', badge: 'PLMB' }
    if (name.includes('fire')) return { icon: '🔥', color: 'bg-red-100', badge: 'FIRE' }
    if (name.includes('security')) return { icon: '🔒', color: 'bg-purple-100', badge: 'SECU' }
    return { icon: '📋', color: 'bg-gray-100', badge: 'SYS' }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Enter a project name.'
    }

    if (!formData.endUser) {
      newErrors.endUser = 'Select an end user.'
    }

    if (!formData.industry) {
      newErrors.industry = 'Select an industry.'
    }

    if (!formData.cityTown.trim()) {
      newErrors.cityTown = 'Enter a city/town.'
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Enter a country.'
    }

    if (!formData.projectStartDate) {
      newErrors.projectStartDate = 'Select a start date.'
    }

    if (!formData.projectManager) {
      newErrors.projectManager = 'Select a project manager.'
    }

    if (!formData.draftingManager) {
      newErrors.draftingManager = 'Select a drafting manager.'
    }

    if (formData.systems.length === 0) {
      newErrors.systems = 'Select at least one system.'
    }

    // Validate client type dependencies
    if (formData.clientType === 'contractor' && !formData.mainContractor) {
      newErrors.mainContractor = 'Select a main contractor when client type is Main Contractor.'
    }

    if (formData.clientType === 'consultant' && !formData.consultant) {
      newErrors.consultant = 'Select a consultant when client type is Consultant.'
    }

    // Validate date constraint: closing date >= start date
    if (formData.projectStartDate && formData.projectClosingDate) {
      const startDate = new Date(formData.projectStartDate)
      const closingDate = new Date(formData.projectClosingDate)
      if (closingDate < startDate) {
        newErrors.projectClosingDate = 'Closing date must be on or after start date.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      // Focus first error field
      const firstErrorField = Object.keys(errors)[0]
      document.getElementsByName(firstErrorField)[0]?.focus()
      return
    }

    try {
      // Refresh CSRF token before submitting
      await refreshCsrfToken()
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error)
      setErrors({
        submit: 'Failed to initialize security token. Please refresh the page and try again.',
      })
      return
    }

    try {
      // Determine clientOrgId based on clientType
      let clientOrgId = undefined
      if (formData.clientType === 'end_user') {
        clientOrgId = formData.endUser
      } else if (formData.clientType === 'contractor') {
        clientOrgId = formData.mainContractor
      } else if (formData.clientType === 'consultant') {
        clientOrgId = formData.consultant
      }

      const result = await createProjectMutation.mutateAsync({
        projectName: formData.projectName,
        endUserId: formData.endUser || undefined,
        mainContractorId: formData.mainContractor || undefined,
        consultantId: formData.consultant || undefined,
        clientType: formData.clientType || undefined,
        clientOrgId: clientOrgId || undefined,
        industry: formData.industry || undefined,
        cityTown: formData.cityTown || undefined,
        state: formData.state || undefined,
        country: formData.country || undefined,
        projectStartDate: formData.projectStartDate || undefined,
        projectClosingDate: formData.projectClosingDate || undefined,
        referenceBidId: formData.referenceBid || undefined,
        projectManagerId: formData.projectManager || undefined,
        draftingManagerId: formData.draftingManager || undefined,
        status: formData.status || undefined,
        mainSystemIds: formData.systems,
        subSystemIds: formData.subSystems.length > 0 ? formData.subSystems : undefined,
      })

      // Navigate to project details page
      router.push(`/projects/${result.id}`)
    } catch (error: any) {
      console.error('Error creating project:', error)
      setErrors({
        submit: error?.message || 'Failed to create project. Please try again.',
      })
    }
  }

  const isLoading =
    loadingEndUsers ||
    loadingContractors ||
    loadingConsultants ||
    loadingUsers ||
    loadingBids ||
    loadingSystems ||
    loadingSubSystems

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
                <p className="mt-2 text-sm text-gray-700">
                  Fill in the details below to create a new project
                </p>
              </div>
              <Link
                href="/projects"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 gap-6">
                {/* Project Name */}
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.projectName
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    placeholder="e.g., Downtown Office Complex HVAC Project"
                  />
                  {errors.projectName && (
                    <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Reference Bid */}
                <div>
                  <label htmlFor="referenceBid" className="block text-sm font-medium text-gray-700">
                    Reference Bid (Optional)
                  </label>
                  <select
                    id="referenceBid"
                    name="referenceBid"
                    value={formData.referenceBid}
                    onChange={handleChange}
                    disabled={loadingBids}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select a bid (if applicable)</option>
                    {bids.map((bid: any) => (
                      <option key={bid.id} value={bid.id}>
                        {bid.bidNumber} - {bid.bidName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Organizations */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Organizations</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* End User */}
                <div>
                  <label htmlFor="endUser" className="block text-sm font-medium text-gray-700">
                    End User <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="endUser"
                    name="endUser"
                    value={formData.endUser}
                    onChange={handleChange}
                    disabled={loadingEndUsers}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.endUser
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select End User</option>
                    {endUsers.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.companyName}
                      </option>
                    ))}
                  </select>
                  {errors.endUser && <p className="mt-1 text-sm text-red-600">{errors.endUser}</p>}
                </div>

                {/* Main Contractor */}
                <div>
                  <label
                    htmlFor="mainContractor"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Main Contractor
                  </label>
                  <select
                    id="mainContractor"
                    name="mainContractor"
                    value={formData.mainContractor}
                    onChange={handleChange}
                    disabled={loadingContractors}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.mainContractor
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select Contractor</option>
                    {contractors.map((contractor: any) => (
                      <option key={contractor.id} value={contractor.id}>
                        {contractor.companyName}
                      </option>
                    ))}
                  </select>
                  {errors.mainContractor && (
                    <p className="mt-1 text-sm text-red-600">{errors.mainContractor}</p>
                  )}
                </div>

                {/* Consultant */}
                <div>
                  <label htmlFor="consultant" className="block text-sm font-medium text-gray-700">
                    Consultant
                  </label>
                  <select
                    id="consultant"
                    name="consultant"
                    value={formData.consultant}
                    onChange={handleChange}
                    disabled={loadingConsultants}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.consultant
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select Consultant</option>
                    {consultants.map((consultant: any) => (
                      <option key={consultant.id} value={consultant.id}>
                        {consultant.companyName}
                      </option>
                    ))}
                  </select>
                  {errors.consultant && (
                    <p className="mt-1 text-sm text-red-600">{errors.consultant}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Client Type */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Client Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="clientType" className="block text-sm font-medium text-gray-700">
                    Who is the Client?
                  </label>
                  <select
                    id="clientType"
                    name="clientType"
                    value={formData.clientType}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select Client Type</option>
                    <option value="end_user">End User</option>
                    <option value="contractor">Main Contractor</option>
                    <option value="consultant">Consultant</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Select which organization above is the actual client
                  </p>
                </div>
              </div>
            </div>

            {/* Location & Industry */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Location & Industry</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Industry */}
                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.industry
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select Industry</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                  {errors.industry && <p className="mt-1 text-sm text-red-600">{errors.industry}</p>}
                </div>

                {/* City/Town */}
                <div>
                  <label htmlFor="cityTown" className="block text-sm font-medium text-gray-700">
                    City/Town <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="cityTown"
                    name="cityTown"
                    value={formData.cityTown}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.cityTown
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    placeholder="e.g., New York"
                  />
                  {errors.cityTown && <p className="mt-1 text-sm text-red-600">{errors.cityTown}</p>}
                </div>

                {/* State */}
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g., NY"
                  />
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.country
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    placeholder="e.g., United States"
                  />
                  {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
                </div>
              </div>
            </div>

            {/* Project Dates */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Project Timeline</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date */}
                <div>
                  <label
                    htmlFor="projectStartDate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Project Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="projectStartDate"
                    name="projectStartDate"
                    value={formData.projectStartDate}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.projectStartDate
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  />
                  {errors.projectStartDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.projectStartDate}</p>
                  )}
                </div>

                {/* Closing Date */}
                <div>
                  <label
                    htmlFor="projectClosingDate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Project Closing Date
                  </label>
                  <input
                    type="date"
                    id="projectClosingDate"
                    name="projectClosingDate"
                    value={formData.projectClosingDate}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.projectClosingDate
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  />
                  {errors.projectClosingDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.projectClosingDate}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Must be on or after the project start date
                  </p>
                </div>
              </div>
            </div>

            {/* Management */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Manager */}
                <div>
                  <label
                    htmlFor="projectManager"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Project Manager <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="projectManager"
                    name="projectManager"
                    value={formData.projectManager}
                    onChange={handleChange}
                    disabled={loadingUsers}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.projectManager
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select Project Manager</option>
                    {users
                      .filter((user: any) => user.role.name === 'Project Manager')
                      .map((user: any) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName}
                        </option>
                      ))}
                  </select>
                  {errors.projectManager && (
                    <p className="mt-1 text-sm text-red-600">{errors.projectManager}</p>
                  )}
                </div>

                {/* Drafting Manager */}
                <div>
                  <label
                    htmlFor="draftingManager"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Drafting Manager <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="draftingManager"
                    name="draftingManager"
                    value={formData.draftingManager}
                    onChange={handleChange}
                    disabled={loadingUsers}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors.draftingManager
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select Drafting Manager</option>
                    {users
                      .filter((user: any) => user.role.name === 'Drafting Manager')
                      .map((user: any) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName}
                        </option>
                      ))}
                  </select>
                  {errors.draftingManager && (
                    <p className="mt-1 text-sm text-red-600">{errors.draftingManager}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Systems & Subsystems Selection */}
            <div className="bg-white shadow rounded-lg p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Systems & Subsystems Selection
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded">
                    {selectedSystemsCount} main system(s) selected
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded">
                    {selectedSubSystemsCount} sub system(s) selected
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Choose the systems and subsystems that will be included in this project
              </p>

              {loadingSystems ? (
                <div className="text-sm text-gray-500">Loading systems...</div>
              ) : mainSystems.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No systems available. Please configure systems in Settings.
                </div>
              ) : (
                <>
                  {/* Search and Filter Bar */}
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search systems and subsystems..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={filterDropdown}
                      onChange={(e) => setFilterDropdown(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="all">All Systems</option>
                      {mainSystems.map((system: any) => (
                        <option key={system.id} value={system.id}>
                          {system.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subsystems Grouped by Main System */}
                  <div className="mt-4">
                    {loadingSubSystems ? (
                      <div className="text-sm text-gray-500">Loading subsystems...</div>
                    ) : (
                      <div className="space-y-4">
                        {mainSystems
                          .filter((system: any) => {
                            // Filter based on dropdown selection
                            if (filterDropdown !== 'all' && system.id !== filterDropdown) {
                              return false
                            }
                            // Filter based on search query - search in system name or subsystem names
                            if (searchQuery.trim()) {
                              const searchLower = searchQuery.toLowerCase()
                              const systemSubSystems = subSystems.filter((sub: any) => sub.mainSystemId === system.id)

                              // Check if system name matches
                              if (system.name.toLowerCase().includes(searchLower)) {
                                return true
                              }

                              // Check if any subsystem name or code matches
                              return systemSubSystems.some((sub: any) =>
                                sub.name.toLowerCase().includes(searchLower) ||
                                sub.code.toLowerCase().includes(searchLower)
                              )
                            }
                            // Show all systems by default
                            return true
                          })
                          .map((system: any) => {
                            const systemIcon = getSystemIcon(system.name)
                            const systemSubSystems = subSystems.filter((sub: any) => sub.mainSystemId === system.id)

                            // If system name matches search, show ALL subsystems; otherwise filter subsystems
                            const filteredSystemSubSystems = systemSubSystems.filter((sub: any) => {
                              if (searchQuery.trim()) {
                                const searchLower = searchQuery.toLowerCase()
                                // If main system name matches, show all subsystems
                                if (system.name.toLowerCase().includes(searchLower)) {
                                  return true
                                }
                                // Otherwise, only show subsystems that match the search
                                return sub.name.toLowerCase().includes(searchLower) ||
                                       sub.code.toLowerCase().includes(searchLower)
                              }
                              return true
                            })
                            const selectedCount = filteredSystemSubSystems.filter((sub: any) =>
                              formData.subSystems.includes(sub.id)
                            ).length

                            // Skip rendering if no filtered subsystems when searching
                            if (searchQuery.trim() && filteredSystemSubSystems.length === 0) {
                              return null
                            }

                            return (
                              <div key={system.id} className="border border-gray-200 rounded-lg bg-white">
                                {/* System Header */}
                                <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-200">
                                  <div className={`w-10 h-10 ${systemIcon.color} rounded-lg flex items-center justify-center text-xl flex-shrink-0`}>
                                    {systemIcon.icon}
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">{system.name}</h3>
                                    <p className="text-sm text-gray-500">
                                      {systemSubSystems.length === 0
                                        ? 'No subsystems available'
                                        : `${selectedCount} of ${systemSubSystems.length} subsystems selected`
                                      }
                                    </p>
                                  </div>
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                    {system.code}
                                  </span>
                                </div>

                                {/* Subsystems Grid */}
                                {filteredSystemSubSystems.length > 0 && (
                                  <div className="p-4">
                                    <div className="grid grid-cols-2 gap-3">
                                      {filteredSystemSubSystems.map((subSystem: any) => {
                                      const isSelected = formData.subSystems.includes(subSystem.id)
                                      return (
                                        <label
                                          key={subSystem.id}
                                          className={`relative flex items-start p-3 border rounded-lg cursor-pointer transition-all ${
                                            isSelected
                                              ? 'border-blue-500 bg-blue-50'
                                              : 'border-gray-200 hover:border-gray-300 bg-white'
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleSubSystemChange(subSystem.id, subSystem.mainSystemId)}
                                            className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                          />
                                          <div className="ml-3 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-sm font-medium text-gray-900">{subSystem.name}</span>
                                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded flex-shrink-0">{subSystem.code}</span>
                                            </div>
                                            {subSystem.description && (
                                              <p className="text-xs text-gray-500 mt-1">
                                                {subSystem.description}
                                              </p>
                                            )}
                                          </div>
                                        </label>
                                      )
                                    })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        {/* Empty State */}
                        {mainSystems.filter((system: any) => {
                          // Filter based on dropdown selection
                          if (filterDropdown !== 'all' && system.id !== filterDropdown) {
                            return false
                          }

                          const systemSubSystems = subSystems.filter((sub: any) => sub.mainSystemId === system.id)

                          // Check if system or its subsystems match the search
                          if (searchQuery.trim()) {
                            const searchLower = searchQuery.toLowerCase()

                            // If main system name matches, include it
                            if (system.name.toLowerCase().includes(searchLower)) {
                              return systemSubSystems.length > 0
                            }

                            // Otherwise check if any subsystem matches
                            return systemSubSystems.some((sub: any) =>
                              sub.name.toLowerCase().includes(searchLower) ||
                              sub.code.toLowerCase().includes(searchLower)
                            )
                          }

                          return systemSubSystems.length > 0
                        }).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-2 text-sm">No subsystems found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
              {errors.systems && (
                <p className="mt-2 text-sm text-red-600">{errors.systems}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-4">
              <Link
                href="/projects"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createProjectMutation.isPending || isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createProjectMutation.isPending ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Creating...
                  </span>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}

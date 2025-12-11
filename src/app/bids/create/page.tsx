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
} from '@/hooks/useBidsForm'
import { useCreateBid } from '@/hooks/useBids'
import { refreshCsrfToken } from '@/lib/api-client'

export default function CreateBidPage() {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const createBidMutation = useCreateBid()

  const [formData, setFormData] = useState({
    bidName: '',
    endUser: '',
    mainContractor: '',
    consultant: '',
    clientType: '',
    industry: '',
    cityTown: '',
    state: '',
    country: '',
    bidClosingDate: '',
    bidManager: '',
    draftingManager: '',
    systems: [] as string[],
    subSystems: [] as string[],
  })

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Dropdown filter state
  const [filterDropdown, setFilterDropdown] = useState('all') // 'all' or system.id

  // Fetch data from APIs
  const { data: endUsers = [], isLoading: loadingEndUsers, error: errorEndUsers } = useEndUsers()
  const { data: contractors = [], isLoading: loadingContractors, error: errorContractors } = useContractors()
  const { data: consultants = [], isLoading: loadingConsultants, error: errorConsultants } = useConsultants()
  const { data: users = [], isLoading: loadingUsers, error: errorUsers } = useUsers()
  const { data: mainSystems = [], isLoading: loadingSystems, error: errorSystems } = useMainSystems()

  // Load ALL subsystems for ALL main systems (not just selected ones)
  const allMainSystemIds = mainSystems.map(system => system.id)
  const { data: subSystems = [], isLoading: loadingSubSystems } = useSubSystems(allMainSystemIds)

  console.log('[CreateBidPage] mainSystems:', mainSystems)
  console.log('[CreateBidPage] loadingSystems:', loadingSystems)
  console.log('[CreateBidPage] errorSystems:', errorSystems)

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
    'Manufacturing'
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
          .filter(sub => sub.mainSystemId === mainSystemId)
          .some(sub => updatedSubSystems.includes(sub.id))

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

    if (!formData.bidName.trim()) {
      newErrors.bidName = 'Enter a bid name.'
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

    if (!formData.bidClosingDate) {
      newErrors.bidClosingDate = 'Select a closing date.'
    }

    if (!formData.bidManager) {
      newErrors.bidManager = 'Select a bid manager.'
    }

    if (!formData.draftingManager) {
      newErrors.draftingManager = 'Select a drafting manager.'
    }

    if (formData.systems.length === 0) {
      newErrors.systems = 'Select at least one system.'
    }

    // Validate client type dependencies
    if (formData.clientType === 'contractor' && !formData.mainContractor) {
      newErrors.mainContractor = 'Select a main contractor when client type is Contractor.'
    }

    if (formData.clientType === 'consultant' && !formData.consultant) {
      newErrors.consultant = 'Select a consultant when client type is Consultant.'
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
      // Refresh CSRF token before submitting (important after signin)
      await refreshCsrfToken()
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error)
      setErrors({ submit: 'Failed to initialize security token. Please refresh the page and try again.' })
      return
    }

    // Call the API
    createBidMutation.mutate(
      {
        bidName: formData.bidName,
        endUserId: formData.endUser || undefined,
        mainContractorId: formData.mainContractor || undefined,
        consultantId: formData.consultant || undefined,
        clientType: formData.clientType || undefined,
        industry: formData.industry || undefined,
        cityTown: formData.cityTown || undefined,
        state: formData.state || undefined,
        country: formData.country || undefined,
        bidClosingDate: formData.bidClosingDate || undefined,
        bidManagerId: formData.bidManager || undefined,
        draftingManagerId: formData.draftingManager || undefined,
        mainSystemIds: formData.systems,
        subSystemIds: formData.subSystems.length > 0 ? formData.subSystems : undefined,
      },
      {
        onSuccess: (data) => {
          console.log('Bid created successfully:', data)
          router.push('/bids')
        },
        onError: (error: any) => {
          console.error('Error creating bid:', error)
          // Handle server errors
          if (error?.message) {
            setErrors({ submit: error.message })
          } else {
            setErrors({ submit: 'Failed to create bid. Please try again.' })
          }
        },
      }
    )
  }

  const isLoading = loadingEndUsers || loadingContractors || loadingConsultants || loadingUsers || loadingSystems

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/bids" className="text-sm text-blue-600 hover:text-blue-700 mb-2 block">
              ← Back to Bids
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create Bid</h1>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-sm text-blue-800">Loading form data...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {(errorSystems || errorEndUsers || errorContractors || errorConsultants || errorUsers) && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading form data</h3>
                  <div className="mt-2 text-sm text-red-700">
                    {errorSystems && <div>• Systems: {errorSystems?.message || 'Unknown error'}</div>}
                    {errorEndUsers && <div>• End Users: {errorEndUsers?.message || 'Unknown error'}</div>}
                    {errorContractors && <div>• Contractors: {errorContractors?.message || 'Unknown error'}</div>}
                    {errorConsultants && <div>• Consultants: {errorConsultants?.message || 'Unknown error'}</div>}
                    {errorUsers && <div>• Users: {errorUsers?.message || 'Unknown error'}</div>}
                  </div>
                  <div className="mt-2 text-sm text-red-700">
                    Check browser console for detailed error logs.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
            {/* Basic Information */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="bidName" className="block text-sm font-medium text-gray-700 mb-1">
                    Bid Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="bidName"
                    name="bidName"
                    value={formData.bidName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.bidName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Downtown Office Complex HVAC System"
                    aria-describedby={errors.bidName ? 'bidName-error' : undefined}
                  />
                  {errors.bidName && (
                    <p id="bidName-error" className="mt-1 text-sm text-red-600">
                      {errors.bidName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                    Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.industry ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    aria-describedby={errors.industry ? 'industry-error' : undefined}
                  >
                    <option value="">Select Industry</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                  {errors.industry && (
                    <p id="industry-error" className="mt-1 text-sm text-red-600">
                      {errors.industry}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="bidClosingDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Bid Closing Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="bidClosingDate"
                    name="bidClosingDate"
                    value={formData.bidClosingDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.bidClosingDate ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    aria-describedby={errors.bidClosingDate ? 'bidClosingDate-error' : undefined}
                  />
                  {errors.bidClosingDate && (
                    <p id="bidClosingDate-error" className="mt-1 text-sm text-red-600">
                      {errors.bidClosingDate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-8 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="endUser" className="block text-sm font-medium text-gray-700 mb-1">
                    End User <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="endUser"
                    name="endUser"
                    value={formData.endUser}
                    onChange={handleChange}
                    disabled={loadingEndUsers}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.endUser ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } ${loadingEndUsers ? 'bg-gray-100' : ''}`}
                    aria-describedby={errors.endUser ? 'endUser-error' : undefined}
                  >
                    <option value="">
                      {loadingEndUsers ? 'Loading...' : 'Select End User'}
                    </option>
                    {endUsers.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.companyName}
                      </option>
                    ))}
                  </select>
                  {errors.endUser && (
                    <p id="endUser-error" className="mt-1 text-sm text-red-600">
                      {errors.endUser}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="mainContractor"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Main Contractor
                  </label>
                  <select
                    id="mainContractor"
                    name="mainContractor"
                    value={formData.mainContractor}
                    onChange={handleChange}
                    disabled={loadingContractors}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.mainContractor ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } ${loadingContractors ? 'bg-gray-100' : ''}`}
                    aria-describedby={errors.mainContractor ? 'mainContractor-error' : undefined}
                  >
                    <option value="">
                      {loadingContractors ? 'Loading...' : 'Select Main Contractor'}
                    </option>
                    {contractors.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.companyName}
                      </option>
                    ))}
                  </select>
                  {errors.mainContractor && (
                    <p id="mainContractor-error" className="mt-1 text-sm text-red-600">
                      {errors.mainContractor}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="consultant" className="block text-sm font-medium text-gray-700 mb-1">
                    Consultant
                  </label>
                  <select
                    id="consultant"
                    name="consultant"
                    value={formData.consultant}
                    onChange={handleChange}
                    disabled={loadingConsultants}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.consultant ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } ${loadingConsultants ? 'bg-gray-100' : ''}`}
                    aria-describedby={errors.consultant ? 'consultant-error' : undefined}
                  >
                    <option value="">
                      {loadingConsultants ? 'Loading...' : 'Select Consultant'}
                    </option>
                    {consultants.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.companyName}
                      </option>
                    ))}
                  </select>
                  {errors.consultant && (
                    <p id="consultant-error" className="mt-1 text-sm text-red-600">
                      {errors.consultant}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Choose Client */}
            <div className="mb-8 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Choose Client</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="clientType" className="block text-sm font-medium text-gray-700 mb-1">
                    Client Type
                  </label>
                  <select
                    id="clientType"
                    name="clientType"
                    value={formData.clientType}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.clientType ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    aria-describedby={errors.clientType ? 'clientType-error' : undefined}
                  >
                    <option value="">Select Client Type</option>
                    <option value="end_user">End User</option>
                    <option value="contractor">Contractor</option>
                    <option value="consultant">Consultant</option>
                  </select>
                  {errors.clientType && (
                    <p id="clientType-error" className="mt-1 text-sm text-red-600">
                      {errors.clientType}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="mb-8 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="cityTown" className="block text-sm font-medium text-gray-700 mb-1">
                    City/Town <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="cityTown"
                    name="cityTown"
                    value={formData.cityTown}
                    onChange={handleChange}
                    placeholder="e.g., New York"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.cityTown ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    aria-describedby={errors.cityTown ? 'cityTown-error' : undefined}
                  />
                  {errors.cityTown && (
                    <p id="cityTown-error" className="mt-1 text-sm text-red-600">
                      {errors.cityTown}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g., NY"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g., USA"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.country ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    aria-describedby={errors.country ? 'country-error' : undefined}
                  />
                  {errors.country && (
                    <p id="country-error" className="mt-1 text-sm text-red-600">
                      {errors.country}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Team */}
            <div className="mb-8 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="bidManager" className="block text-sm font-medium text-gray-700 mb-1">
                    Bid Manager <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="bidManager"
                    name="bidManager"
                    value={formData.bidManager}
                    onChange={handleChange}
                    disabled={loadingUsers}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.bidManager ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } ${loadingUsers ? 'bg-gray-100' : ''}`}
                    aria-describedby={errors.bidManager ? 'bidManager-error' : undefined}
                  >
                    <option value="">
                      {loadingUsers ? 'Loading...' : 'Select Bid Manager'}
                    </option>
                    {users
                      .filter((user) => user.role.name === 'Bid Manager')
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName}
                        </option>
                      ))}
                  </select>
                  {errors.bidManager && (
                    <p id="bidManager-error" className="mt-1 text-sm text-red-600">
                      {errors.bidManager}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="draftingManager"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Drafting Manager <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="draftingManager"
                    name="draftingManager"
                    value={formData.draftingManager}
                    onChange={handleChange}
                    disabled={loadingUsers}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      errors.draftingManager ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } ${loadingUsers ? 'bg-gray-100' : ''}`}
                    aria-describedby={errors.draftingManager ? 'draftingManager-error' : undefined}
                  >
                    <option value="">
                      {loadingUsers ? 'Loading...' : 'Select Drafting Manager'}
                    </option>
                    {users
                      .filter((user) => user.role.name === 'Drafting Manager')
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName}
                        </option>
                      ))}
                  </select>
                  {errors.draftingManager && (
                    <p id="draftingManager-error" className="mt-1 text-sm text-red-600">
                      {errors.draftingManager}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Systems & Subsystems Selection */}
            <div className="mb-8 pt-6 border-t border-gray-200">
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
                Choose the systems and subsystems that will be included in this bid
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
                      {mainSystems.map((system) => (
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
                          .filter(system => {
                            // Filter based on dropdown selection
                            if (filterDropdown !== 'all' && system.id !== filterDropdown) {
                              return false
                            }
                            // Filter based on search query - search in system name or subsystem names
                            if (searchQuery.trim()) {
                              const searchLower = searchQuery.toLowerCase()
                              const systemSubSystems = subSystems.filter(sub => sub.mainSystemId === system.id)

                              // Check if system name matches
                              if (system.name?.toLowerCase().includes(searchLower)) {
                                return true
                              }

                              // Check if any subsystem name or code matches
                              return systemSubSystems.some(sub =>
                                sub.name?.toLowerCase().includes(searchLower) ||
                                sub.code?.toLowerCase().includes(searchLower)
                              )
                            }
                            // Show all systems by default
                            return true
                          })
                          .map((system) => {
                            const systemIcon = getSystemIcon(system.name)
                            const systemSubSystems = subSystems.filter(sub => sub.mainSystemId === system.id)

                            // If system name matches search, show ALL subsystems; otherwise filter subsystems
                            const filteredSystemSubSystems = systemSubSystems.filter(sub => {
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
                            const selectedCount = filteredSystemSubSystems.filter(sub =>
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
                                      {filteredSystemSubSystems.map((subSystem) => {
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
                                              <span className="text-sm font-medium text-gray-900">
                                                {subSystem.name}
                                              </span>
                                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded flex-shrink-0">
                                                {subSystem.code}
                                              </span>
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
                        {mainSystems.filter(system => {
                          // Filter based on dropdown selection
                          if (filterDropdown !== 'all' && system.id !== filterDropdown) {
                            return false
                          }

                          const systemSubSystems = subSystems.filter(sub => sub.mainSystemId === system.id)

                          // Check if system or its subsystems match the search
                          if (searchQuery.trim()) {
                            const searchLower = searchQuery.toLowerCase()

                            // If main system name matches, include it
                            if (system.name.toLowerCase().includes(searchLower)) {
                              return systemSubSystems.length > 0
                            }

                            // Otherwise check if any subsystem matches
                            return systemSubSystems.some(sub =>
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

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Link
                href="/bids"
                className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createBidMutation.isPending || isLoading}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {createBidMutation.isPending ? 'Creating...' : 'Create Bid'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}

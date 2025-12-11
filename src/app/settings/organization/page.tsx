'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { getApiUrl } from '@/lib/config';
import SettingsLayout from '@/components/settings/SettingsLayout';
import { useAuth } from '@/contexts/AuthContext';
import { WorkingHoursSettings } from '@/components/settings/WorkingHoursSettings';

type TabType = 'overview' | 'contact' | 'working-hours' | 'holidays' | 'notifications';

function OrganizationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'overview';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/settings/organization?tab=${tab}`, { scroll: false });
  };

  return (
    <SettingsLayout>
      <div className="max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Organization Settings</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage your organization's information, working hours, and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
              <button
                onClick={() => handleTabChange('overview')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={activeTab === 'overview' ? 'page' : undefined}
              >
                Overview
              </button>
              <button
                onClick={() => handleTabChange('contact')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === 'contact'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={activeTab === 'contact' ? 'page' : undefined}
              >
                Contact Details
              </button>
              <button
                onClick={() => handleTabChange('working-hours')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === 'working-hours'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={activeTab === 'working-hours' ? 'page' : undefined}
              >
                Working Hours
              </button>
              <button
                onClick={() => handleTabChange('holidays')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === 'holidays'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={activeTab === 'holidays' ? 'page' : undefined}
              >
                Holidays
              </button>
              <button
                onClick={() => handleTabChange('notifications')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === 'notifications'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={activeTab === 'notifications' ? 'page' : undefined}
              >
                Notifications
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'contact' && <ContactTab />}
            {activeTab === 'working-hours' && <WorkingHoursTab />}
            {activeTab === 'holidays' && <HolidaysTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}

// ========================================
// OVERVIEW TAB
// ========================================
function OverviewTab() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Check if user is admin (case-insensitive)
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    businessType: '',
    industry: '',
    companySize: '',
    establishedYear: '',
    timezone: 'UTC',
    currency: 'USD',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    maxDailyHours: '',
    maxWeeklyHours: '',
  });

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient(getApiUrl('organization-settings'), {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch organization');
      }

      const data = await response.json();
      setOrganization(data);
      setFormData({
        name: data.name || '',
        taxId: data.taxId || '',
        businessType: data.businessType || '',
        industry: data.industry || '',
        companySize: data.companySize || '',
        establishedYear: data.establishedYear ? String(data.establishedYear) : '',
        timezone: data.timezone || 'UTC',
        currency: data.currency || 'USD',
        street: data.street || '',
        city: data.city || '',
        state: data.state || '',
        postalCode: data.postalCode || '',
        country: data.country || '',
        maxDailyHours: data.maxDailyHours ? String(data.maxDailyHours) : '',
        maxWeeklyHours: data.maxWeeklyHours ? String(data.maxWeeklyHours) : '',
      });
    } catch (err: any) {
      console.error('[Overview] Error fetching organization:', err);
      setError(err.message || 'Failed to fetch organization');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        name: formData.name,
        taxId: formData.taxId || undefined,
        businessType: formData.businessType || undefined,
        industry: formData.industry || undefined,
        companySize: formData.companySize || undefined,
        establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : undefined,
        timezone: formData.timezone,
        currency: formData.currency,
        street: formData.street || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        postalCode: formData.postalCode || undefined,
        country: formData.country || undefined,
        maxDailyHours: formData.maxDailyHours ? parseInt(formData.maxDailyHours) : undefined,
        maxWeeklyHours: formData.maxWeeklyHours ? parseInt(formData.maxWeeklyHours) : undefined,
      };

      const response = await apiClient(getApiUrl('organization-settings'), {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (Array.isArray(errorData.message)) {
          throw new Error(errorData.message.join('\n'));
        }
        throw new Error(errorData.message || 'Failed to update organization');
      }

      const data = await response.json();
      setOrganization(data);
      setIsEditMode(false);
      setSuccess('Organization updated successfully');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('[Overview] Error updating organization:', err);
      setError(err.message || 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    // Reset form data to original organization data
    if (organization) {
      setFormData({
        name: organization.name || '',
        taxId: organization.taxId || '',
        businessType: organization.businessType || '',
        industry: organization.industry || '',
        companySize: organization.companySize || '',
        establishedYear: organization.establishedYear ? String(organization.establishedYear) : '',
        timezone: organization.timezone || 'UTC',
        currency: organization.currency || 'USD',
        street: organization.street || '',
        city: organization.city || '',
        state: organization.state || '',
        postalCode: organization.postalCode || '',
        country: organization.country || '',
        maxDailyHours: organization.maxDailyHours ? String(organization.maxDailyHours) : '',
        maxWeeklyHours: organization.maxWeeklyHours ? String(organization.maxWeeklyHours) : '',
      });
    }
    setIsEditMode(false);
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Organization Overview</h3>
          <p className="text-sm text-gray-500 mt-1">
            {isEditMode
              ? 'Update organization information and click Save to apply changes.'
              : isAdmin
                ? 'View organization information. Click Edit to make changes.'
                : 'View organization information. Only admins can edit organization settings.'}
          </p>
        </div>
        {!isEditMode && isAdmin && (
          <button
            type="button"
            onClick={handleEdit}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      )}

      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={!isEditMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                isEditMode
                  ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1">
              Tax ID
            </label>
            <input
              type="text"
              id="taxId"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              disabled={!isEditMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                isEditMode
                  ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
              Business Type
            </label>
            <input
              type="text"
              id="businessType"
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              placeholder="e.g., Corporation, LLC"
              disabled={!isEditMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                isEditMode
                  ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <input
              type="text"
              id="industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="e.g., Technology, Manufacturing"
              disabled={!isEditMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                isEditMode
                  ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-1">
              Company Size
            </label>
            <input
              type="text"
              id="companySize"
              value={formData.companySize}
              onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
              placeholder="e.g., 50-200"
              disabled={!isEditMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                isEditMode
                  ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label htmlFor="establishedYear" className="block text-sm font-medium text-gray-700 mb-1">
              Established Year
            </label>
            <input
              type="number"
              id="establishedYear"
              value={formData.establishedYear}
              onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
              min="1800"
              max="2100"
              placeholder="e.g., 2010"
              disabled={!isEditMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                isEditMode
                  ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Regional Settings</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
              Timezone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="timezone"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              required
              placeholder="e.g., America/New_York"
              disabled={!isEditMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                isEditMode
                  ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
              Currency <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
              required
              maxLength={3}
              placeholder="e.g., USD"
              disabled={!isEditMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                isEditMode
                  ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              type="text"
              id="street"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="e.g., 123 Main St"
              disabled={!isEditMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                isEditMode
                  ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={!isEditMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                  isEditMode
                    ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                    : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State/Province
              </label>
              <input
                type="text"
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                disabled={!isEditMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                  isEditMode
                    ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                    : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                disabled={!isEditMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                  isEditMode
                    ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                    : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                }`}
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                disabled={!isEditMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                  isEditMode
                    ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                    : 'bg-gray-50 text-gray-500 cursor-not-allowed'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timesheet Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Timesheet Settings</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="maxDailyHours" className="block text-sm font-medium text-gray-700 mb-1">
              Max Daily Hours
            </label>
            <input
              type="number"
              id="maxDailyHours"
              value={formData.maxDailyHours}
              onChange={(e) => setFormData({ ...formData, maxDailyHours: e.target.value })}
              min="1"
              max="24"
              placeholder="e.g., 8"
              disabled={!isEditMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                isEditMode
                  ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label htmlFor="maxWeeklyHours" className="block text-sm font-medium text-gray-700 mb-1">
              Max Weekly Hours
            </label>
            <input
              type="number"
              id="maxWeeklyHours"
              value={formData.maxWeeklyHours}
              onChange={(e) => setFormData({ ...formData, maxWeeklyHours: e.target.value })}
              min="1"
              max="168"
              placeholder="e.g., 40"
              disabled={!isEditMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                isEditMode
                  ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditMode && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </form>
  );
}

// ========================================
// CONTACT TAB
// ========================================
function ContactTab() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Check if user is admin (case-insensitive)
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    website: '',
  });

  useEffect(() => {
    fetchContact();
  }, []);

  const fetchContact = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient(getApiUrl('organization-settings'), {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch contact details');
      }

      const data = await response.json();
      setOrganization(data);
      setFormData({
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
      });
    } catch (err: any) {
      console.error('[Contact] Error fetching contact:', err);
      setError(err.message || 'Failed to fetch contact details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await apiClient(getApiUrl('organization-settings/contact'), {
        method: 'PUT',
        body: JSON.stringify({
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          website: formData.website || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (Array.isArray(errorData.message)) {
          throw new Error(errorData.message.join('\n'));
        }
        throw new Error(errorData.message || 'Failed to update contact details');
      }

      setIsEditMode(false);
      setSuccess('Contact details updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('[Contact] Error updating contact:', err);
      setError(err.message || 'Failed to update contact details');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    // Reset form data to original organization data
    if (organization) {
      setFormData({
        email: organization.email || '',
        phone: organization.phone || '',
        website: organization.website || '',
      });
    }
    setIsEditMode(false);
    setError('');
    setSuccess('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
          <p className="text-sm text-gray-500">
            {isEditMode
              ? 'Update contact information and click Save to apply changes.'
              : isAdmin
                ? 'View contact information. Click Edit to make changes.'
                : 'View contact information. Only admins can edit organization settings.'}
          </p>
        </div>
        {!isEditMode && isAdmin && (
          <button
            type="button"
            onClick={handleEdit}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      )}

      <div>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Organization Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@example.com"
              disabled={!isEditMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                isEditMode
                  ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
            />
            <p className="mt-1 text-sm text-gray-500">
              Primary email address for organization correspondence
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1-555-123-4567"
              disabled={!isEditMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                isEditMode
                  ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
            />
            <p className="mt-1 text-sm text-gray-500">
              Primary phone number for organization contact
            </p>
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <input
              type="url"
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.example.com"
              disabled={!isEditMode}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                isEditMode
                  ? 'focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 text-gray-500 cursor-not-allowed'
              }`}
            />
            <p className="mt-1 text-sm text-gray-500">
              Organization's official website (must start with http:// or https://)
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditMode && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </form>
  );
}

// ========================================
// WORKING HOURS TAB
// ========================================
function WorkingHoursTab() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return <WorkingHoursSettings isAdmin={isAdmin} />;
}

// ========================================
// HOLIDAYS TAB
// ========================================
function HolidaysTab() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any>(null);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient(getApiUrl('organization-settings/holidays'), {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch holidays');
      }

      const data = await response.json();
      setHolidays(data);
    } catch (err: any) {
      console.error('[Holidays] Error fetching:', err);
      setError(err.message || 'Failed to fetch holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingHoliday(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (holiday: any) => {
    setEditingHoliday(holiday);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) {
      return;
    }

    try {
      const response = await apiClient(getApiUrl(`organization-settings/holidays/${id}`), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete holiday');
      }

      setSuccess('Holiday deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchHolidays();
    } catch (err: any) {
      console.error('[Holidays] Error deleting:', err);
      setError(err.message || 'Failed to delete holiday');
    }
  };

  const handleSave = () => {
    setIsDrawerOpen(false);
    setSuccess(editingHoliday ? 'Holiday updated successfully' : 'Holiday created successfully');
    setTimeout(() => setSuccess(''), 3000);
    fetchHolidays();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Organization Holidays</h3>
          <p className="mt-1 text-sm text-gray-600">
            {isAdmin
              ? 'Manage your organization\'s official holidays and non-working days'
              : 'View your organization\'s official holidays and non-working days. Only admins can edit.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleAdd}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Holiday
          </button>
        )}
      </div>

      {holidays.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No holidays defined</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first holiday.</p>
          <div className="mt-6">
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Holiday
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recurring
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {holidays.map((holiday) => (
                <tr key={holiday.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{holiday.name}</div>
                      {holiday.description && (
                        <div className="text-sm text-gray-500">{holiday.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(holiday.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {holiday.type || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {holiday.recurringAnnually ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Yearly
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        One-time
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(holiday)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(holiday.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Holidays Drawer */}
      {isDrawerOpen && (
        <HolidaysDrawer
          holiday={editingHoliday}
          onClose={() => setIsDrawerOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// Holidays Drawer Component
function HolidaysDrawer({
  holiday,
  onClose,
  onSave,
}: {
  holiday: any;
  onClose: () => void;
  onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: holiday?.name ?? '',
    date: holiday?.date ?? '',
    type: holiday?.type ?? '',
    description: holiday?.description ?? '',
    recurringAnnually: holiday?.recurringAnnually ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');

      const url = holiday
        ? getApiUrl(`organization-settings/holidays/${holiday.id}`)
        : getApiUrl('organization-settings/holidays');

      const response = await apiClient(url, {
        method: holiday ? 'PUT' : 'POST',
        body: JSON.stringify({
          name: formData.name,
          date: formData.date,
          type: formData.type || undefined,
          description: formData.description || undefined,
          recurringAnnually: formData.recurringAnnually,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (Array.isArray(errorData.message)) {
          throw new Error(errorData.message.join('\n'));
        }
        throw new Error(errorData.message || 'Failed to save holiday');
      }

      onSave();
    } catch (err: any) {
      console.error('[HolidaysDrawer] Error saving:', err);
      setError(err.message || 'Failed to save holiday');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Drawer */}
        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl">
              {/* Header */}
              <div className="px-6 py-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    {holiday ? 'Edit Holiday' : 'Add Holiday'}
                  </h2>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                      <pre className="whitespace-pre-wrap text-sm">{error}</pre>
                    </div>
                  )}

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Holiday Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g., New Year's Day"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                      Holiday Type
                    </label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a type</option>
                      <option value="National">National</option>
                      <option value="Religious">Religious</option>
                      <option value="Company">Company</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Optional description or notes about this holiday"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="recurringAnnually"
                      checked={formData.recurringAnnually}
                      onChange={(e) => setFormData({ ...formData, recurringAnnually: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="recurringAnnually" className="ml-2 block text-sm text-gray-900">
                      Recurring Annually
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 ml-6">
                    If checked, this holiday will automatically apply to future years on the same date
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-sm text-blue-700">
                      <strong>Tip:</strong> Use recurring holidays for annual observances like New Year's Day,
                      Independence Day, or Christmas. For one-time events or company-specific days, leave unchecked.
                    </p>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : holiday ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// NOTIFICATIONS TAB
// ========================================
function NotificationsTab() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient(getApiUrl('organization-settings/notifications'), {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch notification settings');
      }

      const data = await response.json();
      setEmailEnabled(data.notificationsEmailEnabled);
    } catch (err: any) {
      console.error('[Notifications] Error fetching settings:', err);
      setError(err.message || 'Failed to fetch notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    const newValue = !emailEnabled;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await apiClient(getApiUrl('organization-settings/notifications'), {
        method: 'PUT',
        body: JSON.stringify({
          notificationsEmailEnabled: newValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update notification settings');
      }

      setEmailEnabled(newValue);
      setSuccess(`Email notifications ${newValue ? 'enabled' : 'disabled'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('[Notifications] Error updating settings:', err);
      setError(err.message || 'Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {success}
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Enable Email Notifications</h4>
              <p className="mt-1 text-sm text-gray-600">
                {isAdmin
                  ? 'Allow the system to send email notifications to users for important events such as task assignments, ticket updates, and timesheet approvals.'
                  : 'Email notifications setting can only be changed by administrators.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              disabled={saving || !isAdmin}
              className={`
                relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${emailEnabled ? 'bg-blue-600' : 'bg-gray-200'}
                ${saving || !isAdmin ? 'opacity-100 cursor-not-allowed' : 'cursor-pointer'}
              `}
              role="switch"
              aria-checked={emailEnabled}
              aria-label="Enable email notifications"
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                  transition duration-200 ease-in-out
                  ${emailEnabled ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Disabling email notifications will prevent the system from sending any emails.
                This includes verification emails, password reset emails, and user invitations. Users will still receive
                in-app notifications.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrganizationSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <OrganizationContent />
    </Suspense>
  );
}

/**
 * EXAMPLE: How to Create a New Settings Page
 *
 * This is an example template showing how to create a new settings page.
 * To use this:
 *
 * 1. Copy this file to: apps/web/src/app/settings/[your-page-name]/page.tsx
 * 2. Customize the content below
 * 3. Add your page to the navigation in: components/settings/SettingsLayout.tsx
 *
 * Example: To create "Organization Settings":
 * - Copy to: apps/web/src/app/settings/organization/page.tsx
 * - Add to SettingsLayout.tsx navigation:
 *   {
 *     name: 'Organization',
 *     href: '/settings/organization',
 *     description: 'Manage organization settings',
 *   }
 */

'use client';

import { useState, useEffect } from 'react';
import SettingsLayout from '@/components/settings/SettingsLayout';
import { apiClient } from '@/lib/api-client';
import { getApiUrl } from '@/lib/config';

export default function ExampleSettingsPage() {
  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    // Add your form fields here
    exampleField: '',
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await apiClient(getApiUrl('your-endpoint'), {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();

      setFormData({
        exampleField: data.exampleField || '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await apiClient(getApiUrl('your-endpoint'), {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (Array.isArray(errorData.message)) {
          throw new Error(errorData.message.join('\n'));
        }

        throw new Error(errorData.message || 'Failed to update');
      }

      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <SettingsLayout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout>
      <div className="max-w-4xl mx-auto">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Example Settings Page</h2>
          <p className="mt-1 text-sm text-gray-600">
            This is an example template for creating new settings pages
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow p-6">
            {/* Success Message */}
            {success && (
              <div className="mb-6 rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-red-800 whitespace-pre-line">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Section Heading */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900">Settings Section</h3>
              <p className="mt-1 text-sm text-gray-500">
                Brief description of this settings section
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Example Text Field */}
              <div>
                <label htmlFor="exampleField" className="block text-sm font-medium text-gray-700">
                  Example Field <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="exampleField"
                  name="exampleField"
                  value={formData.exampleField}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter value..."
                />
              </div>

              {/* Add more form fields as needed */}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={fetchData}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </SettingsLayout>
  );
}

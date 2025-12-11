'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SettingsLayout from '@/components/settings/SettingsLayout';
import { apiClient } from '@/lib/api-client';
import { getApiUrl } from '@/lib/config';

interface NamingConvention {
  id: string;
  orgId: string;
  bidPrefix: string;
  projectPrefix: string;
  ticketPrefix: string;
  taskPrefix: string;
  createdAt: string;
  updatedAt: string;
}

interface NamingConventionPreview {
  bidPreview: string;
  projectPreview: string;
  ticketPreview: string;
  taskPreview: string;
}

interface FormData {
  bidPrefix: string;
  projectPrefix: string;
  ticketPrefix: string;
  taskPrefix: string;
}

interface FieldErrors {
  bidPrefix?: string;
  projectPrefix?: string;
  ticketPrefix?: string;
  taskPrefix?: string;
}

export default function NamingConventionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [hasPermission, setHasPermission] = useState({ view: true, edit: true });
  const [initialData, setInitialData] = useState<FormData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    bidPrefix: '',
    projectPrefix: '',
    ticketPrefix: '',
    taskPrefix: '',
  });
  const [preview, setPreview] = useState<NamingConventionPreview | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Regex pattern for validation: ^[A-Z0-9._-]{1,12}$
  const prefixPattern = /^[A-Z0-9._-]{1,12}$/;

  // Load naming conventions on mount
  useEffect(() => {
    loadNamingConventions();
  }, []);

  // Load preview whenever form data changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.bidPrefix || formData.projectPrefix || formData.ticketPrefix || formData.taskPrefix) {
        loadPreview();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Check for unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const loadNamingConventions = async () => {
    try {
      setLoading(true);

      // Try to load naming conventions
      const response = await apiClient(
        getApiUrl('organization-settings/naming-conventions'),
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          setHasPermission({ view: false, edit: false });
          setErrorMessage('You do not have permission to view naming conventions');
        } else {
          setErrorMessage('Failed to load naming conventions');
        }
        throw new Error('Failed to load naming conventions');
      }

      const data = await response.json();

      const formData: FormData = {
        bidPrefix: data.bidPrefix,
        projectPrefix: data.projectPrefix,
        ticketPrefix: data.ticketPrefix,
        taskPrefix: data.taskPrefix,
      };

      setFormData(formData);
      setInitialData(formData);

      // User has view permission (GET succeeded)
      // Assume user has edit permission by default - will be blocked by backend if not
      // The actual permission check happens on save attempt
      setHasPermission({ view: true, edit: true });

      loadPreview();
    } catch (error: any) {
      console.error('Failed to load naming conventions:', error);
      if (!errorMessage) {
        setErrorMessage('Failed to load naming conventions');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async () => {
    try {
      setLoadingPreview(true);
      const response = await apiClient(
        getApiUrl('organization-settings/naming-conventions/preview'),
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPreview(data);
      }
    } catch (error) {
      console.error('Failed to load preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const validateField = (name: keyof FormData, value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'This field is required';
    }

    const trimmed = value.trim();
    if (trimmed.length < 1 || trimmed.length > 12) {
      return 'Must be between 1 and 12 characters';
    }

    const uppercased = trimmed.toUpperCase();
    if (!prefixPattern.test(uppercased)) {
      return 'Can only contain uppercase A-Z, 0-9, -, _, .';
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const uppercased = value.toUpperCase();

    setFormData((prev) => ({
      ...prev,
      [name]: uppercased,
    }));

    // Mark as dirty if different from initial
    if (initialData) {
      const newData = { ...formData, [name]: uppercased };
      setIsDirty(JSON.stringify(newData) !== JSON.stringify(initialData));
    }

    // Clear error for this field
    if (errors[name as keyof FieldErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate form
    if (!validateForm()) {
      // Focus first invalid field
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        document.getElementById(firstError)?.focus();
      }
      return;
    }

    try {
      setSaving(true);

      const response = await apiClient(
        getApiUrl('organization-settings/naming-conventions'),
        {
          method: 'PUT',
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 422 && errorData.errors) {
          // Field-specific errors from server
          setErrors(errorData.errors);
        } else if (response.status === 403) {
          // User doesn't have edit permission - switch to read-only mode
          setHasPermission({ view: true, edit: false });
          setErrorMessage('You do not have permission to edit naming conventions. This page is now in read-only mode.');
        } else {
          setErrorMessage('Failed to save naming conventions. Please try again.');
        }
        return;
      }

      // Update initial data
      setInitialData(formData);
      setIsDirty(false);

      // Show success toast
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);

      // Reload preview
      loadPreview();
    } catch (error: any) {
      console.error('Failed to save naming conventions:', error);
      setErrorMessage('Failed to save naming conventions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (initialData) {
      setFormData(initialData);
      setErrors({});
      setIsDirty(false);
      setErrorMessage(null);
    }
  };

  if (loading) {
    return (
      <SettingsLayout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  if (!hasPermission.view) {
    return (
      <SettingsLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              You do not have permission to view naming conventions.
            </p>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  const isReadOnly = !hasPermission.edit;

  return (
    <SettingsLayout>
      <div className="max-w-4xl mx-auto">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Naming Conventions</h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure prefixes for bids, projects, tickets, and tasks. Changes apply only to new records.
          </p>
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <div
            className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center"
            role="alert"
            aria-live="polite"
          >
            <svg
              className="w-5 h-5 text-green-600 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-green-800 font-medium">Saved successfully</p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div
            className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4"
            role="alert"
          >
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
          <div className="p-6 space-y-6">
            {/* Bid Prefix */}
            <div>
              <label
                htmlFor="bidPrefix"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Bid Prefix <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="bidPrefix"
                name="bidPrefix"
                value={formData.bidPrefix}
                onChange={handleInputChange}
                disabled={isReadOnly || saving}
                maxLength={12}
                className={`
                  mt-1 block w-full rounded-md shadow-sm sm:text-sm
                  ${
                    errors.bidPrefix
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }
                  ${isReadOnly || saving ? 'bg-gray-50 cursor-not-allowed' : ''}
                `}
                placeholder="BID"
                aria-describedby={errors.bidPrefix ? 'bidPrefix-error' : undefined}
                aria-invalid={errors.bidPrefix ? 'true' : 'false'}
              />
              {errors.bidPrefix && (
                <p className="mt-1 text-sm text-red-600" id="bidPrefix-error">
                  {errors.bidPrefix}
                </p>
              )}
              {preview && !errors.bidPrefix && (
                <p className="mt-1 text-sm text-gray-500">
                  Next ID: <span className="font-medium">{preview.bidPreview}</span>
                </p>
              )}
            </div>

            {/* Project Prefix */}
            <div>
              <label
                htmlFor="projectPrefix"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Project Prefix <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="projectPrefix"
                name="projectPrefix"
                value={formData.projectPrefix}
                onChange={handleInputChange}
                disabled={isReadOnly || saving}
                maxLength={12}
                className={`
                  mt-1 block w-full rounded-md shadow-sm sm:text-sm
                  ${
                    errors.projectPrefix
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }
                  ${isReadOnly || saving ? 'bg-gray-50 cursor-not-allowed' : ''}
                `}
                placeholder="PRJ"
                aria-describedby={errors.projectPrefix ? 'projectPrefix-error' : undefined}
                aria-invalid={errors.projectPrefix ? 'true' : 'false'}
              />
              {errors.projectPrefix && (
                <p className="mt-1 text-sm text-red-600" id="projectPrefix-error">
                  {errors.projectPrefix}
                </p>
              )}
              {preview && !errors.projectPrefix && (
                <p className="mt-1 text-sm text-gray-500">
                  Next ID: <span className="font-medium">{preview.projectPreview}</span>
                </p>
              )}
            </div>

            {/* Ticket Prefix */}
            <div>
              <label
                htmlFor="ticketPrefix"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Ticket Prefix <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ticketPrefix"
                name="ticketPrefix"
                value={formData.ticketPrefix}
                onChange={handleInputChange}
                disabled={isReadOnly || saving}
                maxLength={12}
                className={`
                  mt-1 block w-full rounded-md shadow-sm sm:text-sm
                  ${
                    errors.ticketPrefix
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }
                  ${isReadOnly || saving ? 'bg-gray-50 cursor-not-allowed' : ''}
                `}
                placeholder="TKT"
                aria-describedby={errors.ticketPrefix ? 'ticketPrefix-error' : undefined}
                aria-invalid={errors.ticketPrefix ? 'true' : 'false'}
              />
              {errors.ticketPrefix && (
                <p className="mt-1 text-sm text-red-600" id="ticketPrefix-error">
                  {errors.ticketPrefix}
                </p>
              )}
              {preview && !errors.ticketPrefix && (
                <p className="mt-1 text-sm text-gray-500">
                  Next ID: <span className="font-medium">{preview.ticketPreview}</span>
                </p>
              )}
            </div>

            {/* Task Prefix */}
            <div>
              <label
                htmlFor="taskPrefix"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Task Prefix <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="taskPrefix"
                name="taskPrefix"
                value={formData.taskPrefix}
                onChange={handleInputChange}
                disabled={isReadOnly || saving}
                maxLength={12}
                className={`
                  mt-1 block w-full rounded-md shadow-sm sm:text-sm
                  ${
                    errors.taskPrefix
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }
                  ${isReadOnly || saving ? 'bg-gray-50 cursor-not-allowed' : ''}
                `}
                placeholder="TSK"
                aria-describedby={errors.taskPrefix ? 'taskPrefix-error' : undefined}
                aria-invalid={errors.taskPrefix ? 'true' : 'false'}
              />
              {errors.taskPrefix && (
                <p className="mt-1 text-sm text-red-600" id="taskPrefix-error">
                  {errors.taskPrefix}
                </p>
              )}
              {preview && !errors.taskPrefix && (
                <p className="mt-1 text-sm text-gray-500">
                  Next ID: <span className="font-medium">{preview.taskPreview}</span>
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm text-blue-700">
                    <strong>Format:</strong> 1-12 characters, uppercase A-Z, 0-9, and special characters (- _ .)
                  </p>
                  <p className="mt-2 text-sm text-blue-700">
                    <strong>Note:</strong> Changes only apply to newly created records. Existing records will retain their current prefixes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          {!isReadOnly && (
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                disabled={!isDirty || saving}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isDirty || saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {saving && (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Read-only message */}
          {isReadOnly && (
            <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
              <p className="text-sm text-gray-600 italic">
                You have view-only access to naming conventions. Contact an administrator to make changes.
              </p>
            </div>
          )}
        </form>
      </div>
    </SettingsLayout>
  );
}

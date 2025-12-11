/**
 * CommonForm Component
 *
 * Reusable form component with:
 * - React Hook Form integration
 * - Zod schema validation
 * - Field primitives (input, select, checkbox, etc.)
 * - Section support
 * - Server error mapping
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import {
  CommonFormProps,
  FieldConfig,
  FormSection,
  TextFieldConfig,
  TextareaFieldConfig,
  SelectFieldConfig,
  MultiSelectFieldConfig,
  CheckboxFieldConfig,
  RadioFieldConfig,
  FileFieldConfig,
  DateFieldConfig,
  CustomFieldConfig,
} from './types'

/**
 * Check if fields are sections
 */
function isSections(fields: FieldConfig[] | FormSection[]): fields is FormSection[] {
  return fields.length > 0 && 'fields' in fields[0]
}

/**
 * Text Input Field
 */
function TextField({
  field,
  register,
  error,
}: {
  field: TextFieldConfig
  register: any
  error?: string
}) {
  return (
    <div className={field.className}>
      <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={field.type}
        id={field.name}
        {...register(field.name)}
        placeholder={field.placeholder}
        disabled={field.disabled}
        readOnly={field.readOnly}
        min={field.min}
        max={field.max}
        step={field.step}
        className={`block w-full rounded-md shadow-sm sm:text-sm ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }`}
      />
      {field.helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

/**
 * Textarea Field
 */
function TextareaField({
  field,
  register,
  error,
}: {
  field: TextareaFieldConfig
  register: any
  error?: string
}) {
  return (
    <div className={field.className}>
      <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        id={field.name}
        {...register(field.name)}
        placeholder={field.placeholder}
        disabled={field.disabled}
        readOnly={field.readOnly}
        rows={field.rows || 3}
        className={`block w-full rounded-md shadow-sm sm:text-sm ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }`}
      />
      {field.helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

/**
 * Select Field
 */
function SelectField({
  field,
  register,
  error,
}: {
  field: SelectFieldConfig
  register: any
  error?: string
}) {
  return (
    <div className={field.className}>
      <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={field.name}
        {...register(field.name)}
        disabled={field.disabled}
        className={`block w-full rounded-md shadow-sm sm:text-sm ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }`}
      >
        <option value="">{field.placeholder || 'Select...'}</option>
        {field.options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {field.helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

/**
 * Checkbox/Switch Field
 */
function CheckboxField({
  field,
  register,
  error,
}: {
  field: CheckboxFieldConfig
  register: any
  error?: string
}) {
  return (
    <div className={field.className}>
      <div className="flex items-center">
        <input
          type="checkbox"
          id={field.name}
          {...register(field.name)}
          disabled={field.disabled}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor={field.name} className="ml-2 block text-sm text-gray-900">
          {field.checkboxLabel || field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      {field.helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

/**
 * Radio Field
 */
function RadioField({
  field,
  register,
  error,
}: {
  field: RadioFieldConfig
  register: any
  error?: string
}) {
  return (
    <div className={field.className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className={`space-${field.inline ? 'x' : 'y'}-2 ${field.inline ? 'flex' : ''}`}>
        {field.options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              type="radio"
              id={`${field.name}-${option.value}`}
              value={option.value}
              {...register(field.name)}
              disabled={field.disabled || option.disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <label
              htmlFor={`${field.name}-${option.value}`}
              className="ml-2 block text-sm text-gray-900"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {field.helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

/**
 * Date Field
 */
function DateField({
  field,
  register,
  error,
}: {
  field: DateFieldConfig
  register: any
  error?: string
}) {
  return (
    <div className={field.className}>
      <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={field.type}
        id={field.name}
        {...register(field.name)}
        disabled={field.disabled}
        readOnly={field.readOnly}
        min={field.min}
        max={field.max}
        className={`block w-full rounded-md shadow-sm sm:text-sm ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        }`}
      />
      {field.helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

/**
 * Render a single field
 */
function RenderField({
  field,
  register,
  error,
  watch,
  setValue,
}: {
  field: FieldConfig
  register: any
  error?: string
  watch: any
  setValue: any
}) {
  // Check if field should be hidden
  if (field.hidden) {
    if (typeof field.hidden === 'function') {
      const values = watch()
      if (field.hidden(values)) return null
    } else {
      return null
    }
  }

  switch (field.type) {
    case 'text':
    case 'email':
    case 'password':
    case 'tel':
    case 'url':
    case 'number':
      return <TextField field={field as TextFieldConfig} register={register} error={error} />

    case 'textarea':
      return <TextareaField field={field as TextareaFieldConfig} register={register} error={error} />

    case 'select':
      return <SelectField field={field as SelectFieldConfig} register={register} error={error} />

    case 'checkbox':
    case 'switch':
      return <CheckboxField field={field as CheckboxFieldConfig} register={register} error={error} />

    case 'radio':
      return <RadioField field={field as RadioFieldConfig} register={register} error={error} />

    case 'date':
    case 'time':
    case 'datetime-local':
      return <DateField field={field as DateFieldConfig} register={register} error={error} />

    case 'custom':
      const customField = field as CustomFieldConfig
      return (
        <div className={field.className}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {customField.render({
            value: watch(field.name),
            onChange: (value) => setValue(field.name, value),
            error,
            disabled: field.disabled,
          })}
          {field.helpText && !error && (
            <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
          )}
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      )

    default:
      return null
  }
}

/**
 * CommonForm Component
 */
export function CommonForm({
  schema,
  fields,
  defaultValues = {},
  onSubmit,
  submitLabel = 'Submit',
  onCancel,
  cancelLabel = 'Cancel',
  mode = 'inline',
  hooks,
  showRequiredIndicator = true,
  isLoading = false,
  className,
  gridColumns = 1,
}: CommonFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  // Setup React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: schema ? zodResolver(schema as any) : undefined,
    defaultValues,
  })

  // Reset form when defaultValues change
  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  // Handle form submission
  const onSubmitHandler = async (values: Record<string, any>) => {
    try {
      setServerError(null)

      // Call beforeSubmit hook
      let processedValues = values
      if (hooks?.beforeSubmit) {
        processedValues = await hooks.beforeSubmit(values)
      }

      // Submit form
      await onSubmit(processedValues)

      // Call afterSubmit hook
      if (hooks?.afterSubmit) {
        await hooks.afterSubmit(processedValues)
      }
    } catch (error: any) {
      setServerError(error.message || 'An error occurred while submitting the form')

      // Call onError hook
      if (hooks?.onError) {
        hooks.onError(error)
      }
    }
  }

  // Flatten fields if sections
  const flatFields = isSections(fields)
    ? fields.flatMap((section) => section.fields)
    : fields

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className={className} noValidate>
      {/* Server Error Alert */}
      {serverError && (
        <div
          className="mb-6 rounded-md bg-red-50 border border-red-200 p-4"
          role="alert"
          aria-live="polite"
        >
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Failed to submit form</h3>
              <p className="mt-1 text-sm text-red-700">{serverError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Render Sections or Fields */}
      {isSections(fields) ? (
        fields.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-8 border-b border-gray-200 pb-6 last:border-b-0">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
              {section.description && (
                <p className="mt-1 text-sm text-gray-500">{section.description}</p>
              )}
            </div>

            <div
              className={`grid grid-cols-1 ${gridColumns > 1 ? `md:grid-cols-${gridColumns}` : ''} gap-4`}
            >
              {section.fields.map((field) => (
                <div
                  key={field.name}
                  className={field.colSpan ? `md:col-span-${field.colSpan}` : ''}
                >
                  <RenderField
                    field={field}
                    register={register}
                    error={errors[field.name]?.message as string}
                    watch={watch}
                    setValue={setValue}
                  />
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div
          className={`grid grid-cols-1 ${gridColumns > 1 ? `md:grid-cols-${gridColumns}` : ''} gap-4`}
        >
          {fields.map((field) => (
            <div
              key={field.name}
              className={field.colSpan ? `md:col-span-${field.colSpan}` : ''}
            >
              <RenderField
                field={field}
                register={register}
                error={errors[field.name]?.message as string}
                watch={watch}
                setValue={setValue}
              />
            </div>
          ))}
        </div>
      )}

      {/* Form Actions */}
      <div
        className={`flex items-center ${mode === 'modal' ? 'justify-end' : 'justify-between'} gap-3 ${mode === 'page' ? 'pt-6 border-t border-gray-200' : 'pt-4'}`}
      >
        {showRequiredIndicator && (
          <p className="text-sm text-gray-500">
            <span className="text-red-500">*</span> Required fields
          </p>
        )}
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting || isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || isLoading ? (
              <>
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
                Submitting...
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

export default CommonForm

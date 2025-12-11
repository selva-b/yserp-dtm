/**
 * CommonForm Types
 *
 * Type definitions for the reusable form component
 * Supports React Hook Form integration with validation
 */

import { ReactNode } from 'react'
import { z } from 'zod'

// ============================================================================
// Field Types
// ============================================================================

export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'switch'
  | 'radio'
  | 'file'
  | 'custom'

// ============================================================================
// Option Types
// ============================================================================

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

// ============================================================================
// Field Configuration
// ============================================================================

export interface BaseFieldConfig {
  /** Field name (used as form field key) */
  name: string
  /** Field label */
  label: string
  /** Field type */
  type: FieldType
  /** Placeholder text */
  placeholder?: string
  /** Help text shown below field */
  helpText?: string
  /** Field is required */
  required?: boolean
  /** Field is disabled */
  disabled?: boolean
  /** Field is read-only */
  readOnly?: boolean
  /** Custom className */
  className?: string
  /** Grid column span (1-12) */
  colSpan?: number
  /** Hide field conditionally */
  hidden?: boolean | ((values: Record<string, any>) => boolean)
  /** Default value */
  defaultValue?: any
}

export interface TextFieldConfig extends BaseFieldConfig {
  type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number'
  /** Min length */
  minLength?: number
  /** Max length */
  maxLength?: number
  /** Pattern regex */
  pattern?: string
  /** Min value (for number) */
  min?: number
  /** Max value (for number) */
  max?: number
  /** Step value (for number) */
  step?: number
}

export interface TextareaFieldConfig extends BaseFieldConfig {
  type: 'textarea'
  /** Number of rows */
  rows?: number
  /** Min length */
  minLength?: number
  /** Max length */
  maxLength?: number
}

export interface SelectFieldConfig extends BaseFieldConfig {
  type: 'select'
  /** Options for select */
  options: SelectOption[]
  /** Enable search/filter */
  searchable?: boolean
  /** Allow clearing selection */
  clearable?: boolean
}

export interface MultiSelectFieldConfig extends BaseFieldConfig {
  type: 'multiselect'
  /** Options for multi-select */
  options: SelectOption[]
  /** Enable search/filter */
  searchable?: boolean
  /** Max selected items */
  maxSelected?: number
}

export interface CheckboxFieldConfig extends BaseFieldConfig {
  type: 'checkbox' | 'switch'
  /** Checkbox label (different from field label) */
  checkboxLabel?: string
}

export interface RadioFieldConfig extends BaseFieldConfig {
  type: 'radio'
  /** Radio options */
  options: SelectOption[]
  /** Display inline or stacked */
  inline?: boolean
}

export interface FileFieldConfig extends BaseFieldConfig {
  type: 'file'
  /** Accepted file types */
  accept?: string
  /** Allow multiple files */
  multiple?: boolean
  /** Max file size in bytes */
  maxSize?: number
  /** Max number of files (for multiple) */
  maxFiles?: number
}

export interface DateFieldConfig extends BaseFieldConfig {
  type: 'date' | 'time' | 'datetime-local'
  /** Min date/time */
  min?: string
  /** Max date/time */
  max?: string
}

export interface CustomFieldConfig extends BaseFieldConfig {
  type: 'custom'
  /** Custom render function */
  render: (props: {
    value: any
    onChange: (value: any) => void
    error?: string
    disabled?: boolean
  }) => ReactNode
}

export type FieldConfig =
  | TextFieldConfig
  | TextareaFieldConfig
  | SelectFieldConfig
  | MultiSelectFieldConfig
  | CheckboxFieldConfig
  | RadioFieldConfig
  | FileFieldConfig
  | DateFieldConfig
  | CustomFieldConfig

// ============================================================================
// Form Section
// ============================================================================

export interface FormSection {
  /** Section title */
  title: string
  /** Section description */
  description?: string
  /** Fields in this section */
  fields: FieldConfig[]
  /** Collapsible section */
  collapsible?: boolean
  /** Initially collapsed */
  defaultCollapsed?: boolean
}

// ============================================================================
// Form Hooks
// ============================================================================

export interface FormHooks {
  /** Before submit */
  beforeSubmit?: (values: Record<string, any>) => Record<string, any> | Promise<Record<string, any>>
  /** After successful submit */
  afterSubmit?: (result: any) => void | Promise<void>
  /** On error */
  onError?: (error: Error) => void
}

// ============================================================================
// CommonForm Props
// ============================================================================

export interface CommonFormProps {
  /** Zod validation schema (optional) */
  schema?: z.ZodType<any>

  /** Field configurations or sections */
  fields: FieldConfig[] | FormSection[]

  /** Default form values */
  defaultValues?: Record<string, any>

  /** Submit handler */
  onSubmit: (values: Record<string, any>) => void | Promise<void>

  /** Submit button label */
  submitLabel?: string

  /** Cancel handler */
  onCancel?: () => void

  /** Cancel button label */
  cancelLabel?: string

  /** Form mode: modal, page, or inline */
  mode?: 'modal' | 'page' | 'inline'

  /** Form hooks */
  hooks?: FormHooks

  /** Show required indicator */
  showRequiredIndicator?: boolean

  /** Loading state (disables form) */
  isLoading?: boolean

  /** Custom className for form */
  className?: string

  /** Grid columns (default: 1) */
  gridColumns?: number

  /** Enable auto-save */
  autoSave?: boolean

  /** Auto-save delay in ms */
  autoSaveDelay?: number
}

import { useState, useEffect } from 'react'

/**
 * Debounce hook
 *
 * Delays updating the value until after the specified delay has elapsed
 * Useful for search inputs to avoid excessive API calls
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns Debounced value
 *
 * @example
 * const [searchQuery, setSearchQuery] = useState('')
 * const debouncedSearch = useDebounce(searchQuery, 300)
 * // debouncedSearch will only update 300ms after the user stops typing
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up the timeout
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timeout if value changes before delay
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

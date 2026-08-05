import { useState } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Filter, X, ChevronDown, ChevronUp, Search, Calendar, SlidersHorizontal } from 'lucide-react'

export interface FilterOption {
  label: string
  value: string
}

export interface FilterConfig {
  id: string
  label: string
  type: 'search' | 'select' | 'date' | 'multiselect' | 'number' | 'boolean'
  options?: FilterOption[]
  placeholder?: string
  value?: any
}

interface AdvancedFilterProps {
  filters: FilterConfig[]
  onFilterChange: (filters: Record<string, any>) => void
  onReset?: () => void
  showReset?: boolean
  collapsible?: boolean
}

export function AdvancedFilter({
  filters,
  onFilterChange,
  onReset,
  showReset = true,
  collapsible = true
}: AdvancedFilterProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsible)
  const [filterValues, setFilterValues] = useState<Record<string, any>>(
    filters.reduce((acc, filter) => {
      acc[filter.id] = filter.value || ''
      return acc
    }, {} as Record<string, any>)
  )

  const handleFilterChange = (filterId: string, value: any) => {
    const newValues = { ...filterValues, [filterId]: value }
    setFilterValues(newValues)
    onFilterChange(newValues)
  }

  const handleReset = () => {
    const resetValues = filters.reduce((acc, filter) => {
      acc[filter.id] = filter.type === 'multiselect' ? [] : ''
      return acc
    }, {} as Record<string, any>)
    setFilterValues(resetValues)
    onFilterChange(resetValues)
    onReset?.()
  }

  const hasActiveFilters = Object.values(filterValues).some(
    value => value !== '' && value !== null && value !== undefined && 
    (Array.isArray(value) ? value.length > 0 : true)
  )

  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'search':
        return (
          <div key={filter.id} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
              value={filterValues[filter.id] || ''}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
              className="pl-10"
            />
          </div>
        )

      case 'select':
        return (
          <select
            key={filter.id}
            value={filterValues[filter.id] || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All {filter.label}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <div key={filter.id} className="space-y-2">
            <label className="text-sm font-medium">{filter.label}</label>
            <div className="flex flex-wrap gap-2">
              {filter.options?.map((option) => {
                const isSelected = Array.isArray(filterValues[filter.id]) 
                  ? filterValues[filter.id].includes(option.value)
                  : false
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      const current = Array.isArray(filterValues[filter.id]) 
                        ? filterValues[filter.id] 
                        : []
                      const newValue = isSelected
                        ? current.filter((v: string) => v !== option.value)
                        : [...current, option.value]
                      handleFilterChange(filter.id, newValue)
                    }}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 'date':
        return (
          <div key={filter.id} className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={filterValues[filter.id] || ''}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
              className="pl-10"
            />
          </div>
        )

      case 'number':
        return (
          <div key={filter.id} className="relative">
            <Input
              type="number"
              placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}...`}
              value={filterValues[filter.id] || ''}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            />
          </div>
        )

      case 'boolean':
        return (
          <div key={filter.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={filter.id}
              checked={filterValues[filter.id] || false}
              onChange={(e) => handleFilterChange(filter.id, e.target.checked)}
              className="rounded"
            />
            <label htmlFor={filter.id} className="text-sm">{filter.label}</label>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                {Object.values(filterValues).filter(
                  value => value !== '' && value !== null && value !== undefined &&
                  (Array.isArray(value) ? value.length > 0 : true)
                ).length}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {showReset && hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filters.map(renderFilter)}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

'use client'

import { Search, Filter } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { Badge } from '@/shared/ui/Badge'

interface SearchFiltersProps {
    onSearchChange: (term: string) => void
    onStatusFilterChange: (status: string[]) => void
    totalLocations: number
}

const STATUSES = ['Available', 'In Use', 'Suspended'] as const

export function SearchFilters({ onSearchChange, onStatusFilterChange, totalLocations }: SearchFiltersProps) {
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
    const [searchInput, setSearchInput] = useState('')

    const handleStatusToggle = useCallback((status: string) => {
        setSelectedStatuses(prev => {
            const normalizedStatus = status.toLowerCase()
            const newStatuses = prev.includes(normalizedStatus)
                ? prev.filter(s => s !== normalizedStatus)
                : [...prev, normalizedStatus]
            return newStatuses
        })
    }, [])

    // Use useEffect to notify parent of status changes
    useEffect(() => {
        onStatusFilterChange(selectedStatuses)
    }, [selectedStatuses, onStatusFilterChange])

    const handleSearchDebounced = useCallback(
        debounce((value: string) => {
            onSearchChange(value.toLowerCase().trim())
        }, 300),
        [onSearchChange]
    )

    const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchInput(value)
        handleSearchDebounced(value)
    }, [handleSearchDebounced])


    return (
        <div className="space-y-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        value={searchInput}
                        placeholder="Search by location name or address..."
                        className="w-full pl-10 pr-4 py-2 border rounded-md bg-white"
                        onChange={handleSearchInputChange}
                        aria-label="Search locations"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {STATUSES.map(status => (
                        <Badge
                            key={status}
                            variant={selectedStatuses.includes(status.toLowerCase()) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => handleStatusToggle(status)}
                            role="checkbox"
                            aria-checked={selectedStatuses.includes(status.toLowerCase())}
                            tabIndex={0}
                        >
                            {status}
                        </Badge>
                    ))}
                </div>
            </div>
            <p className="text-sm text-gray-600">
                Showing {totalLocations} locations
            </p>
        </div>
    )
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn(...args), delay)
    }
}
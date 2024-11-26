'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { MapPin, BatteryCharging, Info, WifiOff } from 'lucide-react'
import type { Location } from '@/types'
import { SearchFilters } from './SearchFilters'

interface ColorOutput {
    rgb: string;
    class: string;
}

export function EVChargingMap() {
    const [locations, setLocations] = useState<Location[]>([])
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isOffline, setIsOffline] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilters, setStatusFilters] = useState<string[]>([])

    const getStatusColorDual = (status?: string): ColorOutput => {
        if (!status) {
            return {
                rgb: 'rgb(107, 114, 128)',
                class: 'bg-gray-500'
            };
        }

        const normalizedStatus = status.toLowerCase().trim();

        const colorMap: Record<string, ColorOutput> = {
            'available': {
                rgb: 'rgb(34, 197, 94)',
                class: 'bg-green-500'
            },
            'in use': {
                rgb: 'rgb(59, 130, 246)',
                class: 'bg-blue-500'
            },
            'suspended': {
                rgb: 'rgb(239, 68, 68)',
                class: 'bg-red-500'
            }
        };

        return colorMap[normalizedStatus] || { rgb: 'rgb(107, 114, 128)', class: 'bg-gray-500' };
    }

    const getStatusText = (status?: string) => {
        return status || 'Unknown'
    }

    // Calculate map boundaries
    const bounds = locations.length > 0 ? locations.reduce((acc, location) => {
        return {
            minLat: Math.min(acc.minLat, location.coordinates.lat),
            maxLat: Math.max(acc.maxLat, location.coordinates.lat),
            minLon: Math.min(acc.minLon, location.coordinates.lon),
            maxLon: Math.max(acc.maxLon, location.coordinates.lon),
        }
    }, {
        minLat: Infinity,
        maxLat: -Infinity,
        minLon: Infinity,
        maxLon: -Infinity,
    }) : {
        minLat: 0,
        maxLat: 1,
        minLon: 0,
        maxLon: 1,
    };

    const getPixelCoordinates = (lat: number, lon: number) => {
        if (!locations.length) return { x: 0, y: 0 };

        const padding = 40;
        const width = 800 - (padding * 2);
        const height = 600 - (padding * 2);

        // Avoid division by zero
        const latRange = bounds.maxLat - bounds.minLat || 1;
        const lonRange = bounds.maxLon - bounds.minLon || 1;

        const x = ((lon - bounds.minLon) / lonRange * width) + padding;
        const y = (1 - (lat - bounds.minLat) / latRange) * height + padding;

        return { x, y };
    }

    const { class: selectedBgClass } = getStatusColorDual(selectedLocation?.status);
    const handleSearchChange = useCallback((term: string) => {
        setSearchTerm(term)
    }, [])

    const handleStatusFilterChange = useCallback((statuses: string[]) => {
        setStatusFilters(statuses)
    }, [])


    const filteredLocations = useMemo(() => {
        return locations.filter(location => {
            const searchMatches = searchTerm === '' || [
                location.address.name,
                location.address.street,
                location.address.city,
                location.address.zipCode,
            ].some(field =>
                field?.toLowerCase().includes(searchTerm.toLowerCase())
            );

            const locationStatus = location.status?.toLowerCase() || 'unknown';
            const statusMatches =
                statusFilters.length === 0 ||
                statusFilters.some(filter => {
                    const normalizedFilter = filter.toLowerCase();
                    return locationStatus === normalizedFilter;
                });

            return searchMatches && statusMatches
        })
    }, [locations, searchTerm, statusFilters])

    // Monitor online status
    useEffect(() => {
        setIsOffline(!window.navigator.onLine)
        const handleOnline = () => setIsOffline(false)
        const handleOffline = () => setIsOffline(true)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])


    useEffect(() => {
        const fetchLocations = async () => {
            try {
                setLoading(true)

                if (typeof window !== 'undefined' && window.navigator.onLine) {
                    const response = await fetch('/api/locations')
                    if (!response.ok) throw new Error('Failed to fetch locations')
                    const data = await response.json()
                    setLocations(data.locations)

                    // Update cache
                    try {
                        const cache = await caches.open('ev-locations')
                        await cache.put('/api/locations', new Response(JSON.stringify(data)))
                    } catch (cacheError) {
                        console.error('Cache error:', cacheError)
                    }
                } else {
                    // Try to get from cache
                    const cached = await caches.match('/api/locations')
                    if (cached) {
                        const data = await cached.json()
                        setLocations(data.locations)
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
                setLoading(false)
            }
        }


        fetchLocations()
    }, [])


    if (loading) {
        return (
            <Card className="w-full max-w-4xl">
                <CardContent className="p-8">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="w-full max-w-4xl">
                <CardContent className="p-8">
                    <div className="text-red-500 text-center">{error}</div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-4xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BatteryCharging className="w-6 h-6" />
                    EV Charging Locations
                    {isOffline && (
                        <Badge variant="destructive" className="ml-2">
                            <WifiOff className="w-4 h-4 mr-1" />
                            Offline
                        </Badge>
                    )}
                </CardTitle>

                {!loading && !error && locations && (
                    <>
                        <SearchFilters
                            onSearchChange={handleSearchChange}
                            onStatusFilterChange={handleStatusFilterChange}
                            totalLocations={filteredLocations.length}
                        />

                        <div className="flex gap-4 mt-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                Available
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                In Use
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                Suspended
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-gray-500" />
                                Unknown
                            </Badge>
                        </div>
                    </>
                )}
            </CardHeader>

            <CardContent>
                <div className="relative w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden">
                    {/* Map visualization */}
                    <svg width="800" height="600" className="w-full h-full">
                        {filteredLocations?.map((location) => {
                            const { x, y } = getPixelCoordinates(
                                location.coordinates.lat,
                                location.coordinates.lon
                            )
                            const { rgb: fillColor, class: bgClass } = getStatusColorDual(location.status);
                            return (
                                <g
                                    key={location.locationId}
                                    transform={`translate(${x},${y})`}
                                    className="cursor-pointer"
                                    onClick={() => setSelectedLocation(location)}
                                >
                                    <circle
                                        r="8"
                                        className={`${bgClass} stroke-white`}
                                        strokeWidth="2"
                                        fill={fillColor}
                                    />
                                </g>
                            )
                        })}
                    </svg>

                    {/* Location details popup */}
                    {selectedLocation && (
                        <div className="absolute bottom-4 left-4 p-4 bg-white rounded-lg shadow-lg max-w-md">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {selectedLocation.address.name}
                                </h3>
                                <button
                                    onClick={() => setSelectedLocation(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="space-y-2 text-sm">
                                <p>{selectedLocation.address.street}</p>
                                <p>{selectedLocation.address.zipCode} {selectedLocation.address.city}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge className={selectedBgClass}>
                                        {getStatusText(selectedLocation.status)}
                                    </Badge>
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        {selectedLocation.maxPower}kW
                                    </Badge>
                                    <Badge variant="outline">
                                        {selectedLocation.connectorType}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>


        </Card>
    )
}
/**
 * 地点管理组合式函数
 * Location management composable
 */

import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { usePlanStore } from '@/stores/planStore'
import { locationService, type LocationFormData } from '@/services/locationService'
import type { Location, LocationType } from '@/types'

export function useLocationManagement() {
    const planStore = usePlanStore()

    // State
    const isLoading = ref(false)
    const selectedLocation = ref<Location | null>(null)
    const showLocationForm = ref(false)

    // Computed
    const locations = computed(() => planStore.currentLocations)
    const startLocation = computed(() => planStore.startLocation)
    const endLocation = computed(() => planStore.endLocation)
    const waypointLocations = computed(() => planStore.waypointLocations)

    const locationsByType = computed(() => locationService.getLocationsByType())
    const locationsByDay = computed(() => locationService.getLocationsByDay())

    const canAddStart = computed(() => locationService.canAddLocationType('start'))
    const canAddEnd = computed(() => locationService.canAddLocationType('end'))

    // Methods
    const addLocation = async (data: LocationFormData) => {
        isLoading.value = true
        try {
            const result = await locationService.addLocation(data)
            if (result.success) {
                ElMessage.success('地点添加成功')
                showLocationForm.value = false
                return true
            } else {
                ElMessage.error(result.error || '添加地点失败')
                return false
            }
        } catch (error) {
            ElMessage.error('添加地点失败')
            console.error('Add location error:', error)
            return false
        } finally {
            isLoading.value = false
        }
    }

    const updateLocation = async (locationId: string, data: LocationFormData) => {
        isLoading.value = true
        try {
            const result = await locationService.updateLocation(locationId, data)
            if (result.success) {
                ElMessage.success('地点更新成功')
                showLocationForm.value = false
                selectedLocation.value = null
                return true
            } else {
                ElMessage.error(result.error || '更新地点失败')
                return false
            }
        } catch (error) {
            ElMessage.error('更新地点失败')
            console.error('Update location error:', error)
            return false
        } finally {
            isLoading.value = false
        }
    }

    const deleteLocation = async (locationId: string) => {
        isLoading.value = true
        try {
            const result = await locationService.deleteLocation(locationId)
            if (result.success) {
                ElMessage.success('地点删除成功')
                selectedLocation.value = null
                showLocationForm.value = false
                return true
            } else {
                ElMessage.error(result.error || '删除地点失败')
                return false
            }
        } catch (error) {
            ElMessage.error('删除地点失败')
            console.error('Delete location error:', error)
            return false
        } finally {
            isLoading.value = false
        }
    }

    const selectLocation = (location: Location) => {
        selectedLocation.value = location
    }

    const editLocation = (location: Location) => {
        selectedLocation.value = location
        showLocationForm.value = true
    }

    const openAddLocationForm = () => {
        selectedLocation.value = null
        showLocationForm.value = true
    }

    const closeLocationForm = () => {
        selectedLocation.value = null
        showLocationForm.value = false
    }

    const getLocationById = (id: string) => {
        return locationService.getLocationById(id)
    }

    const getLocationTypeLabel = (type: LocationType) => {
        return locationService.getLocationTypeLabel(type)
    }

    const formatCoordinates = (coordinates: { lat: number; lng: number }) => {
        return locationService.formatCoordinates(coordinates)
    }

    const calculateDistance = (coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }) => {
        return locationService.calculateDistance(coord1, coord2)
    }

    const validateLocationData = (data: LocationFormData, existingLocationId?: string) => {
        return locationService.validateLocation(data, existingLocationId)
    }

    // Handle form submission
    const handleLocationSubmit = async (data: LocationFormData) => {
        if (selectedLocation.value) {
            return await updateLocation(selectedLocation.value.id, data)
        } else {
            return await addLocation(data)
        }
    }

    // Handle form cancellation
    const handleLocationCancel = () => {
        closeLocationForm()
    }

    // Handle location deletion
    const handleLocationDelete = async (locationId: string) => {
        return await deleteLocation(locationId)
    }

    // Get locations for a specific day
    const getLocationsForDay = (day: number): Location[] => {
        return locations.value.filter(loc => loc.dayNumber === day)
    }

    // Get unassigned locations (no day number)
    const getUnassignedLocations = (): Location[] => {
        return locations.value.filter(loc => !loc.dayNumber)
    }

    // Assign location to a day
    const assignLocationToDay = async (locationId: string, dayNumber: number) => {
        const location = getLocationById(locationId)
        if (!location) return false

        const data: LocationFormData = {
            name: location.name,
            type: location.type,
            coordinates: location.coordinates,
            address: location.address,
            description: location.description,
            tags: location.tags,
            dayNumber,
            visitDuration: location.visitDuration
        }

        return await updateLocation(locationId, data)
    }

    // Remove location from day assignment
    const removeLocationFromDay = async (locationId: string) => {
        const location = getLocationById(locationId)
        if (!location) return false

        const data: LocationFormData = {
            name: location.name,
            type: location.type,
            coordinates: location.coordinates,
            address: location.address,
            description: location.description,
            tags: location.tags,
            dayNumber: undefined,
            visitDuration: location.visitDuration
        }

        return await updateLocation(locationId, data)
    }

    // Get location statistics
    const getLocationStats = () => {
        const total = locations.value.length
        const byType = locationsByType.value
        const assigned = locations.value.filter(loc => loc.dayNumber).length
        const unassigned = total - assigned

        return {
            total,
            start: byType.start.length,
            waypoint: byType.waypoint.length,
            end: byType.end.length,
            assigned,
            unassigned
        }
    }

    return {
        // State
        isLoading,
        selectedLocation,
        showLocationForm,

        // Computed
        locations,
        startLocation,
        endLocation,
        waypointLocations,
        locationsByType,
        locationsByDay,
        canAddStart,
        canAddEnd,

        // Methods
        addLocation,
        updateLocation,
        deleteLocation,
        selectLocation,
        editLocation,
        openAddLocationForm,
        closeLocationForm,
        getLocationById,
        getLocationTypeLabel,
        formatCoordinates,
        calculateDistance,
        validateLocationData,

        // Form handlers
        handleLocationSubmit,
        handleLocationCancel,
        handleLocationDelete,

        // Day management
        getLocationsForDay,
        getUnassignedLocations,
        assignLocationToDay,
        removeLocationFromDay,

        // Statistics
        getLocationStats
    }
}
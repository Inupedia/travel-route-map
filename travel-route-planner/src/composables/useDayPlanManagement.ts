/**
 * 多日行程规划管理组合式函数
 * Day plan management composable
 */

import { ref, computed } from 'vue'
import { usePlanStore } from '@/stores/planStore'
import { useUIStore } from '@/stores/uiStore'
import type { Location, LocationType } from '@/types'

export function useDayPlanManagement() {
    const planStore = usePlanStore()
    const uiStore = useUIStore()

    // Local state
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Computed
    const currentPlan = computed(() => planStore.currentPlan)
    const locations = computed(() => planStore.currentLocations)
    const routes = computed(() => planStore.currentRoutes)
    const selectedDay = computed(() => uiStore.selectedDay)

    // Day colors for visual distinction
    const dayColors = [
        '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
        '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'
    ]

    // Methods
    const getDayColor = (day: number): string => {
        return dayColors[(day - 1) % dayColors.length]
    }

    const getDayLocations = (day: number): Location[] => {
        return locations.value.filter(location => location.dayNumber === day)
    }

    const getUnassignedLocations = (): Location[] => {
        return locations.value.filter(location => !location.dayNumber)
    }

    const getDayStats = (day: number) => {
        const dayLocations = getDayLocations(day)
        const dayRoutes = routes.value.filter(route => route.dayNumber === day)

        const totalLocations = dayLocations.length
        const totalDuration = dayLocations.reduce((sum, location) => {
            return sum + (location.visitDuration || 0)
        }, 0)
        const totalDistance = dayRoutes.reduce((sum, route) => {
            return sum + route.distance
        }, 0)

        return {
            totalLocations,
            totalDuration,
            totalDistance: Number(totalDistance.toFixed(1))
        }
    }

    const getAllDaysStats = () => {
        if (!currentPlan.value) return []

        const stats = []
        for (let day = 1; day <= currentPlan.value.totalDays; day++) {
            stats.push({
                day,
                ...getDayStats(day),
                color: getDayColor(day)
            })
        }
        return stats
    }

    const assignLocationToDay = async (locationId: string, dayNumber: number): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            if (!currentPlan.value) {
                throw new Error('没有当前规划')
            }

            if (dayNumber < 1 || dayNumber > currentPlan.value.totalDays) {
                throw new Error('天数超出范围')
            }

            planStore.updateLocation(locationId, { dayNumber })
            await updateRouteDayNumbers()

            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : '分配地点失败'
            return false
        } finally {
            isLoading.value = false
        }
    }

    const assignMultipleLocationsToDay = async (locationIds: string[], dayNumber: number): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            if (!currentPlan.value) {
                throw new Error('没有当前规划')
            }

            if (dayNumber < 1 || dayNumber > currentPlan.value.totalDays) {
                throw new Error('天数超出范围')
            }

            // 批量更新地点
            locationIds.forEach(locationId => {
                planStore.updateLocation(locationId, { dayNumber })
            })

            await updateRouteDayNumbers()

            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : '批量分配地点失败'
            return false
        } finally {
            isLoading.value = false
        }
    }

    const removeLocationFromDay = async (locationId: string): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            planStore.updateLocation(locationId, { dayNumber: undefined })
            await updateRouteDayNumbers()

            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : '移除地点失败'
            return false
        } finally {
            isLoading.value = false
        }
    }

    const updateTotalDays = async (newTotalDays: number): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            if (!currentPlan.value) {
                throw new Error('没有当前规划')
            }

            if (newTotalDays < 1 || newTotalDays > 30) {
                throw new Error('天数必须在1-30之间')
            }

            const currentTotalDays = currentPlan.value.totalDays

            // 如果减少天数，需要处理超出天数的地点
            if (newTotalDays < currentTotalDays) {
                const affectedLocations = locations.value.filter(
                    location => location.dayNumber && location.dayNumber > newTotalDays
                )

                // 移除超出天数的地点的天数分配
                affectedLocations.forEach(location => {
                    planStore.updateLocation(location.id, { dayNumber: undefined })
                })
            }

            // 更新总天数
            currentPlan.value.totalDays = newTotalDays
            currentPlan.value.updatedAt = new Date()

            // 如果当前选中的天数超出了新的总天数，重置为第1天
            if (selectedDay.value > newTotalDays) {
                uiStore.setSelectedDay(1)
            }

            await updateRouteDayNumbers()

            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : '更新天数失败'
            return false
        } finally {
            isLoading.value = false
        }
    }

    const reorderLocationsInDay = async (day: number, locationIds: string[]): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            // 更新地点顺序（可以添加一个 order 字段来记录顺序）
            locationIds.forEach((locationId, index) => {
                planStore.updateLocation(locationId, {
                    dayNumber: day,
                    // order: index + 1 // 如果需要记录顺序
                })
            })

            await updateRouteDayNumbers()

            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : '重新排序失败'
            return false
        } finally {
            isLoading.value = false
        }
    }

    const updateRouteDayNumbers = async (): Promise<void> => {
        // 更新路线的天数分配
        routes.value.forEach(route => {
            const fromLocation = locations.value.find(loc => loc.id === route.fromLocationId)
            const toLocation = locations.value.find(loc => loc.id === route.toLocationId)

            if (fromLocation?.dayNumber && toLocation?.dayNumber &&
                fromLocation.dayNumber === toLocation.dayNumber) {
                planStore.updateRoute(route.id, { dayNumber: fromLocation.dayNumber })
            } else {
                // 如果起点和终点不在同一天，移除路线的天数分配
                planStore.updateRoute(route.id, { dayNumber: 0 })
            }
        })
    }

    const getLocationTypeLabel = (type: LocationType): string => {
        switch (type) {
            case 'start':
                return '出发点'
            case 'end':
                return '终点'
            case 'waypoint':
                return '途经点'
            default:
                return '未知'
        }
    }

    const getLocationTypeTagType = (type: LocationType) => {
        switch (type) {
            case 'start':
                return 'success'
            case 'end':
                return 'danger'
            case 'waypoint':
                return 'info'
            default:
                return 'info'
        }
    }

    const formatCoordinates = (coordinates: { lat: number; lng: number }): string => {
        return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
    }

    const selectDay = (day: number) => {
        if (currentPlan.value && day >= 1 && day <= currentPlan.value.totalDays) {
            uiStore.setSelectedDay(day)
        }
    }

    const getOptimalDayAssignment = (): { [locationId: string]: number } => {
        // 简单的自动分配算法：按地点类型和创建时间分配
        const unassigned = getUnassignedLocations()
        const assignment: { [locationId: string]: number } = {}

        if (!currentPlan.value || unassigned.length === 0) {
            return assignment
        }

        const totalDays = currentPlan.value.totalDays
        const locationsPerDay = Math.ceil(unassigned.length / totalDays)

        // 按类型排序：出发点 -> 途经点 -> 终点
        const sortedLocations = [...unassigned].sort((a, b) => {
            const typeOrder = { 'start': 0, 'waypoint': 1, 'end': 2 }
            const aOrder = typeOrder[a.type] ?? 1
            const bOrder = typeOrder[b.type] ?? 1

            if (aOrder !== bOrder) {
                return aOrder - bOrder
            }

            return a.createdAt.getTime() - b.createdAt.getTime()
        })

        // 分配到各天
        sortedLocations.forEach((location, index) => {
            const day = Math.floor(index / locationsPerDay) + 1
            assignment[location.id] = Math.min(day, totalDays)
        })

        return assignment
    }

    const autoAssignLocations = async (): Promise<boolean> => {
        try {
            isLoading.value = true
            error.value = null

            const assignment = getOptimalDayAssignment()

            for (const [locationId, dayNumber] of Object.entries(assignment)) {
                planStore.updateLocation(locationId, { dayNumber })
            }

            await updateRouteDayNumbers()

            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : '自动分配失败'
            return false
        } finally {
            isLoading.value = false
        }
    }

    const clearError = () => {
        error.value = null
    }

    return {
        // State
        isLoading,
        error,

        // Computed
        currentPlan,
        locations,
        routes,
        selectedDay,

        // Methods
        getDayColor,
        getDayLocations,
        getUnassignedLocations,
        getDayStats,
        getAllDaysStats,
        assignLocationToDay,
        assignMultipleLocationsToDay,
        removeLocationFromDay,
        updateTotalDays,
        reorderLocationsInDay,
        updateRouteDayNumbers,
        getLocationTypeLabel,
        getLocationTypeTagType,
        formatCoordinates,
        selectDay,
        getOptimalDayAssignment,
        autoAssignLocations,
        clearError
    }
}
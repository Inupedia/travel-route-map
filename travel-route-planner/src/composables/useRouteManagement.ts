/**
 * 路线管理组合式函数
 * Route management composable
 */

import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePlanStore } from '@/stores/planStore'
import { routeCalculator, type RouteCalculationResult } from '@/services/routeCalculator'
import type { Location, Route, TransportMode } from '@/types'
import { TransportMode as TM } from '@/types'

export interface RouteManagementOptions {
    autoConnect?: boolean
    defaultTransportMode?: TransportMode
    optimizeOrder?: boolean
}

export function useRouteManagement(options: RouteManagementOptions = {}) {
    const planStore = usePlanStore()

    // State
    const isCalculating = ref(false)
    const calculationError = ref<string | null>(null)
    const selectedRoute = ref<Route | null>(null)
    const autoConnectEnabled = ref(options.autoConnect ?? true)
    const defaultTransportMode = ref(options.defaultTransportMode ?? TM.DRIVING)
    const optimizeOrderEnabled = ref(options.optimizeOrder ?? false)

    // Computed
    const locations = computed(() => planStore.currentLocations)
    const routes = computed(() => planStore.currentRoutes)
    const startLocation = computed(() => planStore.startLocation)
    const endLocation = computed(() => planStore.endLocation)
    const waypointLocations = computed(() => planStore.waypointLocations)

    const orderedLocations = computed(() => {
        const ordered: Location[] = []

        if (startLocation.value) {
            ordered.push(startLocation.value)
        }

        // Add waypoints sorted by day number and creation time
        const waypoints = [...waypointLocations.value].sort((a, b) => {
            if (a.dayNumber !== b.dayNumber) {
                return (a.dayNumber || 0) - (b.dayNumber || 0)
            }
            return a.createdAt.getTime() - b.createdAt.getTime()
        })
        ordered.push(...waypoints)

        if (endLocation.value) {
            ordered.push(endLocation.value)
        }

        return ordered
    })

    const routesByDay = computed(() => {
        const byDay: Record<number, Route[]> = {}

        routes.value.forEach(route => {
            const day = route.dayNumber || 1
            if (!byDay[day]) {
                byDay[day] = []
            }
            byDay[day].push(route)
        })

        return byDay
    })

    const totalDistance = computed(() => {
        return routes.value.reduce((sum, route) => sum + route.distance, 0)
    })

    const totalDuration = computed(() => {
        return routes.value.reduce((sum, route) => sum + route.duration, 0)
    })

    const routeStats = computed(() => {
        const stats = {
            totalRoutes: routes.value.length,
            totalDistance: totalDistance.value,
            totalDuration: totalDuration.value,
            averageDistance: routes.value.length > 0 ? totalDistance.value / routes.value.length : 0,
            averageDuration: routes.value.length > 0 ? totalDuration.value / routes.value.length : 0,
            byTransportMode: {} as Record<TransportMode, { count: number; distance: number; duration: number }>
        }

        // Calculate stats by transport mode
        Object.values(TM).forEach(mode => {
            const modeRoutes = routes.value.filter(r => r.transportMode === mode)
            stats.byTransportMode[mode] = {
                count: modeRoutes.length,
                distance: modeRoutes.reduce((sum, r) => sum + r.distance, 0),
                duration: modeRoutes.reduce((sum, r) => sum + r.duration, 0)
            }
        })

        return stats
    })

    // Methods
    const calculateRoute = async (
        from: Location,
        to: Location,
        transportMode: TransportMode = defaultTransportMode.value
    ): Promise<RouteCalculationResult | null> => {
        try {
            isCalculating.value = true
            calculationError.value = null

            const result = await routeCalculator.calculateRoute(from, to, transportMode)
            return result
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '路线计算失败'
            calculationError.value = errorMessage
            ElMessage.error(errorMessage)
            return null
        } finally {
            isCalculating.value = false
        }
    }

    const addRoute = async (
        fromLocationId: string,
        toLocationId: string,
        transportMode: TransportMode = defaultTransportMode.value,
        dayNumber: number = 1
    ): Promise<boolean> => {
        try {
            const fromLocation = locations.value.find(l => l.id === fromLocationId)
            const toLocation = locations.value.find(l => l.id === toLocationId)

            if (!fromLocation || !toLocation) {
                ElMessage.error('找不到指定的地点')
                return false
            }

            // Check if route already exists
            const existingRoute = routes.value.find(
                r => r.fromLocationId === fromLocationId && r.toLocationId === toLocationId
            )

            if (existingRoute) {
                ElMessage.warning('该路线已存在')
                return false
            }

            const result = await calculateRoute(fromLocation, toLocation, transportMode)
            if (!result) {
                return false
            }

            const routeData: Omit<Route, 'id'> = {
                fromLocationId,
                toLocationId,
                distance: result.distance,
                duration: result.duration,
                transportMode: result.transportMode,
                path: result.path,
                dayNumber
            }

            planStore.addRoute(routeData)
            return true
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '添加路线失败'
            ElMessage.error(errorMessage)
            return false
        }
    }

    const updateRoute = async (
        routeId: string,
        updates: Partial<Route>
    ): Promise<boolean> => {
        try {
            const route = routes.value.find(r => r.id === routeId)
            if (!route) {
                ElMessage.error('找不到指定的路线')
                return false
            }

            // If transport mode changed, recalculate
            if (updates.transportMode && updates.transportMode !== route.transportMode) {
                const fromLocation = locations.value.find(l => l.id === route.fromLocationId)
                const toLocation = locations.value.find(l => l.id === route.toLocationId)

                if (fromLocation && toLocation) {
                    const result = await calculateRoute(fromLocation, toLocation, updates.transportMode)
                    if (result) {
                        updates.distance = result.distance
                        updates.duration = result.duration
                        updates.path = result.path
                    }
                }
            }

            planStore.updateRoute(routeId, updates)
            return true
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '更新路线失败'
            ElMessage.error(errorMessage)
            return false
        }
    }

    const removeRoute = (routeId: string): boolean => {
        try {
            planStore.removeRoute(routeId)
            if (selectedRoute.value?.id === routeId) {
                selectedRoute.value = null
            }
            return true
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '删除路线失败'
            ElMessage.error(errorMessage)
            return false
        }
    }

    const connectAllLocations = async (
        transportMode: TransportMode = defaultTransportMode.value
    ): Promise<boolean> => {
        try {
            if (orderedLocations.value.length < 2) {
                ElMessage.warning('至少需要两个地点才能连接路线')
                return false
            }

            isCalculating.value = true
            calculationError.value = null

            // Clear existing routes
            routes.value.forEach(route => {
                planStore.removeRoute(route.id)
            })

            // Calculate routes between consecutive locations
            const results = await routeCalculator.calculateMultipleRoutes(
                orderedLocations.value,
                transportMode
            )

            // Add all calculated routes
            for (const routeData of results) {
                planStore.addRoute(routeData)
            }

            ElMessage.success(`成功连接 ${results.length} 条路线`)
            return true
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '自动连接路线失败'
            calculationError.value = errorMessage
            ElMessage.error(errorMessage)
            return false
        } finally {
            isCalculating.value = false
        }
    }

    const optimizeRouteOrder = async (
        transportMode: TransportMode = defaultTransportMode.value
    ): Promise<boolean> => {
        try {
            if (!startLocation.value && waypointLocations.value.length === 0) {
                ElMessage.warning('需要至少一个出发点或途经点才能优化路线')
                return false
            }

            isCalculating.value = true
            calculationError.value = null

            let optimizedOrder: Location[]

            if (startLocation.value) {
                // 有出发点的情况
                optimizedOrder = await routeCalculator.optimizeRouteOrder(
                    startLocation.value,
                    waypointLocations.value,
                    endLocation.value,
                    transportMode
                )
            } else {
                // 没有出发点，只优化途经点
                const result = await routeCalculator.smartConnectLocations(locations.value, transportMode)
                optimizedOrder = result.order
            }

            // Update location order based on optimization
            optimizedOrder.forEach((location, index) => {
                if (location.type === 'waypoint') {
                    planStore.updateLocation(location.id, {
                        ...location,
                        // Use index as a simple ordering mechanism
                        updatedAt: new Date(Date.now() + index * 1000)
                    })
                }
            })

            // Reconnect all locations with new order
            await connectAllLocations(transportMode)

            ElMessage.success('路线顺序优化完成')
            return true
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '路线优化失败'
            calculationError.value = errorMessage
            ElMessage.error(errorMessage)
            return false
        } finally {
            isCalculating.value = false
        }
    }

    const recalculateAllRoutes = async (
        transportMode?: TransportMode
    ): Promise<boolean> => {
        try {
            if (routes.value.length === 0) {
                ElMessage.warning('没有路线需要重新计算')
                return false
            }

            isCalculating.value = true
            calculationError.value = null

            const mode = transportMode || defaultTransportMode.value
            let successCount = 0

            for (const route of routes.value) {
                const fromLocation = locations.value.find(l => l.id === route.fromLocationId)
                const toLocation = locations.value.find(l => l.id === route.toLocationId)

                if (fromLocation && toLocation) {
                    const result = await calculateRoute(fromLocation, toLocation, mode)
                    if (result) {
                        planStore.updateRoute(route.id, {
                            distance: result.distance,
                            duration: result.duration,
                            transportMode: result.transportMode,
                            path: result.path
                        })
                        successCount++
                    }
                }
            }

            if (successCount > 0) {
                ElMessage.success(`成功重新计算 ${successCount} 条路线`)
                return true
            } else {
                ElMessage.error('没有路线计算成功')
                return false
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '重新计算路线失败'
            calculationError.value = errorMessage
            ElMessage.error(errorMessage)
            return false
        } finally {
            isCalculating.value = false
        }
    }

    const changeTransportMode = async (
        newMode: TransportMode,
        routeIds?: string[]
    ): Promise<boolean> => {
        try {
            const targetRoutes = routeIds
                ? routes.value.filter(r => routeIds.includes(r.id))
                : routes.value

            if (targetRoutes.length === 0) {
                ElMessage.warning('没有路线需要更改交通方式')
                return false
            }

            isCalculating.value = true
            let successCount = 0

            for (const route of targetRoutes) {
                const success = await updateRoute(route.id, { transportMode: newMode })
                if (success) {
                    successCount++
                }
            }

            if (successCount > 0) {
                ElMessage.success(`成功更改 ${successCount} 条路线的交通方式`)
                return true
            } else {
                ElMessage.error('没有路线更改成功')
                return false
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '更改交通方式失败'
            ElMessage.error(errorMessage)
            return false
        } finally {
            isCalculating.value = false
        }
    }

    const clearAllRoutes = async (): Promise<boolean> => {
        try {
            const result = await ElMessageBox.confirm(
                '确定要清除所有路线吗？此操作不可撤销。',
                '确认清除',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )

            if (result === 'confirm') {
                routes.value.forEach(route => {
                    planStore.removeRoute(route.id)
                })
                selectedRoute.value = null
                ElMessage.success('已清除所有路线')
                return true
            }
            return false
        } catch {
            return false
        }
    }

    const getRouteById = (routeId: string): Route | null => {
        return routes.value.find(r => r.id === routeId) || null
    }

    const getRoutesForDay = (dayNumber: number): Route[] => {
        return routes.value.filter(r => r.dayNumber === dayNumber)
    }

    const getRoutesBetweenLocations = (fromId: string, toId: string): Route[] => {
        return routes.value.filter(
            r => r.fromLocationId === fromId && r.toLocationId === toId
        )
    }

    const formatDistance = (distance: number): string => {
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m`
        }
        return `${distance.toFixed(1)}km`
    }

    const formatDuration = (duration: number): string => {
        if (duration < 60) {
            return `${duration}分钟`
        }
        const hours = Math.floor(duration / 60)
        const minutes = duration % 60
        return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`
    }

    const getTransportModeLabel = (mode: TransportMode): string => {
        const labels = {
            [TM.WALKING]: '步行',
            [TM.DRIVING]: '驾车',
            [TM.TRANSIT]: '公交'
        }
        return labels[mode] || mode
    }

    const validateRoute = (route: Partial<Route>): { isValid: boolean; errors: string[] } => {
        return routeCalculator.validateRoute(route)
    }

    // Watch for location changes and auto-connect if enabled
    watch(
        () => locations.value.length,
        async (newLength, oldLength) => {
            if (autoConnectEnabled.value && newLength > oldLength && newLength >= 2) {
                // Delay to allow location to be fully added
                setTimeout(() => {
                    connectAllLocations(defaultTransportMode.value)
                }, 100)
            }
        }
    )

    // Watch for location order changes and reconnect if needed
    watch(
        () => orderedLocations.value.map(l => l.id).join(','),
        async (newOrder, oldOrder) => {
            if (autoConnectEnabled.value && oldOrder && newOrder !== oldOrder && routes.value.length > 0) {
                setTimeout(() => {
                    connectAllLocations(defaultTransportMode.value)
                }, 100)
            }
        }
    )

    return {
        // State
        isCalculating,
        calculationError,
        selectedRoute,
        autoConnectEnabled,
        defaultTransportMode,
        optimizeOrderEnabled,

        // Computed
        locations,
        routes,
        orderedLocations,
        routesByDay,
        totalDistance,
        totalDuration,
        routeStats,

        // Methods
        calculateRoute,
        addRoute,
        updateRoute,
        removeRoute,
        connectAllLocations,
        optimizeRouteOrder,
        recalculateAllRoutes,
        changeTransportMode,
        clearAllRoutes,

        // Getters
        getRouteById,
        getRoutesForDay,
        getRoutesBetweenLocations,

        // Formatters
        formatDistance,
        formatDuration,
        getTransportModeLabel,

        // Validation
        validateRoute
    }
}
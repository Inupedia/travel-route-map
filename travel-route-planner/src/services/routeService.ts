/**
 * 路线管理服务
 * Route management service
 */

import type { Location, Route, TransportMode } from '@/types'
import { TransportMode as TM } from '@/types'
import { routeCalculator, type RouteCalculationResult } from './routeCalculator'
import { usePlanStore } from '@/stores/planStore'

export interface RouteConnectionOptions {
    transportMode?: TransportMode
    autoOptimize?: boolean
    respectDayNumbers?: boolean
    connectAcrossDays?: boolean
}

export interface RouteOrderAdjustment {
    locationId: string
    newPosition: number
    dayNumber?: number
}

export interface RouteServiceResult<T = any> {
    success: boolean
    data?: T
    error?: string
    warnings?: string[]
}

/**
 * 路线服务类
 * 提供高级路线管理功能
 */
export class RouteService {
    private planStore = usePlanStore()

    /**
     * 自动连接所有地点
     */
    async autoConnectLocations(options: RouteConnectionOptions = {}): Promise<RouteServiceResult<Route[]>> {
        try {
            const {
                transportMode = TM.DRIVING,
                autoOptimize = false,
                respectDayNumbers = true,
                connectAcrossDays = false
            } = options

            const locations = this.planStore.currentLocations
            if (locations.length < 2) {
                return {
                    success: false,
                    error: '至少需要两个地点才能连接路线'
                }
            }

            // 清除现有路线
            this.planStore.currentRoutes.forEach(route => {
                this.planStore.removeRoute(route.id)
            })

            let routes: Omit<Route, 'id'>[] = []
            const warnings: string[] = []

            if (respectDayNumbers && !connectAcrossDays) {
                // 按天数分别连接
                const routesByDay = await routeCalculator.calculateRoutesByDay(locations, transportMode)

                for (const [day, dayData] of Object.entries(routesByDay)) {
                    routes.push(...dayData.routes)

                    if (dayData.locations.length === 1) {
                        warnings.push(`第${day}天只有一个地点，无法生成路线`)
                    }
                }
            } else {
                // 全局连接
                const result = await routeCalculator.smartConnectLocations(locations, transportMode)
                routes = result.routes
            }

            // 添加路线到store
            const addedRoutes: Route[] = []
            for (const routeData of routes) {
                this.planStore.addRoute(routeData)
                // 获取刚添加的路线（通过最新的路线）
                const addedRoute = this.planStore.currentRoutes[this.planStore.currentRoutes.length - 1]
                if (addedRoute) {
                    addedRoutes.push(addedRoute)
                }
            }

            return {
                success: true,
                data: addedRoutes,
                warnings: warnings.length > 0 ? warnings : undefined
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '自动连接失败'
            }
        }
    }

    /**
     * 调整路线顺序
     */
    async adjustRouteOrder(adjustments: RouteOrderAdjustment[]): Promise<RouteServiceResult<Location[]>> {
        try {
            const locations = [...this.planStore.currentLocations]
            const warnings: string[] = []

            // 按天数分组处理
            const locationsByDay: Record<number, Location[]> = {}
            locations.forEach(loc => {
                const day = loc.dayNumber || 1
                if (!locationsByDay[day]) {
                    locationsByDay[day] = []
                }
                locationsByDay[day].push(loc)
            })

            // 应用调整
            for (const adjustment of adjustments) {
                const location = locations.find(l => l.id === adjustment.locationId)
                if (!location) {
                    warnings.push(`找不到地点 ${adjustment.locationId}`)
                    continue
                }

                const targetDay = adjustment.dayNumber || location.dayNumber || 1
                const dayLocations = locationsByDay[targetDay] || []

                // 移除原位置的地点
                const originalDay = location.dayNumber || 1
                if (locationsByDay[originalDay]) {
                    locationsByDay[originalDay] = locationsByDay[originalDay].filter(l => l.id !== location.id)
                }

                // 插入到新位置
                if (!locationsByDay[targetDay]) {
                    locationsByDay[targetDay] = []
                }

                const insertIndex = Math.min(adjustment.newPosition, locationsByDay[targetDay].length)
                locationsByDay[targetDay].splice(insertIndex, 0, {
                    ...location,
                    dayNumber: targetDay
                })

                // 更新store中的地点
                this.planStore.updateLocation(location.id, { dayNumber: targetDay })
            }

            // 重新连接路线
            const newLocations = Object.values(locationsByDay).flat()
            await this.autoConnectLocations({ respectDayNumbers: true })

            return {
                success: true,
                data: newLocations,
                warnings: warnings.length > 0 ? warnings : undefined
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '调整路线顺序失败'
            }
        }
    }

    /**
     * 优化路线顺序
     */
    async optimizeRouteOrder(transportMode: TransportMode = TM.DRIVING): Promise<RouteServiceResult<Location[]>> {
        try {
            const locations = this.planStore.currentLocations
            const startLocation = this.planStore.startLocation
            const endLocation = this.planStore.endLocation
            const waypoints = this.planStore.waypointLocations

            if (!startLocation && waypoints.length === 0) {
                return {
                    success: false,
                    error: '需要至少一个出发点或途经点才能优化路线'
                }
            }

            let optimizedOrder: Location[]

            if (startLocation) {
                // 有出发点的情况
                optimizedOrder = await routeCalculator.optimizeRouteOrder(
                    startLocation,
                    waypoints,
                    endLocation,
                    transportMode
                )
            } else {
                // 没有出发点，只优化途经点
                const result = await routeCalculator.smartConnectLocations(locations, transportMode)
                optimizedOrder = result.order
            }

            // 更新地点顺序（通过更新时间戳）
            optimizedOrder.forEach((location, index) => {
                this.planStore.updateLocation(location.id, {
                    updatedAt: new Date(Date.now() + index * 1000)
                })
            })

            // 重新连接路线
            await this.autoConnectLocations({ transportMode, respectDayNumbers: false })

            return {
                success: true,
                data: optimizedOrder
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '优化路线顺序失败'
            }
        }
    }

    /**
     * 更改交通方式
     */
    async changeTransportMode(
        newMode: TransportMode,
        routeIds?: string[]
    ): Promise<RouteServiceResult<Route[]>> {
        try {
            const routes = this.planStore.currentRoutes
            const targetRoutes = routeIds ? routes.filter(r => routeIds.includes(r.id)) : routes

            if (targetRoutes.length === 0) {
                return {
                    success: false,
                    error: '没有找到需要更改的路线'
                }
            }

            const updatedRoutes: Route[] = []
            const warnings: string[] = []

            for (const route of targetRoutes) {
                try {
                    // 获取起点和终点
                    const fromLocation = this.planStore.currentLocations.find(l => l.id === route.fromLocationId)
                    const toLocation = this.planStore.currentLocations.find(l => l.id === route.toLocationId)

                    if (!fromLocation || !toLocation) {
                        warnings.push(`路线 ${route.id} 的地点信息不完整`)
                        continue
                    }

                    // 重新计算路线
                    const result = await routeCalculator.calculateRoute(fromLocation, toLocation, newMode)

                    // 更新路线
                    this.planStore.updateRoute(route.id, {
                        distance: result.distance,
                        duration: result.duration,
                        transportMode: result.transportMode,
                        path: result.path
                    })

                    const updatedRoute = this.planStore.currentRoutes.find(r => r.id === route.id)
                    if (updatedRoute) {
                        updatedRoutes.push(updatedRoute)
                    }
                } catch (error) {
                    warnings.push(`更新路线 ${route.id} 失败: ${error instanceof Error ? error.message : '未知错误'}`)
                }
            }

            return {
                success: updatedRoutes.length > 0,
                data: updatedRoutes,
                warnings: warnings.length > 0 ? warnings : undefined,
                error: updatedRoutes.length === 0 ? '没有路线更新成功' : undefined
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '更改交通方式失败'
            }
        }
    }

    /**
     * 检查路线可达性
     */
    async checkRouteAccessibility(
        fromLocationId: string,
        toLocationId: string,
        transportMode: TransportMode
    ): Promise<RouteServiceResult<{ accessible: boolean; alternatives?: TransportMode[] }>> {
        try {
            const fromLocation = this.planStore.currentLocations.find(l => l.id === fromLocationId)
            const toLocation = this.planStore.currentLocations.find(l => l.id === toLocationId)

            if (!fromLocation || !toLocation) {
                return {
                    success: false,
                    error: '找不到指定的地点'
                }
            }

            const result = await routeCalculator.checkRouteAccessibility(fromLocation, toLocation, transportMode)

            return {
                success: true,
                data: result
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '检查路线可达性失败'
            }
        }
    }

    /**
     * 获取替代路线
     */
    async getAlternativeRoutes(
        fromLocationId: string,
        toLocationId: string,
        transportModes?: TransportMode[]
    ): Promise<RouteServiceResult<RouteCalculationResult[]>> {
        try {
            const fromLocation = this.planStore.currentLocations.find(l => l.id === fromLocationId)
            const toLocation = this.planStore.currentLocations.find(l => l.id === toLocationId)

            if (!fromLocation || !toLocation) {
                return {
                    success: false,
                    error: '找不到指定的地点'
                }
            }

            const alternatives = await routeCalculator.calculateAlternativeRoutes(
                fromLocation,
                toLocation,
                transportModes
            )

            return {
                success: true,
                data: alternatives
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '获取替代路线失败'
            }
        }
    }

    /**
     * 重新计算所有路线
     */
    async recalculateAllRoutes(transportMode?: TransportMode): Promise<RouteServiceResult<Route[]>> {
        try {
            const routes = this.planStore.currentRoutes
            if (routes.length === 0) {
                return {
                    success: false,
                    error: '没有路线需要重新计算'
                }
            }

            const updatedRoutes: Route[] = []
            const warnings: string[] = []

            for (const route of routes) {
                try {
                    const fromLocation = this.planStore.currentLocations.find(l => l.id === route.fromLocationId)
                    const toLocation = this.planStore.currentLocations.find(l => l.id === route.toLocationId)

                    if (!fromLocation || !toLocation) {
                        warnings.push(`路线 ${route.id} 的地点信息不完整`)
                        continue
                    }

                    const mode = transportMode || route.transportMode
                    const result = await routeCalculator.calculateRoute(fromLocation, toLocation, mode)

                    this.planStore.updateRoute(route.id, {
                        distance: result.distance,
                        duration: result.duration,
                        transportMode: result.transportMode,
                        path: result.path
                    })

                    const updatedRoute = this.planStore.currentRoutes.find(r => r.id === route.id)
                    if (updatedRoute) {
                        updatedRoutes.push(updatedRoute)
                    }
                } catch (error) {
                    warnings.push(`重新计算路线 ${route.id} 失败: ${error instanceof Error ? error.message : '未知错误'}`)
                }
            }

            return {
                success: updatedRoutes.length > 0,
                data: updatedRoutes,
                warnings: warnings.length > 0 ? warnings : undefined,
                error: updatedRoutes.length === 0 ? '没有路线计算成功' : undefined
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '重新计算路线失败'
            }
        }
    }

    /**
     * 获取路线统计信息
     */
    getRouteStatistics(): {
        totalRoutes: number
        totalDistance: number
        totalDuration: number
        byTransportMode: Record<TransportMode, { count: number; distance: number; duration: number }>
        byDay: Record<number, { count: number; distance: number; duration: number }>
        complexity: ReturnType<typeof routeCalculator.evaluateRouteComplexity>
    } {
        const routes = this.planStore.currentRoutes

        const stats = {
            totalRoutes: routes.length,
            totalDistance: routes.reduce((sum, r) => sum + r.distance, 0),
            totalDuration: routes.reduce((sum, r) => sum + r.duration, 0),
            byTransportMode: {} as Record<TransportMode, { count: number; distance: number; duration: number }>,
            byDay: {} as Record<number, { count: number; distance: number; duration: number }>,
            complexity: routeCalculator.evaluateRouteComplexity(routes)
        }

        // 按交通方式统计
        Object.values(TM).forEach(mode => {
            const modeRoutes = routes.filter(r => r.transportMode === mode)
            stats.byTransportMode[mode] = {
                count: modeRoutes.length,
                distance: modeRoutes.reduce((sum, r) => sum + r.distance, 0),
                duration: modeRoutes.reduce((sum, r) => sum + r.duration, 0)
            }
        })

        // 按天数统计
        routes.forEach(route => {
            const day = route.dayNumber
            if (!stats.byDay[day]) {
                stats.byDay[day] = { count: 0, distance: 0, duration: 0 }
            }
            stats.byDay[day].count++
            stats.byDay[day].distance += route.distance
            stats.byDay[day].duration += route.duration
        })

        return stats
    }

    /**
     * 验证路线配置
     */
    validateRouteConfiguration(): {
        isValid: boolean
        errors: string[]
        warnings: string[]
        suggestions: string[]
    } {
        const locations = this.planStore.currentLocations
        const routes = this.planStore.currentRoutes
        const errors: string[] = []
        const warnings: string[] = []
        const suggestions: string[] = []

        // 检查基本配置
        if (locations.length === 0) {
            errors.push('没有添加任何地点')
        } else if (locations.length === 1) {
            warnings.push('只有一个地点，无法生成路线')
        }

        // 检查地点类型配置
        const startLocations = locations.filter(l => l.type === 'start')
        const endLocations = locations.filter(l => l.type === 'end')

        if (startLocations.length > 1) {
            errors.push('只能有一个出发点')
        }

        if (endLocations.length > 1) {
            errors.push('只能有一个终点')
        }

        if (startLocations.length === 0 && locations.length > 1) {
            suggestions.push('建议设置一个出发点')
        }

        if (endLocations.length === 0 && locations.length > 2) {
            suggestions.push('建议设置一个终点')
        }

        // 检查路线连接
        if (locations.length >= 2 && routes.length === 0) {
            warnings.push('地点之间没有连接路线')
            suggestions.push('使用自动连接功能生成路线')
        }

        // 检查孤立地点
        const connectedLocationIds = new Set([
            ...routes.map(r => r.fromLocationId),
            ...routes.map(r => r.toLocationId)
        ])

        const isolatedLocations = locations.filter(l => !connectedLocationIds.has(l.id))
        if (isolatedLocations.length > 0) {
            warnings.push(`有 ${isolatedLocations.length} 个地点没有连接到路线`)
            suggestions.push('检查是否需要连接这些地点')
        }

        // 检查路线复杂度
        const complexity = routeCalculator.evaluateRouteComplexity(routes)
        if (complexity.complexity === 'complex') {
            warnings.push('路线复杂度较高')
            suggestions.push(...complexity.recommendations)
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        }
    }
}

// 创建单例实例
export const routeService = new RouteService()
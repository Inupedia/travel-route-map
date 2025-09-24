import type { Location, Route } from '@/types'

import { TransportMode } from '@/types'

/**
 * 路线计算结果
 */
export interface RouteCalculationResult {
    distance: number // 距离（公里）
    duration: number // 耗时（分钟）
    path?: Array<{ lat: number; lng: number }> // 路径点
    transportMode: TransportMode
}

/**
 * 路线计算服务
 * 负责计算地点间的距离、耗时和路径
 */
export class RouteCalculator {
    private readonly EARTH_RADIUS = 6371 // 地球半径（公里）

    /**
     * 计算两点间的直线距离（哈弗辛公式）
     */
    private calculateHaversineDistance(
        lat1: number,
        lng1: number,
        lat2: number,
        lng2: number
    ): number {
        const dLat = this.toRadians(lat2 - lat1)
        const dLng = this.toRadians(lng2 - lng1)

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return this.EARTH_RADIUS * c
    }

    /**
     * 角度转弧度
     */
    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180)
    }

    /**
     * 根据交通方式估算实际距离
     */
    private estimateActualDistance(straightDistance: number, mode: TransportMode): number {
        const factors = {
            [TransportMode.WALKING]: 1.3,   // 步行路径通常比直线距离长30%
            [TransportMode.DRIVING]: 1.4,   // 驾车路径通常比直线距离长40%
            [TransportMode.TRANSIT]: 1.5    // 公共交通路径通常比直线距离长50%
        }

        return straightDistance * factors[mode]
    }

    /**
     * 根据距离和交通方式估算耗时
     */
    private estimateDuration(distance: number, mode: TransportMode): number {
        const speeds = {
            [TransportMode.WALKING]: 5,    // 步行速度 5km/h
            [TransportMode.DRIVING]: 40,   // 市内驾车平均速度 40km/h
            [TransportMode.TRANSIT]: 25    // 公共交通平均速度 25km/h
        }

        const baseTime = (distance / speeds[mode]) * 60 // 转换为分钟

        // 添加等待时间
        const waitTimes = {
            walking: 0,
            driving: 5,    // 停车等待时间
            transit: 10    // 等车时间
        }

        return Math.round(baseTime + waitTimes[mode])
    }

    /**
     * 生成简化的路径点
     */
    private generateSimplePath(
        fromLat: number,
        fromLng: number,
        toLat: number,
        toLng: number
    ): Array<{ lat: number; lng: number }> {
        const path = [
            { lat: fromLat, lng: fromLng }
        ]

        // 添加中间点（简化的路径，实际应用中应该调用地图API）
        const midLat = (fromLat + toLat) / 2
        const midLng = (fromLng + toLng) / 2

        // 添加一些随机偏移来模拟真实路径
        const offset = 0.001
        path.push({
            lat: midLat + (Math.random() - 0.5) * offset,
            lng: midLng + (Math.random() - 0.5) * offset
        })

        path.push({ lat: toLat, lng: toLng })

        return path
    }

    /**
     * 计算两个地点之间的路线
     */
    async calculateRoute(
        from: Location,
        to: Location,
        transportMode: TransportMode = TransportMode.DRIVING
    ): Promise<RouteCalculationResult> {
        try {
            // 计算直线距离
            const straightDistance = this.calculateHaversineDistance(
                from.coordinates.lat,
                from.coordinates.lng,
                to.coordinates.lat,
                to.coordinates.lng
            )

            // 估算实际距离
            const actualDistance = this.estimateActualDistance(straightDistance, transportMode)

            // 估算耗时
            const duration = this.estimateDuration(actualDistance, transportMode)

            // 生成路径点
            const path = this.generateSimplePath(
                from.coordinates.lat,
                from.coordinates.lng,
                to.coordinates.lat,
                to.coordinates.lng
            )

            return {
                distance: Math.round(actualDistance * 100) / 100, // 保留两位小数
                duration,
                path,
                transportMode
            }
        } catch (error) {
            throw new Error(`路线计算失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 批量计算多个地点间的路线
     */
    async calculateMultipleRoutes(
        locations: Location[],
        transportMode: TransportMode = TransportMode.DRIVING
    ): Promise<Route[]> {
        if (locations.length < 2) {
            return []
        }

        const routes: Route[] = []

        try {
            for (let i = 0; i < locations.length - 1; i++) {
                const from = locations[i]
                const to = locations[i + 1]

                const result = await this.calculateRoute(from, to, transportMode)

                const route: Route = {
                    id: `route-${from.id}-${to.id}`,
                    fromLocationId: from.id,
                    toLocationId: to.id,
                    distance: result.distance,
                    duration: result.duration,
                    transportMode: result.transportMode,
                    path: result.path,
                    dayNumber: from.dayNumber || 1
                }

                routes.push(route)
            }

            return routes
        } catch (error) {
            throw new Error(`批量路线计算失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 优化路线顺序（简单的最近邻算法）
     */
    async optimizeRouteOrder(
        startLocation: Location,
        waypoints: Location[],
        endLocation?: Location,
        transportMode: TransportMode = TransportMode.DRIVING
    ): Promise<Location[]> {
        if (waypoints.length === 0) {
            return endLocation ? [startLocation, endLocation] : [startLocation]
        }

        try {
            const optimizedOrder = [startLocation]
            const remainingPoints = [...waypoints]
            let currentLocation = startLocation

            // 使用最近邻算法
            while (remainingPoints.length > 0) {
                let nearestIndex = 0
                let shortestDistance = Infinity

                for (let i = 0; i < remainingPoints.length; i++) {
                    const distance = this.calculateHaversineDistance(
                        currentLocation.coordinates.lat,
                        currentLocation.coordinates.lng,
                        remainingPoints[i].coordinates.lat,
                        remainingPoints[i].coordinates.lng
                    )

                    if (distance < shortestDistance) {
                        shortestDistance = distance
                        nearestIndex = i
                    }
                }

                const nearestLocation = remainingPoints.splice(nearestIndex, 1)[0]
                optimizedOrder.push(nearestLocation)
                currentLocation = nearestLocation
            }

            if (endLocation) {
                optimizedOrder.push(endLocation)
            }

            return optimizedOrder
        } catch (error) {
            throw new Error(`路线优化失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 计算总行程统计
     */
    async calculateTripSummary(routes: Route[]): Promise<{
        totalDistance: number
        totalDuration: number
        routeCount: number
        averageDistance: number
        averageDuration: number
    }> {
        if (routes.length === 0) {
            return {
                totalDistance: 0,
                totalDuration: 0,
                routeCount: 0,
                averageDistance: 0,
                averageDuration: 0
            }
        }

        const totalDistance = routes.reduce((sum, route) => sum + route.distance, 0)
        const totalDuration = routes.reduce((sum, route) => sum + route.duration, 0)

        return {
            totalDistance: Math.round(totalDistance * 100) / 100,
            totalDuration,
            routeCount: routes.length,
            averageDistance: Math.round((totalDistance / routes.length) * 100) / 100,
            averageDuration: Math.round(totalDuration / routes.length)
        }
    }

    /**
     * 验证路线数据
     */
    validateRoute(route: Partial<Route>): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        if (!route.fromLocationId) {
            errors.push('缺少起始地点ID')
        }

        if (!route.toLocationId) {
            errors.push('缺少目标地点ID')
        }

        if (typeof route.distance !== 'number' || route.distance < 0) {
            errors.push('距离必须是非负数')
        }

        if (typeof route.duration !== 'number' || route.duration < 0) {
            errors.push('耗时必须是非负数')
        }

        if (route.transportMode && !Object.values(TransportMode).includes(route.transportMode)) {
            errors.push('无效的交通方式')
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }
}

// 创建单例实例
export const routeCalculator = new RouteCalculator()
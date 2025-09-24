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
     * 验证坐标有效性
     */
    private isValidCoordinate(coordinate: { lat: number; lng: number }): boolean {
        return (
            typeof coordinate.lat === 'number' &&
            typeof coordinate.lng === 'number' &&
            !isNaN(coordinate.lat) &&
            !isNaN(coordinate.lng) &&
            coordinate.lat >= -90 &&
            coordinate.lat <= 90 &&
            coordinate.lng >= -180 &&
            coordinate.lng <= 180
        )
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
            // 验证坐标有效性
            if (!this.isValidCoordinate(from.coordinates) || !this.isValidCoordinate(to.coordinates)) {
                throw new Error('无效的坐标数据')
            }

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
    ): Promise<Omit<Route, 'id'>[]> {
        if (locations.length < 2) {
            return []
        }

        const routes: Omit<Route, 'id'>[] = []

        try {
            for (let i = 0; i < locations.length - 1; i++) {
                const from = locations[i]
                const to = locations[i + 1]

                const result = await this.calculateRoute(from, to, transportMode)

                const route: Omit<Route, 'id'> = {
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
     * 智能路线连接 - 根据地点类型和位置自动确定最佳连接顺序
     */
    async smartConnectLocations(
        locations: Location[],
        transportMode: TransportMode = TransportMode.DRIVING
    ): Promise<{ routes: Omit<Route, 'id'>[]; order: Location[] }> {
        if (locations.length < 2) {
            return { routes: [], order: [] }
        }

        try {
            // 分离不同类型的地点
            const startLoc = locations.find(loc => loc.type === 'start')
            const endLoc = locations.find(loc => loc.type === 'end')
            const waypoints = locations.filter(loc => loc.type === 'waypoint')

            if (!startLoc && waypoints.length === 0) {
                throw new Error('至少需要一个出发点或途经点')
            }

            let orderedLocations: Location[] = []

            // 如果有出发点，从出发点开始
            if (startLoc) {
                orderedLocations.push(startLoc)

                if (waypoints.length > 0) {
                    // 优化途经点顺序
                    const optimizedWaypoints = await this.optimizeRouteOrder(
                        startLoc,
                        waypoints,
                        endLoc,
                        transportMode
                    )
                    // 移除起始点，只保留途经点和终点
                    orderedLocations.push(...optimizedWaypoints.slice(1))
                } else if (endLoc) {
                    orderedLocations.push(endLoc)
                }
            } else {
                // 没有出发点，按天数和创建时间排序途经点
                orderedLocations = waypoints.sort((a, b) => {
                    if (a.dayNumber !== b.dayNumber) {
                        return (a.dayNumber || 0) - (b.dayNumber || 0)
                    }
                    return a.createdAt.getTime() - b.createdAt.getTime()
                })

                if (endLoc) {
                    orderedLocations.push(endLoc)
                }
            }

            // 计算连接路线
            const routes = await this.calculateMultipleRoutes(orderedLocations, transportMode)

            return { routes, order: orderedLocations }
        } catch (error) {
            throw new Error(`智能路线连接失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 按天数分组计算路线
     */
    async calculateRoutesByDay(
        locations: Location[],
        transportMode: TransportMode = TransportMode.DRIVING
    ): Promise<Record<number, { routes: Omit<Route, 'id'>[]; locations: Location[] }>> {
        const result: Record<number, { routes: Omit<Route, 'id'>[]; locations: Location[] }> = {}

        try {
            // 按天数分组
            const locationsByDay: Record<number, Location[]> = {}

            locations.forEach(location => {
                const day = location.dayNumber || 1
                if (!locationsByDay[day]) {
                    locationsByDay[day] = []
                }
                locationsByDay[day].push(location)
            })

            // 为每天计算路线
            for (const [day, dayLocations] of Object.entries(locationsByDay)) {
                const dayNumber = parseInt(day)

                if (dayLocations.length >= 2) {
                    const { routes, order } = await this.smartConnectLocations(dayLocations, transportMode)
                    result[dayNumber] = { routes, locations: order }
                } else {
                    result[dayNumber] = { routes: [], locations: dayLocations }
                }
            }

            return result
        } catch (error) {
            throw new Error(`按天计算路线失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 计算替代路线（不同交通方式的对比）
     */
    async calculateAlternativeRoutes(
        from: Location,
        to: Location,
        transportModes: TransportMode[] = [TransportMode.WALKING, TransportMode.DRIVING, TransportMode.TRANSIT]
    ): Promise<RouteCalculationResult[]> {
        const alternatives: RouteCalculationResult[] = []

        try {
            for (const mode of transportModes) {
                try {
                    const result = await this.calculateRoute(from, to, mode)
                    alternatives.push(result)
                } catch (error) {
                    // 某种交通方式计算失败时，继续计算其他方式
                    console.warn(`交通方式 ${mode} 计算失败:`, error)
                }
            }

            // 按耗时排序
            alternatives.sort((a, b) => a.duration - b.duration)

            return alternatives
        } catch (error) {
            throw new Error(`计算替代路线失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 路线可达性检查
     */
    async checkRouteAccessibility(
        from: Location,
        to: Location,
        transportMode: TransportMode
    ): Promise<{ accessible: boolean; reason?: string; alternatives?: TransportMode[] }> {
        try {
            // 计算直线距离
            const straightDistance = this.calculateHaversineDistance(
                from.coordinates.lat,
                from.coordinates.lng,
                to.coordinates.lat,
                to.coordinates.lng
            )

            // 检查距离限制
            const maxDistances = {
                [TransportMode.WALKING]: 50, // 步行最大50公里
                [TransportMode.DRIVING]: 1000, // 驾车最大1000公里
                [TransportMode.TRANSIT]: 200 // 公交最大200公里
            }

            if (straightDistance > maxDistances[transportMode]) {
                const alternatives = Object.keys(maxDistances)
                    .filter(mode => straightDistance <= maxDistances[mode as TransportMode])
                    .map(mode => mode as TransportMode)

                return {
                    accessible: false,
                    reason: `距离超出${this.getTransportModeLabel(transportMode)}的合理范围`,
                    alternatives
                }
            }

            // 尝试计算路线
            try {
                await this.calculateRoute(from, to, transportMode)
                return { accessible: true }
            } catch (error) {
                return {
                    accessible: false,
                    reason: error instanceof Error ? error.message : '路线计算失败',
                    alternatives: Object.values(TransportMode).filter(mode => mode !== transportMode)
                }
            }
        } catch (error) {
            return {
                accessible: false,
                reason: error instanceof Error ? error.message : '可达性检查失败'
            }
        }
    }

    /**
     * 获取交通方式标签
     */
    private getTransportModeLabel(mode: TransportMode): string {
        const labels = {
            [TransportMode.WALKING]: '步行',
            [TransportMode.DRIVING]: '驾车',
            [TransportMode.TRANSIT]: '公共交通'
        }
        return labels[mode] || mode
    }

    /**
     * 路线复杂度评估
     */
    evaluateRouteComplexity(routes: Route[]): {
        complexity: 'simple' | 'moderate' | 'complex'
        factors: {
            totalDistance: number
            totalDuration: number
            routeCount: number
            transportModeChanges: number
            daySpan: number
        }
        recommendations: string[]
    } {
        const factors = {
            totalDistance: routes.reduce((sum, r) => sum + r.distance, 0),
            totalDuration: routes.reduce((sum, r) => sum + r.duration, 0),
            routeCount: routes.length,
            transportModeChanges: this.countTransportModeChanges(routes),
            daySpan: this.calculateDaySpan(routes)
        }

        const recommendations: string[] = []
        let complexity: 'simple' | 'moderate' | 'complex' = 'simple'

        // 评估复杂度
        if (factors.routeCount > 10 || factors.totalDistance > 500 || factors.daySpan > 7) {
            complexity = 'complex'
            recommendations.push('考虑分段规划，避免过于复杂的行程')
        } else if (factors.routeCount > 5 || factors.totalDistance > 200 || factors.transportModeChanges > 3) {
            complexity = 'moderate'
            recommendations.push('适中的行程复杂度，注意时间安排')
        }

        // 具体建议
        if (factors.transportModeChanges > 5) {
            recommendations.push('交通方式变化较多，建议优化以减少换乘')
        }

        if (factors.totalDuration > 480) { // 8小时
            recommendations.push('总行程时间较长，建议安排休息时间')
        }

        if (factors.daySpan > 3 && factors.routeCount / factors.daySpan < 2) {
            recommendations.push('每天的地点较少，可以考虑增加更多景点')
        }

        return { complexity, factors, recommendations }
    }

    /**
     * 计算交通方式变化次数
     */
    private countTransportModeChanges(routes: Route[]): number {
        if (routes.length <= 1) return 0

        let changes = 0
        for (let i = 1; i < routes.length; i++) {
            if (routes[i].transportMode !== routes[i - 1].transportMode) {
                changes++
            }
        }
        return changes
    }

    /**
     * 计算行程跨越天数
     */
    private calculateDaySpan(routes: Route[]): number {
        if (routes.length === 0) return 0

        const days = new Set(routes.map(r => r.dayNumber))
        return days.size
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

        if (route.fromLocationId === route.toLocationId) {
            errors.push('起始地点和目标地点不能相同')
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

        if (route.dayNumber && (typeof route.dayNumber !== 'number' || route.dayNumber < 1)) {
            errors.push('天数必须是正整数')
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }
}

// 创建单例实例
export const routeCalculator = new RouteCalculator()
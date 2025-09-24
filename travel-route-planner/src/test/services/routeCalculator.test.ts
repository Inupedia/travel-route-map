import { describe, it, expect, beforeEach } from 'vitest'
import { RouteCalculator } from '@/services/routeCalculator'
import type { Location, Route } from '@/types'
import { LocationType, TransportMode } from '@/types'

describe('RouteCalculator', () => {
    let routeCalculator: RouteCalculator
    let mockLocations: Location[]

    beforeEach(() => {
        routeCalculator = new RouteCalculator()

        mockLocations = [
            {
                id: 'loc-1',
                name: '北京天安门',
                type: LocationType.START,
                coordinates: { lat: 39.9042, lng: 116.4074 },
                address: '北京市东城区天安门广场',
                dayNumber: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'loc-2',
                name: '故宫博物院',
                type: LocationType.WAYPOINT,
                coordinates: { lat: 39.9163, lng: 116.3972 },
                address: '北京市东城区景山前街4号',
                dayNumber: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'loc-3',
                name: '颐和园',
                type: LocationType.END,
                coordinates: { lat: 39.9999, lng: 116.2755 },
                address: '北京市海淀区新建宫门路19号',
                dayNumber: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]
    })

    describe('calculateRoute', () => {
        it('应该计算两点间的路线（驾车模式）', async () => {
            const result = await routeCalculator.calculateRoute(
                mockLocations[0],
                mockLocations[1],
                TransportMode.DRIVING
            )

            expect(result).toHaveProperty('distance')
            expect(result).toHaveProperty('duration')
            expect(result).toHaveProperty('path')
            expect(result).toHaveProperty('transportMode')

            expect(result.distance).toBeGreaterThan(0)
            expect(result.duration).toBeGreaterThan(0)
            expect(result.transportMode).toBe(TransportMode.DRIVING)
            expect(Array.isArray(result.path)).toBe(true)
            expect(result.path!.length).toBeGreaterThan(0)
        })

        it('应该计算两点间的路线（步行模式）', async () => {
            const result = await routeCalculator.calculateRoute(
                mockLocations[0],
                mockLocations[1],
                TransportMode.WALKING
            )

            expect(result.transportMode).toBe(TransportMode.WALKING)
            expect(result.duration).toBeGreaterThan(0)
        })

        it('应该计算两点间的路线（公共交通模式）', async () => {
            const result = await routeCalculator.calculateRoute(
                mockLocations[0],
                mockLocations[1],
                TransportMode.TRANSIT
            )

            expect(result.transportMode).toBe(TransportMode.TRANSIT)
            expect(result.duration).toBeGreaterThan(0)
        })

        it('应该返回合理的距离值（保留两位小数）', async () => {
            const result = await routeCalculator.calculateRoute(
                mockLocations[0],
                mockLocations[1],
                TransportMode.DRIVING
            )

            expect(result.distance).toBeGreaterThan(0)
            expect(Number.isFinite(result.distance)).toBe(true)
            // 检查是否最多保留两位小数
            expect(result.distance.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2)
        })

        it('应该生成包含起点和终点的路径', async () => {
            const result = await routeCalculator.calculateRoute(
                mockLocations[0],
                mockLocations[1],
                TransportMode.DRIVING
            )

            expect(result.path).toBeDefined()
            expect(result.path!.length).toBeGreaterThanOrEqual(2)

            const firstPoint = result.path![0]
            const lastPoint = result.path![result.path!.length - 1]

            expect(firstPoint.lat).toBeCloseTo(mockLocations[0].coordinates.lat, 4)
            expect(firstPoint.lng).toBeCloseTo(mockLocations[0].coordinates.lng, 4)
            expect(lastPoint.lat).toBeCloseTo(mockLocations[1].coordinates.lat, 4)
            expect(lastPoint.lng).toBeCloseTo(mockLocations[1].coordinates.lng, 4)
        })
    })

    describe('calculateMultipleRoutes', () => {
        it('应该计算多个地点间的连续路线', async () => {
            const routes = await routeCalculator.calculateMultipleRoutes(
                mockLocations,
                TransportMode.DRIVING
            )

            expect(routes).toHaveLength(2) // 3个地点应该产生2条路线

            routes.forEach(route => {
                expect(route).toHaveProperty('id')
                expect(route).toHaveProperty('fromLocationId')
                expect(route).toHaveProperty('toLocationId')
                expect(route).toHaveProperty('distance')
                expect(route).toHaveProperty('duration')
                expect(route).toHaveProperty('transportMode')
                expect(route.transportMode).toBe(TransportMode.DRIVING)
            })

            // 检查路线连接的正确性
            expect(routes[0].fromLocationId).toBe(mockLocations[0].id)
            expect(routes[0].toLocationId).toBe(mockLocations[1].id)
            expect(routes[1].fromLocationId).toBe(mockLocations[1].id)
            expect(routes[1].toLocationId).toBe(mockLocations[2].id)
        })

        it('应该在地点少于2个时返回空数组', async () => {
            const routes = await routeCalculator.calculateMultipleRoutes(
                [mockLocations[0]],
                TransportMode.DRIVING
            )

            expect(routes).toEqual([])
        })

        it('应该在空数组时返回空数组', async () => {
            const routes = await routeCalculator.calculateMultipleRoutes(
                [],
                TransportMode.DRIVING
            )

            expect(routes).toEqual([])
        })
    })

    describe('optimizeRouteOrder', () => {
        it('应该优化路线顺序（最近邻算法）', async () => {
            const startLocation = mockLocations[0]
            const waypoints = [mockLocations[1], mockLocations[2]]

            const optimizedOrder = await routeCalculator.optimizeRouteOrder(
                startLocation,
                waypoints,
                undefined,
                TransportMode.DRIVING
            )

            expect(optimizedOrder).toHaveLength(3)
            expect(optimizedOrder[0].id).toBe(startLocation.id)
            expect(optimizedOrder.slice(1)).toEqual(expect.arrayContaining(waypoints))
        })

        it('应该在包含终点时正确处理', async () => {
            const startLocation = mockLocations[0]
            const waypoints = [mockLocations[1]]
            const endLocation = mockLocations[2]

            const optimizedOrder = await routeCalculator.optimizeRouteOrder(
                startLocation,
                waypoints,
                endLocation,
                TransportMode.DRIVING
            )

            expect(optimizedOrder).toHaveLength(3)
            expect(optimizedOrder[0].id).toBe(startLocation.id)
            expect(optimizedOrder[optimizedOrder.length - 1].id).toBe(endLocation.id)
        })

        it('应该在没有途经点时只返回起点和终点', async () => {
            const startLocation = mockLocations[0]
            const endLocation = mockLocations[2]

            const optimizedOrder = await routeCalculator.optimizeRouteOrder(
                startLocation,
                [],
                endLocation,
                TransportMode.DRIVING
            )

            expect(optimizedOrder).toHaveLength(2)
            expect(optimizedOrder[0].id).toBe(startLocation.id)
            expect(optimizedOrder[1].id).toBe(endLocation.id)
        })

        it('应该在只有起点时返回起点', async () => {
            const startLocation = mockLocations[0]

            const optimizedOrder = await routeCalculator.optimizeRouteOrder(
                startLocation,
                [],
                undefined,
                TransportMode.DRIVING
            )

            expect(optimizedOrder).toHaveLength(1)
            expect(optimizedOrder[0].id).toBe(startLocation.id)
        })
    })

    describe('calculateTripSummary', () => {
        it('应该计算行程统计信息', async () => {
            const mockRoutes: Route[] = [
                {
                    id: 'route-1',
                    fromLocationId: 'loc-1',
                    toLocationId: 'loc-2',
                    distance: 10.5,
                    duration: 30,
                    transportMode: TransportMode.DRIVING,
                    dayNumber: 1
                },
                {
                    id: 'route-2',
                    fromLocationId: 'loc-2',
                    toLocationId: 'loc-3',
                    distance: 15.3,
                    duration: 45,
                    transportMode: TransportMode.DRIVING,
                    dayNumber: 1
                }
            ]

            const summary = await routeCalculator.calculateTripSummary(mockRoutes)

            expect(summary.totalDistance).toBe(25.8)
            expect(summary.totalDuration).toBe(75)
            expect(summary.routeCount).toBe(2)
            expect(summary.averageDistance).toBe(12.9)
            expect(summary.averageDuration).toBe(38) // Math.round(75/2)
        })

        it('应该在没有路线时返回零值', async () => {
            const summary = await routeCalculator.calculateTripSummary([])

            expect(summary.totalDistance).toBe(0)
            expect(summary.totalDuration).toBe(0)
            expect(summary.routeCount).toBe(0)
            expect(summary.averageDistance).toBe(0)
            expect(summary.averageDuration).toBe(0)
        })
    })

    describe('validateRoute', () => {
        it('应该验证有效的路线数据', () => {
            const validRoute: Partial<Route> = {
                fromLocationId: 'loc-1',
                toLocationId: 'loc-2',
                distance: 10.5,
                duration: 30,
                transportMode: TransportMode.DRIVING
            }

            const result = routeCalculator.validateRoute(validRoute)

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('应该检测缺少起始地点ID', () => {
            const invalidRoute: Partial<Route> = {
                toLocationId: 'loc-2',
                distance: 10.5,
                duration: 30,
                transportMode: TransportMode.DRIVING
            }

            const result = routeCalculator.validateRoute(invalidRoute)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('缺少起始地点ID')
        })

        it('应该检测缺少目标地点ID', () => {
            const invalidRoute: Partial<Route> = {
                fromLocationId: 'loc-1',
                distance: 10.5,
                duration: 30,
                transportMode: TransportMode.DRIVING
            }

            const result = routeCalculator.validateRoute(invalidRoute)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('缺少目标地点ID')
        })

        it('应该检测无效的距离值', () => {
            const invalidRoute: Partial<Route> = {
                fromLocationId: 'loc-1',
                toLocationId: 'loc-2',
                distance: -5,
                duration: 30,
                transportMode: TransportMode.DRIVING
            }

            const result = routeCalculator.validateRoute(invalidRoute)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('距离必须是非负数')
        })

        it('应该检测无效的耗时值', () => {
            const invalidRoute: Partial<Route> = {
                fromLocationId: 'loc-1',
                toLocationId: 'loc-2',
                distance: 10.5,
                duration: -10,
                transportMode: TransportMode.DRIVING
            }

            const result = routeCalculator.validateRoute(invalidRoute)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('耗时必须是非负数')
        })

        it('应该检测无效的交通方式', () => {
            const invalidRoute: Partial<Route> = {
                fromLocationId: 'loc-1',
                toLocationId: 'loc-2',
                distance: 10.5,
                duration: 30,
                transportMode: 'flying' as any
            }

            const result = routeCalculator.validateRoute(invalidRoute)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('无效的交通方式')
        })

        it('应该收集多个验证错误', () => {
            const invalidRoute: Partial<Route> = {
                distance: -5,
                duration: -10
            }

            const result = routeCalculator.validateRoute(invalidRoute)

            expect(result.isValid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(1)
        })
    })
})
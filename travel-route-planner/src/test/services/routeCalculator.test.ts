/**
 * 路线计算服务测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { routeCalculator } from '@/services/routeCalculator'
import { TransportMode, LocationType } from '@/types'
import type { Location } from '@/types'

describe('RouteCalculator', () => {
    let testLocations: Location[]

    beforeEach(() => {
        testLocations = [
            {
                id: 'loc1',
                name: '天安门广场',
                type: LocationType.START,
                coordinates: { lat: 39.9042, lng: 116.4074 },
                dayNumber: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'loc2',
                name: '故宫博物院',
                type: LocationType.WAYPOINT,
                coordinates: { lat: 39.9163, lng: 116.3972 },
                dayNumber: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'loc3',
                name: '景山公园',
                type: LocationType.END,
                coordinates: { lat: 39.9281, lng: 116.3933 },
                dayNumber: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]
    })

    describe('calculateRoute', () => {
        it('should calculate route between two locations', async () => {
            const result = await routeCalculator.calculateRoute(
                testLocations[0],
                testLocations[1],
                TransportMode.DRIVING
            )

            expect(result).toBeDefined()
            expect(result.distance).toBeGreaterThan(0)
            expect(result.duration).toBeGreaterThan(0)
            expect(result.transportMode).toBe(TransportMode.DRIVING)
            expect(result.path).toBeDefined()
            expect(result.path!.length).toBeGreaterThanOrEqual(2)
        })

        it('should calculate different results for different transport modes', async () => {
            const walkingResult = await routeCalculator.calculateRoute(
                testLocations[0],
                testLocations[1],
                TransportMode.WALKING
            )

            const drivingResult = await routeCalculator.calculateRoute(
                testLocations[0],
                testLocations[1],
                TransportMode.DRIVING
            )

            expect(walkingResult.transportMode).toBe(TransportMode.WALKING)
            expect(drivingResult.transportMode).toBe(TransportMode.DRIVING)
            expect(walkingResult.duration).toBeGreaterThan(drivingResult.duration)
        })

        it('should handle invalid coordinates', async () => {
            const invalidLocation = {
                ...testLocations[0],
                coordinates: { lat: NaN, lng: NaN }
            }

            await expect(
                routeCalculator.calculateRoute(invalidLocation, testLocations[1])
            ).rejects.toThrow()
        })
    })

    describe('calculateMultipleRoutes', () => {
        it('should calculate routes between consecutive locations', async () => {
            const routes = await routeCalculator.calculateMultipleRoutes(
                testLocations,
                TransportMode.DRIVING
            )

            expect(routes).toHaveLength(2)
            expect(routes[0].fromLocationId).toBe('loc1')
            expect(routes[0].toLocationId).toBe('loc2')
            expect(routes[1].fromLocationId).toBe('loc2')
            expect(routes[1].toLocationId).toBe('loc3')
        })

        it('should return empty array for single location', async () => {
            const routes = await routeCalculator.calculateMultipleRoutes([testLocations[0]])
            expect(routes).toHaveLength(0)
        })

        it('should return empty array for empty locations', async () => {
            const routes = await routeCalculator.calculateMultipleRoutes([])
            expect(routes).toHaveLength(0)
        })
    })

    describe('optimizeRouteOrder', () => {
        it('should optimize waypoint order', async () => {
            const startLocation = testLocations[0]
            const waypoints = [testLocations[1]]
            const endLocation = testLocations[2]

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

        it('should handle empty waypoints', async () => {
            const startLocation = testLocations[0]
            const endLocation = testLocations[2]

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
    })

    describe('calculateTripSummary', () => {
        it('should calculate trip summary', async () => {
            const routes = await routeCalculator.calculateMultipleRoutes(
                testLocations,
                TransportMode.DRIVING
            )

            // Convert to Route objects with ids
            const routesWithIds = routes.map((route, index) => ({
                ...route,
                id: `route-${index}`
            }))

            const summary = await routeCalculator.calculateTripSummary(routesWithIds)

            expect(summary.totalDistance).toBeGreaterThan(0)
            expect(summary.totalDuration).toBeGreaterThan(0)
            expect(summary.routeCount).toBe(2)
            expect(summary.averageDistance).toBe(summary.totalDistance / 2)
            expect(summary.averageDuration).toBe(summary.totalDuration / 2)
        })

        it('should handle empty routes', async () => {
            const summary = await routeCalculator.calculateTripSummary([])

            expect(summary.totalDistance).toBe(0)
            expect(summary.totalDuration).toBe(0)
            expect(summary.routeCount).toBe(0)
            expect(summary.averageDistance).toBe(0)
            expect(summary.averageDuration).toBe(0)
        })
    })

    describe('smartConnectLocations', () => {
        it('should smart connect locations with start and end', async () => {
            const result = await routeCalculator.smartConnectLocations(
                testLocations,
                TransportMode.DRIVING
            )

            expect(result.routes).toHaveLength(2)
            expect(result.order).toHaveLength(3)
            expect(result.order[0].type).toBe(LocationType.START)
            expect(result.order[result.order.length - 1].type).toBe(LocationType.END)
        })

        it('should handle locations without start point', async () => {
            const waypointsOnly = testLocations.map(loc => ({
                ...loc,
                type: LocationType.WAYPOINT
            }))

            const result = await routeCalculator.smartConnectLocations(
                waypointsOnly,
                TransportMode.DRIVING
            )

            expect(result.routes).toHaveLength(2)
            expect(result.order).toHaveLength(3)
        })
    })

    describe('calculateAlternativeRoutes', () => {
        it('should calculate alternative routes with different transport modes', async () => {
            const alternatives = await routeCalculator.calculateAlternativeRoutes(
                testLocations[0],
                testLocations[1],
                [TransportMode.WALKING, TransportMode.DRIVING, TransportMode.TRANSIT]
            )

            expect(alternatives.length).toBeGreaterThan(0)
            expect(alternatives.length).toBeLessThanOrEqual(3)

            // Should be sorted by duration
            for (let i = 1; i < alternatives.length; i++) {
                expect(alternatives[i].duration).toBeGreaterThanOrEqual(alternatives[i - 1].duration)
            }
        })
    })

    describe('checkRouteAccessibility', () => {
        it('should check route accessibility', async () => {
            const result = await routeCalculator.checkRouteAccessibility(
                testLocations[0],
                testLocations[1],
                TransportMode.DRIVING
            )

            expect(result.accessible).toBe(true)
        })

        it('should detect inaccessible routes for very long distances', async () => {
            const distantLocation = {
                ...testLocations[1],
                coordinates: { lat: -33.8688, lng: 151.2093 } // Sydney
            }

            const result = await routeCalculator.checkRouteAccessibility(
                testLocations[0],
                distantLocation,
                TransportMode.WALKING
            )

            expect(result.accessible).toBe(false)
            expect(result.reason).toBeDefined()
            expect(result.alternatives).toBeDefined()
        })
    })

    describe('evaluateRouteComplexity', () => {
        it('should evaluate simple route complexity', async () => {
            const routes = await routeCalculator.calculateMultipleRoutes(
                testLocations.slice(0, 2),
                TransportMode.DRIVING
            )

            const routesWithIds = routes.map((route, index) => ({
                ...route,
                id: `route-${index}`
            }))

            const evaluation = routeCalculator.evaluateRouteComplexity(routesWithIds)

            expect(evaluation.complexity).toBe('simple')
            expect(evaluation.factors.routeCount).toBe(1)
            expect(evaluation.factors.totalDistance).toBeGreaterThan(0)
            expect(evaluation.recommendations).toBeDefined()
        })
    })

    describe('validateRoute', () => {
        it('should validate valid route', () => {
            const validRoute = {
                fromLocationId: 'loc1',
                toLocationId: 'loc2',
                distance: 10.5,
                duration: 30,
                transportMode: TransportMode.DRIVING,
                dayNumber: 1
            }

            const result = routeCalculator.validateRoute(validRoute)

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should detect invalid route data', () => {
            const invalidRoute = {
                fromLocationId: '',
                toLocationId: 'loc2',
                distance: -5,
                duration: -10,
                transportMode: 'invalid' as any,
                dayNumber: 0
            }

            const result = routeCalculator.validateRoute(invalidRoute)

            expect(result.isValid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
        })

        it('should detect same from and to location', () => {
            const invalidRoute = {
                fromLocationId: 'loc1',
                toLocationId: 'loc1',
                distance: 0,
                duration: 0,
                transportMode: TransportMode.DRIVING
            }

            const result = routeCalculator.validateRoute(invalidRoute)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('起始地点和目标地点不能相同')
        })
    })
})
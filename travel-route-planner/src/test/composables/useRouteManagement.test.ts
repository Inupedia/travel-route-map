/**
 * 路线管理组合式函数测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRouteManagement } from '@/composables/useRouteManagement'
import { usePlanStore } from '@/stores/planStore'
import { TransportMode, LocationType } from '@/types'
import type { Location } from '@/types'

// Mock ElMessage
vi.mock('element-plus', () => ({
    ElMessage: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn()
    },
    ElMessageBox: {
        confirm: vi.fn().mockResolvedValue('confirm')
    }
}))

describe('useRouteManagement', () => {
    let planStore: ReturnType<typeof usePlanStore>
    let testLocations: Location[]

    beforeEach(() => {
        setActivePinia(createPinia())
        planStore = usePlanStore()

        testLocations = [
            {
                id: 'loc1',
                name: '天安门广场',
                type: LocationType.START,
                coordinates: { lat: 39.9042, lng: 116.4074 },
                dayNumber: 1,
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-01-01T10:00:00Z')
            },
            {
                id: 'loc2',
                name: '故宫博物院',
                type: LocationType.WAYPOINT,
                coordinates: { lat: 39.9163, lng: 116.3972 },
                dayNumber: 1,
                createdAt: new Date('2024-01-01T11:00:00Z'),
                updatedAt: new Date('2024-01-01T11:00:00Z')
            },
            {
                id: 'loc3',
                name: '景山公园',
                type: LocationType.END,
                coordinates: { lat: 39.9281, lng: 116.3933 },
                dayNumber: 1,
                createdAt: new Date('2024-01-01T12:00:00Z'),
                updatedAt: new Date('2024-01-01T12:00:00Z')
            }
        ]

        // Create a plan and add test locations
        planStore.createPlan('测试计划', 3)
        testLocations.forEach(location => {
            planStore.addLocation({
                name: location.name,
                type: location.type,
                coordinates: location.coordinates,
                dayNumber: location.dayNumber
            })
        })
    })

    describe('initialization', () => {
        it('should initialize with default options', () => {
            const routeManagement = useRouteManagement()

            expect(routeManagement.autoConnectEnabled.value).toBe(true)
            expect(routeManagement.defaultTransportMode.value).toBe(TransportMode.DRIVING)
            expect(routeManagement.optimizeOrderEnabled.value).toBe(false)
            expect(routeManagement.isCalculating.value).toBe(false)
            expect(routeManagement.calculationError.value).toBeNull()
            expect(routeManagement.selectedRoute.value).toBeNull()
        })

        it('should initialize with custom options', () => {
            const routeManagement = useRouteManagement({
                autoConnect: false,
                defaultTransportMode: TransportMode.WALKING,
                optimizeOrder: true
            })

            expect(routeManagement.autoConnectEnabled.value).toBe(false)
            expect(routeManagement.defaultTransportMode.value).toBe(TransportMode.WALKING)
            expect(routeManagement.optimizeOrderEnabled.value).toBe(true)
        })
    })

    describe('computed properties', () => {
        it('should provide access to locations and routes', () => {
            const routeManagement = useRouteManagement()

            expect(routeManagement.locations.value).toHaveLength(3)
            expect(routeManagement.routes.value).toHaveLength(0)
            expect(routeManagement.orderedLocations.value).toHaveLength(3)
        })

        it('should calculate ordered locations correctly', () => {
            const routeManagement = useRouteManagement()
            const ordered = routeManagement.orderedLocations.value

            expect(ordered[0].type).toBe(LocationType.START)
            expect(ordered[1].type).toBe(LocationType.WAYPOINT)
            expect(ordered[2].type).toBe(LocationType.END)
        })

        it('should calculate route statistics', () => {
            const routeManagement = useRouteManagement()

            expect(routeManagement.totalDistance.value).toBe(0)
            expect(routeManagement.totalDuration.value).toBe(0)
            expect(routeManagement.routeStats.value.totalRoutes).toBe(0)
        })
    })

    describe('route calculation', () => {
        it('should calculate route between two locations', async () => {
            const routeManagement = useRouteManagement()
            const locations = routeManagement.locations.value

            const result = await routeManagement.calculateRoute(
                locations[0],
                locations[1],
                TransportMode.DRIVING
            )

            expect(result).toBeDefined()
            expect(result!.distance).toBeGreaterThan(0)
            expect(result!.duration).toBeGreaterThan(0)
            expect(result!.transportMode).toBe(TransportMode.DRIVING)
        })

        it('should handle calculation errors', async () => {
            const routeManagement = useRouteManagement()
            const invalidLocation = {
                ...testLocations[0],
                coordinates: { lat: NaN, lng: NaN }
            }

            const result = await routeManagement.calculateRoute(
                invalidLocation,
                testLocations[1]
            )

            expect(result).toBeNull()
            expect(routeManagement.calculationError.value).toBeDefined()
        })
    })

    describe('route management', () => {
        it('should add route successfully', async () => {
            const routeManagement = useRouteManagement()
            const locations = routeManagement.locations.value

            const success = await routeManagement.addRoute(
                locations[0].id,
                locations[1].id,
                TransportMode.DRIVING,
                1
            )

            expect(success).toBe(true)
            expect(routeManagement.routes.value).toHaveLength(1)
        })

        it('should prevent duplicate routes', async () => {
            const routeManagement = useRouteManagement()
            const locations = routeManagement.locations.value

            // Add first route
            await routeManagement.addRoute(
                locations[0].id,
                locations[1].id,
                TransportMode.DRIVING,
                1
            )

            // Try to add duplicate route
            const success = await routeManagement.addRoute(
                locations[0].id,
                locations[1].id,
                TransportMode.DRIVING,
                1
            )

            expect(success).toBe(false)
            expect(routeManagement.routes.value).toHaveLength(1)
        })

        it('should update route successfully', async () => {
            const routeManagement = useRouteManagement()
            const locations = routeManagement.locations.value

            // Add route first
            await routeManagement.addRoute(
                locations[0].id,
                locations[1].id,
                TransportMode.DRIVING,
                1
            )

            const route = routeManagement.routes.value[0]
            const success = await routeManagement.updateRoute(route.id, {
                transportMode: TransportMode.WALKING
            })

            expect(success).toBe(true)
            expect(routeManagement.routes.value[0].transportMode).toBe(TransportMode.WALKING)
        })

        it('should remove route successfully', () => {
            const routeManagement = useRouteManagement()
            const locations = routeManagement.locations.value

            // Add a route to the store directly for testing using actual location IDs
            planStore.addRoute({
                fromLocationId: locations[0].id,
                toLocationId: locations[1].id,
                distance: 10,
                duration: 30,
                transportMode: TransportMode.DRIVING,
                dayNumber: 1
            })

            const routes = routeManagement.routes.value
            expect(routes.length).toBeGreaterThan(0)

            const route = routes[0]
            expect(route).toBeDefined()

            const success = routeManagement.removeRoute(route.id)

            expect(success).toBe(true)
            expect(routeManagement.routes.value).toHaveLength(0)
        })
    })

    describe('auto connect functionality', () => {
        it('should connect all locations', async () => {
            const routeManagement = useRouteManagement()

            const success = await routeManagement.connectAllLocations(TransportMode.DRIVING)

            expect(success).toBe(true)
            expect(routeManagement.routes.value.length).toBeGreaterThan(0)
        })

        it('should handle insufficient locations', async () => {
            // Clear locations
            planStore.clearCurrentPlan()
            planStore.createPlan('测试计划', 1)
            planStore.addLocation({
                name: '单个地点',
                type: LocationType.START,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })

            const routeManagement = useRouteManagement()
            const success = await routeManagement.connectAllLocations()

            expect(success).toBe(false)
        })
    })

    describe('route optimization', () => {
        it('should optimize route order', async () => {
            const routeManagement = useRouteManagement()

            const success = await routeManagement.optimizeRouteOrder(TransportMode.DRIVING)

            expect(success).toBe(true)
            expect(routeManagement.routes.value.length).toBeGreaterThan(0)
        })

        it('should handle optimization without start location', async () => {
            // Create plan with only waypoints
            planStore.clearCurrentPlan()
            planStore.createPlan('测试计划', 1)
            planStore.addLocation({
                name: '地点1',
                type: LocationType.WAYPOINT,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })
            planStore.addLocation({
                name: '地点2',
                type: LocationType.WAYPOINT,
                coordinates: { lat: 39.9163, lng: 116.3972 }
            })

            const routeManagement = useRouteManagement()
            const success = await routeManagement.optimizeRouteOrder()

            expect(success).toBe(true)
        })
    })

    describe('transport mode changes', () => {
        it('should change transport mode for all routes', async () => {
            const routeManagement = useRouteManagement()

            // Add some routes first
            await routeManagement.connectAllLocations(TransportMode.DRIVING)

            const success = await routeManagement.changeTransportMode(TransportMode.WALKING)

            expect(success).toBe(true)
            routeManagement.routes.value.forEach(route => {
                expect(route.transportMode).toBe(TransportMode.WALKING)
            })
        })

        it('should change transport mode for specific routes', async () => {
            const routeManagement = useRouteManagement()

            // Add routes first
            await routeManagement.connectAllLocations(TransportMode.DRIVING)
            const routeIds = [routeManagement.routes.value[0].id]

            const success = await routeManagement.changeTransportMode(
                TransportMode.WALKING,
                routeIds
            )

            expect(success).toBe(true)
            expect(routeManagement.routes.value[0].transportMode).toBe(TransportMode.WALKING)
        })
    })

    describe('utility functions', () => {
        it('should format distance correctly', () => {
            const routeManagement = useRouteManagement()

            expect(routeManagement.formatDistance(0.5)).toBe('500m')
            expect(routeManagement.formatDistance(1.5)).toBe('1.5km')
            expect(routeManagement.formatDistance(10)).toBe('10.0km')
        })

        it('should format duration correctly', () => {
            const routeManagement = useRouteManagement()

            expect(routeManagement.formatDuration(30)).toBe('30分钟')
            expect(routeManagement.formatDuration(60)).toBe('1小时')
            expect(routeManagement.formatDuration(90)).toBe('1小时30分钟')
            expect(routeManagement.formatDuration(120)).toBe('2小时')
        })

        it('should get transport mode labels', () => {
            const routeManagement = useRouteManagement()

            expect(routeManagement.getTransportModeLabel(TransportMode.WALKING)).toBe('步行')
            expect(routeManagement.getTransportModeLabel(TransportMode.DRIVING)).toBe('驾车')
            expect(routeManagement.getTransportModeLabel(TransportMode.TRANSIT)).toBe('公交')
        })
    })

    describe('route queries', () => {
        beforeEach(async () => {
            const routeManagement = useRouteManagement()
            await routeManagement.connectAllLocations(TransportMode.DRIVING)
        })

        it('should get route by id', () => {
            const routeManagement = useRouteManagement()
            const routes = routeManagement.routes.value

            if (routes.length > 0) {
                const route = routeManagement.getRouteById(routes[0].id)
                expect(route).toBeDefined()
                expect(route!.id).toBe(routes[0].id)
            }
        })

        it('should get routes for specific day', () => {
            const routeManagement = useRouteManagement()
            const dayRoutes = routeManagement.getRoutesForDay(1)

            expect(dayRoutes.length).toBeGreaterThanOrEqual(0)
            dayRoutes.forEach(route => {
                expect(route.dayNumber).toBe(1)
            })
        })

        it('should get routes between locations', () => {
            const routeManagement = useRouteManagement()
            const locations = routeManagement.locations.value

            if (locations.length >= 2) {
                const routes = routeManagement.getRoutesBetweenLocations(
                    locations[0].id,
                    locations[1].id
                )

                routes.forEach(route => {
                    expect(route.fromLocationId).toBe(locations[0].id)
                    expect(route.toLocationId).toBe(locations[1].id)
                })
            }
        })
    })

    describe('validation', () => {
        it('should validate route data', () => {
            const routeManagement = useRouteManagement()

            const validRoute = {
                fromLocationId: 'loc1',
                toLocationId: 'loc2',
                distance: 10,
                duration: 30,
                transportMode: TransportMode.DRIVING,
                dayNumber: 1
            }

            const result = routeManagement.validateRoute(validRoute)
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should detect invalid route data', () => {
            const routeManagement = useRouteManagement()

            const invalidRoute = {
                fromLocationId: '',
                toLocationId: 'loc2',
                distance: -5,
                duration: -10
            }

            const result = routeManagement.validateRoute(invalidRoute)
            expect(result.isValid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
        })
    })
})
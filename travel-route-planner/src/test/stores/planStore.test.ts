/**
 * PlanStore 单元测试
 * PlanStore unit tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlanStore } from '@/stores/planStore'
import type { Location, Route } from '@/types'
import { LocationType, TransportMode } from '@/types'

// Mock nanoid
vi.mock('nanoid', () => ({
    nanoid: () => 'test-id-' + Math.random().toString(36).substr(2, 9)
}))

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

describe('PlanStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        localStorageMock.getItem.mockClear()
        localStorageMock.setItem.mockClear()
        localStorageMock.removeItem.mockClear()
        localStorageMock.clear.mockClear()
    })

    describe('初始状态', () => {
        it('应该有正确的初始状态', () => {
            const store = usePlanStore()

            expect(store.currentPlan).toBeNull()
            expect(store.savedPlans).toEqual([])
            expect(store.isLoading).toBe(false)
            expect(store.error).toBeNull()
            expect(store.hasCurrentPlan).toBe(false)
        })
    })

    describe('创建规划', () => {
        it('应该能创建新的旅游规划', () => {
            const store = usePlanStore()

            store.createPlan('测试规划', 3)

            expect(store.currentPlan).not.toBeNull()
            expect(store.currentPlan?.name).toBe('测试规划')
            expect(store.currentPlan?.totalDays).toBe(3)
            expect(store.currentPlan?.locations).toEqual([])
            expect(store.currentPlan?.routes).toEqual([])
            expect(store.hasCurrentPlan).toBe(true)
            expect(store.error).toBeNull()
        })
    })

    describe('地点管理', () => {
        beforeEach(() => {
            const store = usePlanStore()
            store.createPlan('测试规划', 3)
        })

        it('应该能添加地点', () => {
            const store = usePlanStore()

            const locationData = {
                name: '北京',
                type: LocationType.START,
                coordinates: { lat: 39.9042, lng: 116.4074 },
                address: '北京市',
                dayNumber: 1
            }

            store.addLocation(locationData)

            expect(store.currentLocations).toHaveLength(1)
            expect(store.currentLocations[0].name).toBe('北京')
            expect(store.currentLocations[0].type).toBe(LocationType.START)
            expect(store.startLocation).not.toBeUndefined()
            expect(store.error).toBeNull()
        })

        it('应该阻止添加多个出发点', () => {
            const store = usePlanStore()

            // 添加第一个出发点
            store.addLocation({
                name: '北京',
                type: LocationType.START,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })

            // 尝试添加第二个出发点
            store.addLocation({
                name: '上海',
                type: LocationType.START,
                coordinates: { lat: 31.2304, lng: 121.4737 }
            })

            expect(store.currentLocations).toHaveLength(1)
            expect(store.error).toBe('只能有一个出发点')
        })

        it('应该阻止添加多个终点', () => {
            const store = usePlanStore()

            // 添加第一个终点
            store.addLocation({
                name: '北京',
                type: LocationType.END,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })

            // 尝试添加第二个终点
            store.addLocation({
                name: '上海',
                type: LocationType.END,
                coordinates: { lat: 31.2304, lng: 121.4737 }
            })

            expect(store.currentLocations).toHaveLength(1)
            expect(store.error).toBe('只能有一个终点')
        })

        it('应该能更新地点信息', () => {
            const store = usePlanStore()

            store.addLocation({
                name: '北京',
                type: LocationType.START,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })

            const locationId = store.currentLocations[0].id

            store.updateLocation(locationId, {
                name: '北京市',
                description: '首都'
            })

            expect(store.currentLocations[0].name).toBe('北京市')
            expect(store.currentLocations[0].description).toBe('首都')
            expect(store.error).toBeNull()
        })

        it('应该能删除地点', () => {
            const store = usePlanStore()

            store.addLocation({
                name: '北京',
                type: LocationType.START,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })

            const locationId = store.currentLocations[0].id

            store.removeLocation(locationId)

            expect(store.currentLocations).toHaveLength(0)
            expect(store.error).toBeNull()
        })

        it('应该正确分类地点类型', () => {
            const store = usePlanStore()

            store.addLocation({
                name: '北京',
                type: LocationType.START,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })

            store.addLocation({
                name: '上海',
                type: LocationType.WAYPOINT,
                coordinates: { lat: 31.2304, lng: 121.4737 }
            })

            store.addLocation({
                name: '广州',
                type: LocationType.END,
                coordinates: { lat: 23.1291, lng: 113.2644 }
            })

            expect(store.startLocation?.name).toBe('北京')
            expect(store.waypointLocations).toHaveLength(1)
            expect(store.waypointLocations[0].name).toBe('上海')
            expect(store.endLocation?.name).toBe('广州')
        })
    })

    describe('路线管理', () => {
        beforeEach(() => {
            const store = usePlanStore()
            store.createPlan('测试规划', 3)

            // 添加两个地点用于测试路线
            store.addLocation({
                name: '北京',
                type: LocationType.START,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })

            store.addLocation({
                name: '上海',
                type: LocationType.END,
                coordinates: { lat: 31.2304, lng: 121.4737 }
            })
        })

        it('应该能添加路线', () => {
            const store = usePlanStore()
            const locations = store.currentLocations

            store.addRoute({
                fromLocationId: locations[0].id,
                toLocationId: locations[1].id,
                distance: 1200,
                duration: 720,
                transportMode: TransportMode.DRIVING,
                dayNumber: 1
            })

            expect(store.currentRoutes).toHaveLength(1)
            expect(store.currentRoutes[0].distance).toBe(1200)
            expect(store.currentRoutes[0].duration).toBe(720)
            expect(store.error).toBeNull()
        })

        it('应该阻止添加重复路线', () => {
            const store = usePlanStore()
            const locations = store.currentLocations

            const routeData = {
                fromLocationId: locations[0].id,
                toLocationId: locations[1].id,
                distance: 1200,
                duration: 720,
                transportMode: TransportMode.DRIVING,
                dayNumber: 1
            }

            store.addRoute(routeData)
            store.addRoute(routeData)

            expect(store.currentRoutes).toHaveLength(1)
            expect(store.error).toBe('路线已存在')
        })

        it('应该能更新路线信息', () => {
            const store = usePlanStore()
            const locations = store.currentLocations

            store.addRoute({
                fromLocationId: locations[0].id,
                toLocationId: locations[1].id,
                distance: 1200,
                duration: 720,
                transportMode: TransportMode.DRIVING,
                dayNumber: 1
            })

            const routeId = store.currentRoutes[0].id

            store.updateRoute(routeId, {
                distance: 1300,
                transportMode: TransportMode.TRANSIT
            })

            expect(store.currentRoutes[0].distance).toBe(1300)
            expect(store.currentRoutes[0].transportMode).toBe(TransportMode.TRANSIT)
            expect(store.error).toBeNull()
        })

        it('应该能删除路线', () => {
            const store = usePlanStore()
            const locations = store.currentLocations

            store.addRoute({
                fromLocationId: locations[0].id,
                toLocationId: locations[1].id,
                distance: 1200,
                duration: 720,
                transportMode: TransportMode.DRIVING,
                dayNumber: 1
            })

            const routeId = store.currentRoutes[0].id

            store.removeRoute(routeId)

            expect(store.currentRoutes).toHaveLength(0)
            expect(store.error).toBeNull()
        })
    })

    describe('规划保存和加载', () => {
        it('应该能保存规划到本地存储', () => {
            const store = usePlanStore()

            store.createPlan('测试规划', 3)
            store.savePlan()

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'travel-plans',
                expect.any(String)
            )
            expect(store.savedPlans).toHaveLength(1)
            expect(store.error).toBeNull()
        })

        it('应该能加载规划', () => {
            const store = usePlanStore()

            // 先创建并保存一个规划
            store.createPlan('测试规划', 3)
            const planId = store.currentPlan!.id
            store.savePlan()

            // 清空当前规划
            store.clearCurrentPlan()
            expect(store.currentPlan).toBeNull()

            // 加载规划
            store.loadPlan(planId)

            expect(store.currentPlan).not.toBeNull()
            expect(store.currentPlan?.name).toBe('测试规划')
            expect(store.error).toBeNull()
        })

        it('应该能删除规划', () => {
            const store = usePlanStore()

            store.createPlan('测试规划', 3)
            const planId = store.currentPlan!.id
            store.savePlan()

            expect(store.savedPlans).toHaveLength(1)

            store.deletePlan(planId)

            expect(store.savedPlans).toHaveLength(0)
            expect(store.currentPlan).toBeNull()
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'travel-plans',
                '[]'
            )
        })
    })

    describe('错误处理', () => {
        it('应该在没有当前规划时显示错误', () => {
            const store = usePlanStore()

            store.addLocation({
                name: '北京',
                type: LocationType.START,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })

            expect(store.error).toBe('没有当前规划')
        })

        it('应该能清除错误', () => {
            const store = usePlanStore()

            store.addLocation({
                name: '北京',
                type: LocationType.START,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })

            expect(store.error).not.toBeNull()

            store.clearError()

            expect(store.error).toBeNull()
        })
    })
})
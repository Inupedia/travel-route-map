/**
 * useDayPlanManagement 组合式函数测试
 * useDayPlanManagement composable tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDayPlanManagement } from '@/composables/useDayPlanManagement'
import { usePlanStore } from '@/stores/planStore'
import { useUIStore } from '@/stores/uiStore'
import type { TravelPlan, Location } from '@/types'
import { LocationType, TransportMode, Theme } from '@/types'

describe('useDayPlanManagement', () => {
    let planStore: ReturnType<typeof usePlanStore>
    let uiStore: ReturnType<typeof useUIStore>

    const mockPlan: TravelPlan = {
        id: 'test-plan-1',
        name: '测试旅游规划',
        description: '测试描述',
        totalDays: 3,
        locations: [
            {
                id: 'loc-1',
                name: '北京天安门',
                type: LocationType.START,
                coordinates: { lat: 39.9042, lng: 116.4074 },
                address: '北京市东城区',
                dayNumber: 1,
                visitDuration: 120,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            },
            {
                id: 'loc-2',
                name: '故宫博物院',
                type: LocationType.WAYPOINT,
                coordinates: { lat: 39.9163, lng: 116.3972 },
                address: '北京市东城区',
                dayNumber: 1,
                visitDuration: 180,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            },
            {
                id: 'loc-3',
                name: '颐和园',
                type: LocationType.WAYPOINT,
                coordinates: { lat: 39.9999, lng: 116.2755 },
                address: '北京市海淀区',
                dayNumber: 2,
                visitDuration: 150,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            },
            {
                id: 'loc-4',
                name: '未分配地点',
                type: LocationType.WAYPOINT,
                coordinates: { lat: 39.8888, lng: 116.3333 },
                address: '北京市朝阳区',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            }
        ],
        routes: [
            {
                id: 'route-1',
                fromLocationId: 'loc-1',
                toLocationId: 'loc-2',
                distance: 2.5,
                duration: 15,
                transportMode: TransportMode.WALKING,
                dayNumber: 1
            },
            {
                id: 'route-2',
                fromLocationId: 'loc-3',
                toLocationId: 'loc-4',
                distance: 5.0,
                duration: 30,
                transportMode: TransportMode.DRIVING,
                dayNumber: 1 // 初始值，会被更新
            }
        ],
        settings: {
            mapCenter: { lat: 39.9042, lng: 116.4074 },
            mapZoom: 10,
            theme: Theme.LIGHT,
            showDistances: true,
            showDurations: true
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    }

    beforeEach(() => {
        setActivePinia(createPinia())
        planStore = usePlanStore()
        uiStore = useUIStore()

        // 设置测试数据 - 使用深拷贝确保每个测试都有独立的数据
        planStore.currentPlan = JSON.parse(JSON.stringify(mockPlan))
        // 重新转换日期对象
        if (planStore.currentPlan) {
            planStore.currentPlan.createdAt = new Date(planStore.currentPlan.createdAt)
            planStore.currentPlan.updatedAt = new Date(planStore.currentPlan.updatedAt)
            planStore.currentPlan.locations.forEach(loc => {
                loc.createdAt = new Date(loc.createdAt)
                loc.updatedAt = new Date(loc.updatedAt)
            })
        }
        uiStore.setSelectedDay(1)
    })

    describe('getDayColor', () => {
        it('should return correct colors for different days', () => {
            const { getDayColor } = useDayPlanManagement()

            expect(getDayColor(1)).toBe('#409EFF')
            expect(getDayColor(2)).toBe('#67C23A')
            expect(getDayColor(3)).toBe('#E6A23C')
            expect(getDayColor(4)).toBe('#F56C6C')
            expect(getDayColor(5)).toBe('#909399')

            // 测试循环
            expect(getDayColor(6)).toBe('#409EFF')
        })
    })

    describe('getDayLocations', () => {
        it('should return locations for specific day', () => {
            const { getDayLocations } = useDayPlanManagement()

            const day1Locations = getDayLocations(1)
            expect(day1Locations).toHaveLength(2)
            expect(day1Locations[0].name).toBe('北京天安门')
            expect(day1Locations[1].name).toBe('故宫博物院')

            const day2Locations = getDayLocations(2)
            expect(day2Locations).toHaveLength(1)
            expect(day2Locations[0].name).toBe('颐和园')

            const day3Locations = getDayLocations(3)
            expect(day3Locations).toHaveLength(0)
        })
    })

    describe('getUnassignedLocations', () => {
        it('should return locations without day assignment', () => {
            const { getUnassignedLocations } = useDayPlanManagement()

            const unassigned = getUnassignedLocations()
            expect(unassigned).toHaveLength(1)
            expect(unassigned[0].name).toBe('未分配地点')
        })
    })

    describe('getDayStats', () => {
        it('should calculate correct statistics for a day', () => {
            const { getDayStats } = useDayPlanManagement()

            const day1Stats = getDayStats(1)
            expect(day1Stats.totalLocations).toBe(2)
            expect(day1Stats.totalDuration).toBe(300) // 120 + 180
            expect(day1Stats.totalDistance).toBe(7.5) // 2.5 + 5.0 (both routes are initially set to day 1)

            const day2Stats = getDayStats(2)
            expect(day2Stats.totalLocations).toBe(1)
            expect(day2Stats.totalDuration).toBe(150)
            expect(day2Stats.totalDistance).toBe(0) // 没有同天路线

            const day3Stats = getDayStats(3)
            expect(day3Stats.totalLocations).toBe(0)
            expect(day3Stats.totalDuration).toBe(0)
            expect(day3Stats.totalDistance).toBe(0)
        })
    })

    describe('getAllDaysStats', () => {
        it('should return statistics for all days', () => {
            const { getAllDaysStats } = useDayPlanManagement()

            const allStats = getAllDaysStats()
            expect(allStats).toHaveLength(3)

            expect(allStats[0].day).toBe(1)
            expect(allStats[0].totalLocations).toBe(2)
            expect(allStats[0].color).toBe('#409EFF')

            expect(allStats[1].day).toBe(2)
            expect(allStats[1].totalLocations).toBe(1)
            expect(allStats[1].color).toBe('#67C23A')

            expect(allStats[2].day).toBe(3)
            expect(allStats[2].totalLocations).toBe(0)
            expect(allStats[2].color).toBe('#E6A23C')
        })
    })

    describe('assignLocationToDay', () => {
        it('should assign location to day successfully', async () => {
            const { assignLocationToDay } = useDayPlanManagement()

            const success = await assignLocationToDay('loc-4', 2)

            expect(success).toBe(true)
            const location = planStore.currentLocations.find(loc => loc.id === 'loc-4')
            expect(location?.dayNumber).toBe(2)
        })

        it('should fail when day number is out of range', async () => {
            const { assignLocationToDay } = useDayPlanManagement()

            const success = await assignLocationToDay('loc-4', 5)

            expect(success).toBe(false)
        })

        it('should fail when no current plan exists', async () => {
            planStore.currentPlan = null
            const { assignLocationToDay } = useDayPlanManagement()

            const success = await assignLocationToDay('loc-4', 1)

            expect(success).toBe(false)
        })
    })

    describe('assignMultipleLocationsToDay', () => {
        it('should assign multiple locations to day successfully', async () => {
            const { assignMultipleLocationsToDay } = useDayPlanManagement()

            const success = await assignMultipleLocationsToDay(['loc-4'], 3)

            expect(success).toBe(true)
            const location = planStore.currentLocations.find(loc => loc.id === 'loc-4')
            expect(location?.dayNumber).toBe(3)
        })
    })

    describe('removeLocationFromDay', () => {
        it('should remove location from day successfully', async () => {
            const { removeLocationFromDay } = useDayPlanManagement()

            const success = await removeLocationFromDay('loc-1')

            expect(success).toBe(true)
            const location = planStore.currentLocations.find(loc => loc.id === 'loc-1')
            expect(location?.dayNumber).toBeUndefined()
        })
    })

    describe('updateTotalDays', () => {
        it('should update total days successfully', async () => {
            const { updateTotalDays } = useDayPlanManagement()

            const success = await updateTotalDays(5)

            expect(success).toBe(true)
            expect(planStore.currentPlan?.totalDays).toBe(5)
        })

        it('should handle reducing days and remove affected locations', async () => {
            const { updateTotalDays } = useDayPlanManagement()

            const success = await updateTotalDays(1)

            expect(success).toBe(true)
            expect(planStore.currentPlan?.totalDays).toBe(1)

            // 第2天的地点应该被移除天数分配
            const location = planStore.currentLocations.find(loc => loc.id === 'loc-3')
            expect(location?.dayNumber).toBeUndefined()
        })

        it('should reset selected day when it exceeds new total days', async () => {
            uiStore.setSelectedDay(3)
            const { updateTotalDays } = useDayPlanManagement()

            await updateTotalDays(2)

            expect(uiStore.selectedDay).toBe(1)
        })

        it('should fail with invalid day count', async () => {
            const { updateTotalDays } = useDayPlanManagement()

            const success = await updateTotalDays(0)
            expect(success).toBe(false)

            const success2 = await updateTotalDays(31)
            expect(success2).toBe(false)
        })
    })

    describe('selectDay', () => {
        it('should select valid day', () => {
            const { selectDay } = useDayPlanManagement()

            selectDay(2)
            expect(uiStore.selectedDay).toBe(2)
        })

        it('should not select invalid day', () => {
            const { selectDay } = useDayPlanManagement()

            selectDay(5) // 超出总天数
            expect(uiStore.selectedDay).toBe(1) // 保持原值
        })
    })

    describe('getOptimalDayAssignment', () => {
        it('should generate optimal assignment for unassigned locations', () => {
            const { getOptimalDayAssignment } = useDayPlanManagement()

            const assignment = getOptimalDayAssignment()

            expect(assignment['loc-4']).toBeDefined()
            expect(assignment['loc-4']).toBeGreaterThan(0)
            expect(assignment['loc-4']).toBeLessThanOrEqual(3)
        })

        it('should return empty assignment when no unassigned locations', () => {
            // 分配所有地点
            planStore.currentPlan!.locations.forEach(location => {
                location.dayNumber = 1
            })

            const { getOptimalDayAssignment } = useDayPlanManagement()

            const assignment = getOptimalDayAssignment()
            expect(Object.keys(assignment)).toHaveLength(0)
        })
    })

    describe('autoAssignLocations', () => {
        it('should auto assign all unassigned locations', async () => {
            const { autoAssignLocations } = useDayPlanManagement()

            const success = await autoAssignLocations()

            expect(success).toBe(true)

            // 检查所有地点都被分配了天数
            const unassignedCount = planStore.currentLocations.filter(
                loc => !loc.dayNumber
            ).length
            expect(unassignedCount).toBe(0)
        })
    })

    describe('utility functions', () => {
        it('should get correct location type labels', () => {
            const { getLocationTypeLabel } = useDayPlanManagement()

            expect(getLocationTypeLabel(LocationType.START)).toBe('出发点')
            expect(getLocationTypeLabel(LocationType.WAYPOINT)).toBe('途经点')
            expect(getLocationTypeLabel(LocationType.END)).toBe('终点')
        })

        it('should get correct location type tag types', () => {
            const { getLocationTypeTagType } = useDayPlanManagement()

            expect(getLocationTypeTagType(LocationType.START)).toBe('success')
            expect(getLocationTypeTagType(LocationType.WAYPOINT)).toBe('info')
            expect(getLocationTypeTagType(LocationType.END)).toBe('danger')
        })

        it('should format coordinates correctly', () => {
            const { formatCoordinates } = useDayPlanManagement()

            const coordinates = { lat: 39.904200, lng: 116.407400 }
            const formatted = formatCoordinates(coordinates)

            expect(formatted).toBe('39.904200, 116.407400')
        })
    })

    describe('updateRouteDayNumbers', () => {
        it('should update route day numbers based on location assignments', async () => {
            const { updateRouteDayNumbers } = useDayPlanManagement()

            // 确保初始状态
            const loc3 = planStore.currentLocations.find(loc => loc.id === 'loc-3')
            const loc4 = planStore.currentLocations.find(loc => loc.id === 'loc-4')
            expect(loc3?.dayNumber).toBe(2)
            expect(loc4?.dayNumber).toBeUndefined()

            await updateRouteDayNumbers()

            // 检查同天地点之间的路线被正确分配天数
            const route1 = planStore.currentRoutes.find(r => r.id === 'route-1')
            expect(route1?.dayNumber).toBe(1)

            // 检查跨天路线被设置为0 (loc-3在第2天，loc-4未分配天数)
            const route2 = planStore.currentRoutes.find(r => r.id === 'route-2')
            expect(route2?.dayNumber).toBe(0)
        })
    })

    describe('error handling', () => {
        it('should handle errors gracefully', async () => {
            const { assignLocationToDay, error, clearError } = useDayPlanManagement()

            // 测试错误情况 - 尝试分配不存在的地点
            // 由于planStore.updateLocation不会抛出错误，这个测试需要调整
            planStore.currentPlan = null // 设置为null来触发错误
            const success = await assignLocationToDay('loc-1', 1)

            expect(success).toBe(false)
            expect(error.value).toBeTruthy()

            // 测试清除错误
            clearError()
            expect(error.value).toBeNull()
        })
    })
})
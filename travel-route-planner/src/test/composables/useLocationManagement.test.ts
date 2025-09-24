/**
 * useLocationManagement 组合式函数测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useLocationManagement } from '@/composables/useLocationManagement'
import { usePlanStore } from '@/stores/planStore'
import type { LocationFormData } from '@/services/locationService'
import type { LocationType } from '@/types'

// Mock Element Plus
vi.mock('element-plus', () => ({
    ElMessage: {
        success: vi.fn(),
        error: vi.fn()
    }
}))

describe('useLocationManagement', () => {
    let planStore: any
    let locationManagement: ReturnType<typeof useLocationManagement>

    beforeEach(() => {
        setActivePinia(createPinia())
        planStore = usePlanStore()
        locationManagement = useLocationManagement()

        // 创建测试规划
        planStore.createPlan('测试规划', 3)
    })

    describe('初始状态', () => {
        it('应该有正确的初始状态', () => {
            expect(locationManagement.isLoading.value).toBe(false)
            expect(locationManagement.selectedLocation.value).toBe(null)
            expect(locationManagement.showLocationForm.value).toBe(false)
            expect(locationManagement.locations.value).toHaveLength(0)
        })

        it('应该正确计算可添加的地点类型', () => {
            expect(locationManagement.canAddStart.value).toBe(true)
            expect(locationManagement.canAddEnd.value).toBe(true)
        })
    })

    describe('添加地点', () => {
        const validLocationData: LocationFormData = {
            name: '测试地点',
            type: 'waypoint' as LocationType,
            coordinates: {
                lat: 39.9042,
                lng: 116.4074
            }
        }

        it('应该成功添加地点', async () => {
            const result = await locationManagement.addLocation(validLocationData)

            expect(result).toBe(true)
            expect(locationManagement.locations.value).toHaveLength(1)
            expect(locationManagement.locations.value[0].name).toBe('测试地点')
        })

        it('应该处理添加失败', async () => {
            const invalidData = { ...validLocationData, name: '' }
            const result = await locationManagement.addLocation(invalidData)

            expect(result).toBe(false)
            expect(locationManagement.locations.value).toHaveLength(0)
        })
    })

    describe('更新地点', () => {
        let locationId: string

        beforeEach(async () => {
            const locationData: LocationFormData = {
                name: '原地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            }

            await locationManagement.addLocation(locationData)
            locationId = locationManagement.locations.value[0].id
        })

        it('应该成功更新地点', async () => {
            const updateData: LocationFormData = {
                name: '更新后的地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 40.0000, lng: 117.0000 }
            }

            const result = await locationManagement.updateLocation(locationId, updateData)

            expect(result).toBe(true)
            expect(locationManagement.locations.value[0].name).toBe('更新后的地点')
        })

        it('应该处理更新失败', async () => {
            const invalidData: LocationFormData = {
                name: '',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            }

            const result = await locationManagement.updateLocation(locationId, invalidData)

            expect(result).toBe(false)
            expect(locationManagement.locations.value[0].name).toBe('原地点') // 保持原名
        })
    })

    describe('删除地点', () => {
        let locationId: string

        beforeEach(async () => {
            const locationData: LocationFormData = {
                name: '待删除地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            }

            await locationManagement.addLocation(locationData)
            locationId = locationManagement.locations.value[0].id
        })

        it('应该成功删除地点', async () => {
            const result = await locationManagement.deleteLocation(locationId)

            expect(result).toBe(true)
            expect(locationManagement.locations.value).toHaveLength(0)
        })
    })

    describe('地点选择和编辑', () => {
        let location: any

        beforeEach(async () => {
            const locationData: LocationFormData = {
                name: '测试地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            }

            await locationManagement.addLocation(locationData)
            location = locationManagement.locations.value[0]
        })

        it('应该能够选择地点', () => {
            locationManagement.selectLocation(location)

            expect(locationManagement.selectedLocation.value).toBe(location)
        })

        it('应该能够编辑地点', () => {
            locationManagement.editLocation(location)

            expect(locationManagement.selectedLocation.value).toBe(location)
            expect(locationManagement.showLocationForm.value).toBe(true)
        })

        it('应该能够打开添加表单', () => {
            locationManagement.openAddLocationForm()

            expect(locationManagement.selectedLocation.value).toBe(null)
            expect(locationManagement.showLocationForm.value).toBe(true)
        })

        it('应该能够关闭表单', () => {
            locationManagement.editLocation(location)
            locationManagement.closeLocationForm()

            expect(locationManagement.selectedLocation.value).toBe(null)
            expect(locationManagement.showLocationForm.value).toBe(false)
        })
    })

    describe('按类型分组', () => {
        beforeEach(async () => {
            await locationManagement.addLocation({
                name: '出发点',
                type: 'start' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })
            await locationManagement.addLocation({
                name: '途经点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 40.0000, lng: 117.0000 }
            })
            await locationManagement.addLocation({
                name: '终点',
                type: 'end' as LocationType,
                coordinates: { lat: 41.0000, lng: 118.0000 }
            })
        })

        it('应该正确分组地点', () => {
            const byType = locationManagement.locationsByType.value

            expect(byType.start).toHaveLength(1)
            expect(byType.waypoint).toHaveLength(1)
            expect(byType.end).toHaveLength(1)
            expect(byType.start[0].name).toBe('出发点')
        })

        it('应该正确计算可添加状态', () => {
            expect(locationManagement.canAddStart.value).toBe(false)
            expect(locationManagement.canAddEnd.value).toBe(false)
        })
    })

    describe('按天数管理', () => {
        let locationId: string

        beforeEach(async () => {
            await locationManagement.addLocation({
                name: '测试地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })
            locationId = locationManagement.locations.value[0].id
        })

        it('应该能够分配地点到天数', async () => {
            const result = await locationManagement.assignLocationToDay(locationId, 2)

            expect(result).toBe(true)
            expect(locationManagement.locations.value[0].dayNumber).toBe(2)
        })

        it('应该能够取消天数分配', async () => {
            await locationManagement.assignLocationToDay(locationId, 2)
            const result = await locationManagement.removeLocationFromDay(locationId)

            expect(result).toBe(true)
            expect(locationManagement.locations.value[0].dayNumber).toBeUndefined()
        })

        it('应该能够获取特定天数的地点', async () => {
            await locationManagement.assignLocationToDay(locationId, 2)
            const dayLocations = locationManagement.getLocationsForDay(2)

            expect(dayLocations).toHaveLength(1)
            expect(dayLocations[0].name).toBe('测试地点')
        })

        it('应该能够获取未分配的地点', async () => {
            const unassigned = locationManagement.getUnassignedLocations()

            expect(unassigned).toHaveLength(1)
            expect(unassigned[0].name).toBe('测试地点')
        })
    })

    describe('表单处理', () => {
        it('应该处理表单提交（添加模式）', async () => {
            const locationData: LocationFormData = {
                name: '新地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            }

            const result = await locationManagement.handleLocationSubmit(locationData)

            expect(result).toBe(true)
            expect(locationManagement.locations.value).toHaveLength(1)
        })

        it('应该处理表单提交（编辑模式）', async () => {
            // 先添加一个地点
            await locationManagement.addLocation({
                name: '原地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })

            const location = locationManagement.locations.value[0]
            locationManagement.selectLocation(location)

            const updateData: LocationFormData = {
                name: '更新后的地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 40.0000, lng: 117.0000 }
            }

            const result = await locationManagement.handleLocationSubmit(updateData)

            expect(result).toBe(true)
            expect(locationManagement.locations.value[0].name).toBe('更新后的地点')
        })

        it('应该处理表单取消', () => {
            locationManagement.openAddLocationForm()
            locationManagement.handleLocationCancel()

            expect(locationManagement.showLocationForm.value).toBe(false)
            expect(locationManagement.selectedLocation.value).toBe(null)
        })

        it('应该处理地点删除', async () => {
            await locationManagement.addLocation({
                name: '待删除地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })

            const locationId = locationManagement.locations.value[0].id
            const result = await locationManagement.handleLocationDelete(locationId)

            expect(result).toBe(true)
            expect(locationManagement.locations.value).toHaveLength(0)
        })
    })

    describe('工具方法', () => {
        beforeEach(async () => {
            await locationManagement.addLocation({
                name: '测试地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })
        })

        it('应该能够根据ID获取地点', () => {
            const locationId = locationManagement.locations.value[0].id
            const location = locationManagement.getLocationById(locationId)

            expect(location).toBeDefined()
            expect(location?.name).toBe('测试地点')
        })

        it('应该能够获取地点类型标签', () => {
            expect(locationManagement.getLocationTypeLabel('start')).toBe('出发点')
            expect(locationManagement.getLocationTypeLabel('waypoint')).toBe('途经点')
            expect(locationManagement.getLocationTypeLabel('end')).toBe('终点')
        })

        it('应该能够格式化坐标', () => {
            const coordinates = { lat: 39.904200, lng: 116.407400 }
            const formatted = locationManagement.formatCoordinates(coordinates)

            expect(formatted).toBe('39.904200, 116.407400')
        })

        it('应该能够计算距离', () => {
            const coord1 = { lat: 39.9042, lng: 116.4074 }
            const coord2 = { lat: 40.0000, lng: 117.0000 }
            const distance = locationManagement.calculateDistance(coord1, coord2)

            expect(distance).toBeGreaterThan(0)
        })

        it('应该能够验证地点数据', () => {
            const validData: LocationFormData = {
                name: '测试地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            }

            const result = locationManagement.validateLocationData(validData)

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })
    })

    describe('统计信息', () => {
        beforeEach(async () => {
            await locationManagement.addLocation({
                name: '出发点',
                type: 'start' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 },
                dayNumber: 1
            })
            await locationManagement.addLocation({
                name: '途经点1',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 40.0000, lng: 117.0000 },
                dayNumber: 1
            })
            await locationManagement.addLocation({
                name: '途经点2',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 41.0000, lng: 118.0000 }
            })
            await locationManagement.addLocation({
                name: '终点',
                type: 'end' as LocationType,
                coordinates: { lat: 42.0000, lng: 119.0000 },
                dayNumber: 2
            })
        })

        it('应该正确计算统计信息', () => {
            const stats = locationManagement.getLocationStats()

            expect(stats.total).toBe(4)
            expect(stats.start).toBe(1)
            expect(stats.waypoint).toBe(2)
            expect(stats.end).toBe(1)
            expect(stats.assigned).toBe(3)
            expect(stats.unassigned).toBe(1)
        })
    })
})
/**
 * LocationService 测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { LocationService, type LocationFormData } from '@/services/locationService'
import { usePlanStore } from '@/stores/planStore'
import type { LocationType } from '@/types'

describe('LocationService', () => {
    let locationService: LocationService
    let planStore: any

    beforeEach(() => {
        setActivePinia(createPinia())
        planStore = usePlanStore()
        locationService = new LocationService()

        // 创建测试规划
        planStore.createPlan('测试规划', 3)
    })

    describe('validateLocation', () => {
        const validLocationData: LocationFormData = {
            name: '测试地点',
            type: 'waypoint' as LocationType,
            coordinates: {
                lat: 39.9042,
                lng: 116.4074
            },
            address: '测试地址',
            description: '测试描述',
            tags: ['标签1', '标签2'],
            dayNumber: 1,
            visitDuration: 120
        }

        it('应该验证有效的地点数据', () => {
            const result = locationService.validateLocation(validLocationData)

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('应该验证地点名称', () => {
            const invalidData = { ...validLocationData, name: '' }
            const result = locationService.validateLocation(invalidData)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('地点名称不能为空')
        })

        it('应该验证地点名称长度', () => {
            const invalidData = { ...validLocationData, name: 'a'.repeat(51) }
            const result = locationService.validateLocation(invalidData)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('地点名称不能超过50个字符')
        })

        it('应该验证坐标格式', () => {
            const invalidData = { ...validLocationData, coordinates: { lat: NaN, lng: NaN } }
            const result = locationService.validateLocation(invalidData)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('纬度必须是有效数字')
            expect(result.errors).toContain('经度必须是有效数字')
        })

        it('应该验证坐标范围', () => {
            const invalidData = { ...validLocationData, coordinates: { lat: 100, lng: 200 } }
            const result = locationService.validateLocation(invalidData)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('纬度必须在-90到90之间')
            expect(result.errors).toContain('经度必须在-180到180之间')
        })

        it('应该验证出发点唯一性', () => {
            // 先添加一个出发点
            planStore.addLocation({
                name: '现有出发点',
                type: 'start',
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })

            const invalidData = { ...validLocationData, type: 'start' as LocationType }
            const result = locationService.validateLocation(invalidData)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('只能有一个出发点')
        })

        it('应该验证终点唯一性', () => {
            // 先添加一个终点
            planStore.addLocation({
                name: '现有终点',
                type: 'end',
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })

            const invalidData = { ...validLocationData, type: 'end' as LocationType }
            const result = locationService.validateLocation(invalidData)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('只能有一个终点')
        })

        it('应该验证天数范围', () => {
            const invalidData = { ...validLocationData, dayNumber: 5 } // 超出总天数3
            const result = locationService.validateLocation(invalidData)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('天数必须在1到3之间')
        })

        it('应该验证游览时长', () => {
            const invalidData = { ...validLocationData, visitDuration: 2000 } // 超出最大值
            const result = locationService.validateLocation(invalidData)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('游览时长必须在0到1440分钟之间')
        })

        it('应该验证标签长度和数量', () => {
            const invalidData = {
                ...validLocationData,
                tags: Array(11).fill('标签').concat(['a'.repeat(21)]) // 11个标签，其中一个超长
            }
            const result = locationService.validateLocation(invalidData)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('标签数量不能超过10个')
            expect(result.errors).toContain('标签长度不能超过20个字符')
        })
    })

    describe('addLocation', () => {
        const validLocationData: LocationFormData = {
            name: '新地点',
            type: 'waypoint' as LocationType,
            coordinates: {
                lat: 39.9042,
                lng: 116.4074
            }
        }

        it('应该成功添加有效地点', async () => {
            const result = await locationService.addLocation(validLocationData)

            expect(result.success).toBe(true)
            expect(result.error).toBeUndefined()
            expect(planStore.currentLocations).toHaveLength(1)
            expect(planStore.currentLocations[0].name).toBe('新地点')
        })

        it('应该拒绝无效地点', async () => {
            const invalidData = { ...validLocationData, name: '' }
            const result = await locationService.addLocation(invalidData)

            expect(result.success).toBe(false)
            expect(result.error).toContain('地点名称不能为空')
            expect(planStore.currentLocations).toHaveLength(0)
        })

        it('应该清理地点数据', async () => {
            const dataWithWhitespace = {
                ...validLocationData,
                name: '  地点名称  ',
                address: '  地址  ',
                description: '  描述  ',
                tags: ['  标签1  ', '', '  标签2  ']
            }

            const result = await locationService.addLocation(dataWithWhitespace)

            expect(result.success).toBe(true)
            const addedLocation = planStore.currentLocations[0]
            expect(addedLocation.name).toBe('地点名称')
            expect(addedLocation.address).toBe('地址')
            expect(addedLocation.description).toBe('描述')
            expect(addedLocation.tags).toEqual(['标签1', '标签2'])
        })
    })

    describe('updateLocation', () => {
        let locationId: string

        beforeEach(async () => {
            const result = await locationService.addLocation({
                name: '原地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })
            expect(result.success).toBe(true)
            locationId = planStore.currentLocations[0].id
        })

        it('应该成功更新地点', async () => {
            const updateData: LocationFormData = {
                name: '更新后的地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 40.0000, lng: 117.0000 }
            }

            const result = await locationService.updateLocation(locationId, updateData)

            expect(result.success).toBe(true)
            const updatedLocation = planStore.currentLocations[0]
            expect(updatedLocation.name).toBe('更新后的地点')
            expect(updatedLocation.coordinates.lat).toBe(40.0000)
        })

        it('应该拒绝无效更新', async () => {
            const invalidData: LocationFormData = {
                name: '',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            }

            const result = await locationService.updateLocation(locationId, invalidData)

            expect(result.success).toBe(false)
            expect(result.error).toContain('地点名称不能为空')
        })
    })

    describe('deleteLocation', () => {
        let locationId: string

        beforeEach(async () => {
            const result = await locationService.addLocation({
                name: '待删除地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })
            expect(result.success).toBe(true)
            locationId = planStore.currentLocations[0].id
        })

        it('应该成功删除地点', async () => {
            const result = await locationService.deleteLocation(locationId)

            expect(result.success).toBe(true)
            expect(planStore.currentLocations).toHaveLength(0)
        })
    })

    describe('getLocationsByType', () => {
        beforeEach(async () => {
            await locationService.addLocation({
                name: '出发点',
                type: 'start' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })
            await locationService.addLocation({
                name: '途经点1',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 40.0000, lng: 117.0000 }
            })
            await locationService.addLocation({
                name: '途经点2',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 41.0000, lng: 118.0000 }
            })
            await locationService.addLocation({
                name: '终点',
                type: 'end' as LocationType,
                coordinates: { lat: 42.0000, lng: 119.0000 }
            })
        })

        it('应该按类型正确分组地点', () => {
            const grouped = locationService.getLocationsByType()

            expect(grouped.start).toHaveLength(1)
            expect(grouped.waypoint).toHaveLength(2)
            expect(grouped.end).toHaveLength(1)
            expect(grouped.start[0].name).toBe('出发点')
            expect(grouped.end[0].name).toBe('终点')
        })
    })

    describe('getLocationsByDay', () => {
        beforeEach(async () => {
            await locationService.addLocation({
                name: '第1天地点1',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 },
                dayNumber: 1
            })
            await locationService.addLocation({
                name: '第1天地点2',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 40.0000, lng: 117.0000 },
                dayNumber: 1
            })
            await locationService.addLocation({
                name: '第2天地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 41.0000, lng: 118.0000 },
                dayNumber: 2
            })
            await locationService.addLocation({
                name: '未分配地点',
                type: 'waypoint' as LocationType,
                coordinates: { lat: 42.0000, lng: 119.0000 }
            })
        })

        it('应该按天数正确分组地点', () => {
            const grouped = locationService.getLocationsByDay()

            expect(grouped.get(1)).toHaveLength(2)
            expect(grouped.get(2)).toHaveLength(1)
            expect(grouped.has(3)).toBe(false)
        })
    })

    describe('canAddLocationType', () => {
        it('应该正确检查是否可以添加地点类型', () => {
            expect(locationService.canAddLocationType('start')).toBe(true)
            expect(locationService.canAddLocationType('end')).toBe(true)
            expect(locationService.canAddLocationType('waypoint')).toBe(true)
        })

        it('添加出发点后应该不能再添加', async () => {
            await locationService.addLocation({
                name: '出发点',
                type: 'start' as LocationType,
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })

            expect(locationService.canAddLocationType('start')).toBe(false)
            expect(locationService.canAddLocationType('end')).toBe(true)
            expect(locationService.canAddLocationType('waypoint')).toBe(true)
        })
    })

    describe('calculateDistance', () => {
        it('应该正确计算两点间距离', () => {
            const coord1 = { lat: 39.9042, lng: 116.4074 } // 北京
            const coord2 = { lat: 31.2304, lng: 121.4737 } // 上海

            const distance = locationService.calculateDistance(coord1, coord2)

            // 北京到上海大约1000多公里
            expect(distance).toBeGreaterThan(1000)
            expect(distance).toBeLessThan(1500)
        })

        it('相同坐标距离应该为0', () => {
            const coord = { lat: 39.9042, lng: 116.4074 }
            const distance = locationService.calculateDistance(coord, coord)

            expect(distance).toBe(0)
        })
    })

    describe('validateCoordinates', () => {
        it('应该验证有效坐标', () => {
            expect(locationService.validateCoordinates(39.9042, 116.4074)).toBe(true)
            expect(locationService.validateCoordinates(0, 0)).toBe(true)
            expect(locationService.validateCoordinates(-90, -180)).toBe(true)
            expect(locationService.validateCoordinates(90, 180)).toBe(true)
        })

        it('应该拒绝无效坐标', () => {
            expect(locationService.validateCoordinates(NaN, 116.4074)).toBe(false)
            expect(locationService.validateCoordinates(39.9042, NaN)).toBe(false)
            expect(locationService.validateCoordinates(91, 116.4074)).toBe(false)
            expect(locationService.validateCoordinates(39.9042, 181)).toBe(false)
            expect(locationService.validateCoordinates(-91, 116.4074)).toBe(false)
            expect(locationService.validateCoordinates(39.9042, -181)).toBe(false)
        })
    })

    describe('formatCoordinates', () => {
        it('应该正确格式化坐标', () => {
            const coordinates = { lat: 39.904200, lng: 116.407400 }
            const formatted = locationService.formatCoordinates(coordinates)

            expect(formatted).toBe('39.904200, 116.407400')
        })
    })

    describe('getLocationTypeLabel', () => {
        it('应该返回正确的类型标签', () => {
            expect(locationService.getLocationTypeLabel('start')).toBe('出发点')
            expect(locationService.getLocationTypeLabel('waypoint')).toBe('途经点')
            expect(locationService.getLocationTypeLabel('end')).toBe('终点')
        })
    })
})
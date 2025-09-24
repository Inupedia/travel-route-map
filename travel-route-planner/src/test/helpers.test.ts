/**
 * 工具函数测试
 * Helper functions tests
 */

import { describe, it, expect } from 'vitest'
import {
    generateId,
    formatDate,
    calculateDistance,
    estimateTravelTime,
    formatDistance,
    formatDuration,
    getLocationTypeName,
    getTransportModeName,
    getDayColor,
    deepClone,
    isValidCoordinates,
    hasLocationOfType,
    getLocationsByType,
    groupLocationsByDay,
    calculateTotalDistance,
    calculateTotalDuration
} from '@/utils/helpers'
import { LocationType, TransportMode, type Location } from '@/types'

describe('Helper Functions', () => {
    describe('generateId', () => {
        it('should generate unique IDs', () => {
            const id1 = generateId()
            const id2 = generateId()
            expect(id1).not.toBe(id2)
            expect(typeof id1).toBe('string')
            expect(id1.length).toBeGreaterThan(0)
        })
    })

    describe('formatDate', () => {
        it('should format date correctly', () => {
            const date = new Date('2024-01-15T10:30:00')
            const formatted = formatDate(date, 'date')
            expect(formatted).toMatch(/2024/)
            expect(formatted).toMatch(/01/)
            expect(formatted).toMatch(/15/)
        })

        it('should format datetime correctly', () => {
            const date = new Date('2024-01-15T10:30:00')
            const formatted = formatDate(date, 'datetime')
            expect(formatted).toMatch(/2024/)
            expect(formatted).toMatch(/10/)
            expect(formatted).toMatch(/30/)
        })
    })

    describe('calculateDistance', () => {
        it('should calculate distance between two points', () => {
            const point1 = { lat: 39.9042, lng: 116.4074 } // 天安门
            const point2 = { lat: 39.9163, lng: 116.3972 } // 故宫
            const distance = calculateDistance(point1, point2)

            expect(distance).toBeGreaterThan(0)
            expect(distance).toBeLessThan(5) // 应该小于5公里
        })

        it('should return 0 for same points', () => {
            const point = { lat: 39.9042, lng: 116.4074 }
            const distance = calculateDistance(point, point)
            expect(distance).toBe(0)
        })
    })

    describe('estimateTravelTime', () => {
        it('should estimate walking time correctly', () => {
            const time = estimateTravelTime(5, TransportMode.WALKING) // 5公里步行
            expect(time).toBe(60) // 1小时 = 60分钟
        })

        it('should estimate driving time correctly', () => {
            const time = estimateTravelTime(60, TransportMode.DRIVING) // 60公里驾车
            expect(time).toBe(60) // 1小时 = 60分钟
        })
    })

    describe('formatDistance', () => {
        it('should format distance in meters for short distances', () => {
            const formatted = formatDistance(0.5)
            expect(formatted).toBe('500米')
        })

        it('should format distance in kilometers for long distances', () => {
            const formatted = formatDistance(5.2)
            expect(formatted).toBe('5.2公里')
        })
    })

    describe('formatDuration', () => {
        it('should format minutes only', () => {
            const formatted = formatDuration(45)
            expect(formatted).toBe('45分钟')
        })

        it('should format hours only', () => {
            const formatted = formatDuration(120)
            expect(formatted).toBe('2小时')
        })

        it('should format hours and minutes', () => {
            const formatted = formatDuration(90)
            expect(formatted).toBe('1小时30分钟')
        })
    })

    describe('getLocationTypeName', () => {
        it('should return correct names for location types', () => {
            expect(getLocationTypeName(LocationType.START)).toBe('出发点')
            expect(getLocationTypeName(LocationType.WAYPOINT)).toBe('途经点')
            expect(getLocationTypeName(LocationType.END)).toBe('终点')
        })
    })

    describe('getTransportModeName', () => {
        it('should return correct names for transport modes', () => {
            expect(getTransportModeName(TransportMode.WALKING)).toBe('步行')
            expect(getTransportModeName(TransportMode.DRIVING)).toBe('驾车')
            expect(getTransportModeName(TransportMode.TRANSIT)).toBe('公交')
        })
    })

    describe('getDayColor', () => {
        it('should return colors for different days', () => {
            const color1 = getDayColor(1)
            const color2 = getDayColor(2)
            expect(color1).toBeTruthy()
            expect(color2).toBeTruthy()
            expect(color1).not.toBe(color2)
        })

        it('should cycle colors for days beyond available colors', () => {
            const color1 = getDayColor(1)
            const color11 = getDayColor(11) // 应该和第1天相同
            expect(color1).toBe(color11)
        })
    })

    describe('deepClone', () => {
        it('should clone simple objects', () => {
            const obj = { a: 1, b: 'test' }
            const cloned = deepClone(obj)
            expect(cloned).toEqual(obj)
            expect(cloned).not.toBe(obj)
        })

        it('should clone nested objects', () => {
            const obj = { a: { b: { c: 1 } } }
            const cloned = deepClone(obj)
            expect(cloned).toEqual(obj)
            expect(cloned.a).not.toBe(obj.a)
        })

        it('should clone arrays', () => {
            const arr = [1, 2, { a: 3 }]
            const cloned = deepClone(arr)
            expect(cloned).toEqual(arr)
            expect(cloned).not.toBe(arr)
            expect(cloned[2]).not.toBe(arr[2])
        })

        it('should clone dates', () => {
            const date = new Date()
            const cloned = deepClone(date)
            expect(cloned).toEqual(date)
            expect(cloned).not.toBe(date)
        })
    })

    describe('isValidCoordinates', () => {
        it('should validate correct coordinates', () => {
            expect(isValidCoordinates({ lat: 39.9042, lng: 116.4074 })).toBe(true)
            expect(isValidCoordinates({ lat: 0, lng: 0 })).toBe(true)
            expect(isValidCoordinates({ lat: -90, lng: -180 })).toBe(true)
            expect(isValidCoordinates({ lat: 90, lng: 180 })).toBe(true)
        })

        it('should reject invalid coordinates', () => {
            expect(isValidCoordinates({ lat: 100, lng: 116.4074 })).toBe(false)
            expect(isValidCoordinates({ lat: 39.9042, lng: 200 })).toBe(false)
            expect(isValidCoordinates({ lat: NaN, lng: 116.4074 })).toBe(false)
        })
    })

    describe('location utility functions', () => {
        const locations: Location[] = [
            {
                id: '1',
                name: '出发点',
                type: LocationType.START,
                coordinates: { lat: 39.9042, lng: 116.4074 },
                dayNumber: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: '2',
                name: '途经点1',
                type: LocationType.WAYPOINT,
                coordinates: { lat: 39.9142, lng: 116.4174 },
                dayNumber: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: '3',
                name: '途经点2',
                type: LocationType.WAYPOINT,
                coordinates: { lat: 39.9242, lng: 116.4274 },
                dayNumber: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: '4',
                name: '终点',
                type: LocationType.END,
                coordinates: { lat: 39.9342, lng: 116.4374 },
                dayNumber: 2,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]

        describe('hasLocationOfType', () => {
            it('should detect existing location types', () => {
                expect(hasLocationOfType(locations, LocationType.START)).toBe(true)
                expect(hasLocationOfType(locations, LocationType.WAYPOINT)).toBe(true)
                expect(hasLocationOfType(locations, LocationType.END)).toBe(true)
            })
        })

        describe('getLocationsByType', () => {
            it('should filter locations by type', () => {
                const waypoints = getLocationsByType(locations, LocationType.WAYPOINT)
                expect(waypoints).toHaveLength(2)
                expect(waypoints.every(loc => loc.type === LocationType.WAYPOINT)).toBe(true)
            })
        })

        describe('groupLocationsByDay', () => {
            it('should group locations by day', () => {
                const grouped = groupLocationsByDay(locations)
                expect(grouped[1]).toHaveLength(2)
                expect(grouped[2]).toHaveLength(2)
            })
        })
    })

    describe('calculation functions', () => {
        const routes = [
            { distance: 5.2, duration: 30 },
            { distance: 3.8, duration: 20 },
            { distance: 7.1, duration: 40 }
        ]

        describe('calculateTotalDistance', () => {
            it('should calculate total distance', () => {
                const total = calculateTotalDistance(routes)
                expect(total).toBe(16.1)
            })
        })

        describe('calculateTotalDuration', () => {
            it('should calculate total duration', () => {
                const total = calculateTotalDuration(routes)
                expect(total).toBe(90)
            })
        })
    })
})
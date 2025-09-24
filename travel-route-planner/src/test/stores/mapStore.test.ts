/**
 * MapStore 单元测试
 * MapStore unit tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMapStore } from '@/stores/mapStore'

describe('MapStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
    })

    describe('初始状态', () => {
        it('应该有正确的初始状态', () => {
            const store = useMapStore()

            expect(store.mapInstance).toBeNull()
            expect(store.center).toEqual({ lat: 39.9042, lng: 116.4074 })
            expect(store.zoom).toBe(10)
            expect(store.selectedLocationId).toBeNull()
            expect(store.isAddingLocation).toBe(false)
            expect(store.mapMode).toBe('view')
            expect(store.isMapReady).toBe(false)
            expect(store.isEditMode).toBe(false)
            expect(store.isViewMode).toBe(true)
            expect(store.hasSelectedLocation).toBe(false)
        })
    })

    describe('地图初始化', () => {
        it('应该能初始化地图', () => {
            const store = useMapStore()
            const mockContainer = document.createElement('div')

            store.initializeMap(mockContainer)

            expect(store.mapInstance).not.toBeNull()
            expect(store.mapInstance.container).toBe(mockContainer)
            expect(store.mapInstance.initialized).toBe(true)
            expect(store.isMapReady).toBe(true)
        })

        it('应该能使用自定义选项初始化地图', () => {
            const store = useMapStore()
            const mockContainer = document.createElement('div')
            const options = {
                center: { lat: 31.2304, lng: 121.4737 },
                zoom: 12
            }

            store.initializeMap(mockContainer, options)

            expect(store.center).toEqual(options.center)
            expect(store.zoom).toBe(options.zoom)
            expect(store.mapInstance.options).toEqual(options)
        })
    })

    describe('地图操作', () => {
        beforeEach(() => {
            const store = useMapStore()
            const mockContainer = document.createElement('div')
            store.initializeMap(mockContainer)
        })

        it('应该能设置地图中心', () => {
            const store = useMapStore()
            const newCenter = { lat: 31.2304, lng: 121.4737 }

            store.setCenter(newCenter)

            expect(store.center).toEqual(newCenter)
        })

        it('应该能设置缩放级别', () => {
            const store = useMapStore()

            store.setZoom(15)

            expect(store.zoom).toBe(15)
        })

        it('应该限制缩放级别范围', () => {
            const store = useMapStore()

            store.setZoom(-5)
            expect(store.zoom).toBe(1)

            store.setZoom(25)
            expect(store.zoom).toBe(20)
        })

        it('应该能放大地图', () => {
            const store = useMapStore()
            const initialZoom = store.zoom

            store.zoomIn()

            expect(store.zoom).toBe(initialZoom + 1)
        })

        it('应该能缩小地图', () => {
            const store = useMapStore()
            const initialZoom = store.zoom

            store.zoomOut()

            expect(store.zoom).toBe(initialZoom - 1)
        })

        it('应该能平移到指定位置', () => {
            const store = useMapStore()
            const newPosition = { lat: 31.2304, lng: 121.4737 }

            store.panTo(newPosition)

            expect(store.center).toEqual(newPosition)
        })
    })

    describe('地点选择', () => {
        it('应该能选择地点', () => {
            const store = useMapStore()

            store.selectLocation('location-1')

            expect(store.selectedLocationId).toBe('location-1')
            expect(store.hasSelectedLocation).toBe(true)
        })

        it('应该能取消选择地点', () => {
            const store = useMapStore()

            store.selectLocation('location-1')
            store.selectLocation(null)

            expect(store.selectedLocationId).toBeNull()
            expect(store.hasSelectedLocation).toBe(false)
        })
    })

    describe('添加地点模式', () => {
        it('应该能切换添加地点模式', () => {
            const store = useMapStore()

            store.toggleAddLocationMode()

            expect(store.isAddingLocation).toBe(true)
            expect(store.mapMode).toBe('edit')
            expect(store.isEditMode).toBe(true)

            store.toggleAddLocationMode()

            expect(store.isAddingLocation).toBe(false)
        })

        it('应该能设置添加地点模式', () => {
            const store = useMapStore()

            store.setAddingLocation(true)

            expect(store.isAddingLocation).toBe(true)
            expect(store.mapMode).toBe('edit')

            store.setAddingLocation(false)

            expect(store.isAddingLocation).toBe(false)
        })
    })

    describe('地图模式', () => {
        it('应该能设置地图模式', () => {
            const store = useMapStore()

            store.setMapMode('edit')

            expect(store.mapMode).toBe('edit')
            expect(store.isEditMode).toBe(true)
            expect(store.isViewMode).toBe(false)
        })

        it('应该在切换到查看模式时关闭添加地点模式', () => {
            const store = useMapStore()

            store.setAddingLocation(true)
            expect(store.isAddingLocation).toBe(true)

            store.setMapMode('view')

            expect(store.mapMode).toBe('view')
            expect(store.isAddingLocation).toBe(false)
        })
    })

    describe('地图重置', () => {
        it('应该能重置地图视图', () => {
            const store = useMapStore()

            // 修改一些状态
            store.setCenter({ lat: 31.2304, lng: 121.4737 })
            store.setZoom(15)
            store.selectLocation('location-1')
            store.setAddingLocation(true)
            store.setMapMode('edit')

            // 重置
            store.resetView()

            expect(store.center).toEqual({ lat: 39.9042, lng: 116.4074 })
            expect(store.zoom).toBe(10)
            expect(store.selectedLocationId).toBeNull()
            expect(store.isAddingLocation).toBe(false)
            expect(store.mapMode).toBe('view')
        })
    })

    describe('覆盖物管理', () => {
        beforeEach(() => {
            const store = useMapStore()
            const mockContainer = document.createElement('div')
            store.initializeMap(mockContainer)
        })

        it('应该能添加标记', () => {
            const store = useMapStore()
            const coordinates = { lat: 39.9042, lng: 116.4074 }

            const marker = store.addMarker(coordinates)

            expect(marker).not.toBeNull()
            expect(marker?.coordinates).toEqual(coordinates)
        })

        it('应该能添加路线', () => {
            const store = useMapStore()
            const path = [
                { lat: 39.9042, lng: 116.4074 },
                { lat: 31.2304, lng: 121.4737 }
            ]

            const polyline = store.addPolyline(path)

            expect(polyline).not.toBeNull()
            expect(polyline?.path).toEqual(path)
        })
    })

    describe('坐标转换', () => {
        beforeEach(() => {
            const store = useMapStore()
            const mockContainer = document.createElement('div')
            store.initializeMap(mockContainer)
        })

        it('应该能转换像素坐标到地理坐标', () => {
            const store = useMapStore()
            const pixel = { x: 100, y: 100 }

            const coordinates = store.convertPixelToCoordinates(pixel)

            expect(coordinates).not.toBeNull()
            expect(typeof coordinates?.lat).toBe('number')
            expect(typeof coordinates?.lng).toBe('number')
        })

        it('应该能转换地理坐标到像素坐标', () => {
            const store = useMapStore()
            const coordinates = { lat: 39.9042, lng: 116.4074 }

            const pixel = store.convertCoordinatesToPixel(coordinates)

            expect(pixel).not.toBeNull()
            expect(typeof pixel?.x).toBe('number')
            expect(typeof pixel?.y).toBe('number')
        })
    })

    describe('地图边界', () => {
        beforeEach(() => {
            const store = useMapStore()
            const mockContainer = document.createElement('div')
            store.initializeMap(mockContainer)
        })

        it('应该能获取地图边界', () => {
            const store = useMapStore()

            const bounds = store.getMapBounds()

            expect(bounds).not.toBeNull()
            expect(bounds?.northeast).toBeDefined()
            expect(bounds?.southwest).toBeDefined()
        })

        it('应该能适应边界', () => {
            const store = useMapStore()
            const bounds = {
                northeast: { lat: 40, lng: 117 },
                southwest: { lat: 39, lng: 116 }
            }

            // 这个方法目前只是调用，没有返回值
            expect(() => store.fitBounds(bounds)).not.toThrow()
        })
    })

    describe('地图销毁', () => {
        it('应该能销毁地图实例', () => {
            const store = useMapStore()
            const mockContainer = document.createElement('div')

            store.initializeMap(mockContainer)
            expect(store.isMapReady).toBe(true)

            store.destroyMap()

            expect(store.mapInstance).toBeNull()
            expect(store.isMapReady).toBe(false)
        })
    })
})
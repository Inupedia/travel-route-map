/**
 * 地图状态管理
 * Map state management
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Coordinates, MapMode } from '@/types'

export interface MapState {
    mapInstance: any | null
    center: Coordinates
    zoom: number
    selectedLocationId: string | null
    isAddingLocation: boolean
    mapMode: MapMode
}

export const useMapStore = defineStore('map', () => {
    // State
    const mapInstance = ref<any | null>(null)
    const center = ref<Coordinates>({ lat: 39.9042, lng: 116.4074 }) // 默认北京
    const zoom = ref(10)
    const selectedLocationId = ref<string | null>(null)
    const isAddingLocation = ref(false)
    const mapMode = ref<MapMode>('view')

    // Getters
    const isMapReady = computed(() => mapInstance.value !== null)
    const isEditMode = computed(() => mapMode.value === 'edit')
    const isViewMode = computed(() => mapMode.value === 'view')
    const hasSelectedLocation = computed(() => selectedLocationId.value !== null)

    // Actions
    const initializeMap = (container: HTMLElement, mapOptions?: any) => {
        try {
            // 这里将在实际地图集成时实现具体的地图初始化逻辑
            // 目前先存储容器引用和配置
            mapInstance.value = {
                container,
                options: mapOptions || {},
                initialized: true
            }

            // 设置地图中心和缩放级别
            if (mapOptions?.center) {
                center.value = mapOptions.center
            }
            if (mapOptions?.zoom) {
                zoom.value = mapOptions.zoom
            }
        } catch (error) {
            console.error('地图初始化失败:', error)
            mapInstance.value = null
        }
    }

    const setCenter = (coordinates: Coordinates) => {
        center.value = { ...coordinates }

        // 如果地图已初始化，更新地图中心
        if (mapInstance.value && mapInstance.value.setCenter) {
            mapInstance.value.setCenter(coordinates)
        }
    }

    const setZoom = (level: number) => {
        // 限制缩放级别范围
        const clampedZoom = Math.max(1, Math.min(20, level))
        zoom.value = clampedZoom

        // 如果地图已初始化，更新地图缩放
        if (mapInstance.value && mapInstance.value.setZoom) {
            mapInstance.value.setZoom(clampedZoom)
        }
    }

    const selectLocation = (id: string | null) => {
        selectedLocationId.value = id
    }

    const toggleAddLocationMode = () => {
        isAddingLocation.value = !isAddingLocation.value

        // 如果开启添加模式，切换到编辑模式
        if (isAddingLocation.value) {
            mapMode.value = 'edit'
        }
    }

    const setAddingLocation = (adding: boolean) => {
        isAddingLocation.value = adding

        // 如果开启添加模式，切换到编辑模式
        if (adding) {
            mapMode.value = 'edit'
        }
    }

    const setMapMode = (mode: MapMode) => {
        mapMode.value = mode

        // 如果切换到查看模式，关闭添加地点模式
        if (mode === 'view') {
            isAddingLocation.value = false
        }
    }

    const fitBounds = (bounds: {
        northeast: Coordinates
        southwest: Coordinates
    }) => {
        if (mapInstance.value && mapInstance.value.fitBounds) {
            mapInstance.value.fitBounds(bounds)
        }
    }

    const panTo = (coordinates: Coordinates) => {
        setCenter(coordinates)

        if (mapInstance.value && mapInstance.value.panTo) {
            mapInstance.value.panTo(coordinates)
        }
    }

    const zoomIn = () => {
        setZoom(zoom.value + 1)
    }

    const zoomOut = () => {
        setZoom(zoom.value - 1)
    }

    const resetView = () => {
        setCenter({ lat: 39.9042, lng: 116.4074 })
        setZoom(10)
        selectLocation(null)
        setAddingLocation(false)
        setMapMode('view')
    }

    const destroyMap = () => {
        if (mapInstance.value && mapInstance.value.destroy) {
            mapInstance.value.destroy()
        }
        mapInstance.value = null
    }

    const addMarker = (coordinates: Coordinates, options?: any) => {
        if (!mapInstance.value) return null

        // 这里将在实际地图集成时实现具体的标记添加逻辑
        const marker = {
            id: Date.now().toString(),
            coordinates,
            options: options || {}
        }

        return marker
    }

    const removeMarker = (markerId: string) => {
        if (!mapInstance.value) return

        // 这里将在实际地图集成时实现具体的标记移除逻辑
        console.log('移除标记:', markerId)
    }

    const addPolyline = (path: Coordinates[], options?: any) => {
        if (!mapInstance.value) return null

        // 这里将在实际地图集成时实现具体的路线绘制逻辑
        const polyline = {
            id: Date.now().toString(),
            path,
            options: options || {}
        }

        return polyline
    }

    const removePolyline = (polylineId: string) => {
        if (!mapInstance.value) return

        // 这里将在实际地图集成时实现具体的路线移除逻辑
        console.log('移除路线:', polylineId)
    }

    const clearOverlays = () => {
        if (!mapInstance.value) return

        // 这里将在实际地图集成时实现清除所有覆盖物的逻辑
        console.log('清除所有覆盖物')
    }

    const getMapBounds = () => {
        if (!mapInstance.value) return null

        // 这里将在实际地图集成时实现获取地图边界的逻辑
        return {
            northeast: { lat: center.value.lat + 0.1, lng: center.value.lng + 0.1 },
            southwest: { lat: center.value.lat - 0.1, lng: center.value.lng - 0.1 }
        }
    }

    const convertPixelToCoordinates = (pixel: { x: number, y: number }) => {
        if (!mapInstance.value) return null

        // 这里将在实际地图集成时实现像素坐标转换的逻辑
        // 临时返回中心点坐标
        return center.value
    }

    const convertCoordinatesToPixel = (coordinates: Coordinates) => {
        if (!mapInstance.value) return null

        // 这里将在实际地图集成时实现坐标转像素的逻辑
        // 临时返回固定像素坐标
        return { x: 100, y: 100 }
    }

    return {
        // State
        mapInstance,
        center,
        zoom,
        selectedLocationId,
        isAddingLocation,
        mapMode,

        // Getters
        isMapReady,
        isEditMode,
        isViewMode,
        hasSelectedLocation,

        // Actions
        initializeMap,
        setCenter,
        setZoom,
        selectLocation,
        toggleAddLocationMode,
        setAddingLocation,
        setMapMode,
        fitBounds,
        panTo,
        zoomIn,
        zoomOut,
        resetView,
        destroyMap,
        addMarker,
        removeMarker,
        addPolyline,
        removePolyline,
        clearOverlays,
        getMapBounds,
        convertPixelToCoordinates,
        convertCoordinatesToPixel
    }
})
/**
 * 旅游规划数据状态管理
 * Travel plan data state management
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { TravelPlan, Location, Route, LocationType, TransportMode } from '@/types'
import { Theme } from '@/types'
import { nanoid } from 'nanoid'

export interface PlanState {
    currentPlan: TravelPlan | null
    savedPlans: TravelPlan[]
    isLoading: boolean
    error: string | null
}

export const usePlanStore = defineStore('plan', () => {
    // State
    const currentPlan = ref<TravelPlan | null>(null)
    const savedPlans = ref<TravelPlan[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const hasCurrentPlan = computed(() => currentPlan.value !== null)
    const currentLocations = computed(() => currentPlan.value?.locations || [])
    const currentRoutes = computed(() => currentPlan.value?.routes || [])
    const startLocation = computed(() =>
        currentLocations.value.find(loc => loc.type === 'start')
    )
    const endLocation = computed(() =>
        currentLocations.value.find(loc => loc.type === 'end')
    )
    const waypointLocations = computed(() =>
        currentLocations.value.filter(loc => loc.type === 'waypoint')
    )

    // Actions
    const createPlan = (name: string, totalDays: number) => {
        const now = new Date()
        const newPlan: TravelPlan = {
            id: nanoid(),
            name,
            description: '',
            totalDays,
            locations: [],
            routes: [],
            settings: {
                mapCenter: { lat: 39.9042, lng: 116.4074 }, // 默认北京
                mapZoom: 10,
                theme: Theme.LIGHT,
                showDistances: true,
                showDurations: true
            },
            createdAt: now,
            updatedAt: now
        }

        currentPlan.value = newPlan
        error.value = null
    }

    const addLocation = (locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!currentPlan.value) {
            error.value = '没有当前规划'
            return
        }

        // 验证必要字段
        if (!locationData.name || !locationData.coordinates) {
            error.value = '地点名称和坐标不能为空'
            return
        }

        // 验证坐标格式
        if (typeof locationData.coordinates.lat !== 'number' ||
            typeof locationData.coordinates.lng !== 'number' ||
            isNaN(locationData.coordinates.lat) ||
            isNaN(locationData.coordinates.lng)) {
            error.value = '坐标格式错误'
            return
        }

        // 验证地点类型限制
        if (locationData.type === 'start' && startLocation.value) {
            error.value = '只能有一个出发点'
            return
        }

        if (locationData.type === 'end' && endLocation.value) {
            error.value = '只能有一个终点'
            return
        }

        try {
            const now = new Date()
            const newLocation: Location = {
                ...locationData,
                id: nanoid(),
                coordinates: {
                    lat: Number(locationData.coordinates.lat),
                    lng: Number(locationData.coordinates.lng)
                },
                createdAt: now,
                updatedAt: now
            }

            currentPlan.value.locations.push(newLocation)
            currentPlan.value.updatedAt = now
            error.value = null
        } catch (err) {
            error.value = '添加地点失败: ' + (err instanceof Error ? err.message : '未知错误')
        }
    }

    const updateLocation = (id: string, updates: Partial<Location>) => {
        if (!currentPlan.value) {
            error.value = '没有当前规划'
            return
        }

        const locationIndex = currentPlan.value.locations.findIndex(loc => loc.id === id)
        if (locationIndex === -1) {
            error.value = '地点不存在'
            return
        }

        // 验证类型更新限制
        if (updates.type) {
            if (updates.type === 'start' && startLocation.value && startLocation.value.id !== id) {
                error.value = '只能有一个出发点'
                return
            }

            if (updates.type === 'end' && endLocation.value && endLocation.value.id !== id) {
                error.value = '只能有一个终点'
                return
            }
        }

        const updatedLocation = {
            ...currentPlan.value.locations[locationIndex],
            ...updates,
            updatedAt: new Date()
        }

        currentPlan.value.locations[locationIndex] = updatedLocation
        currentPlan.value.updatedAt = new Date()
        error.value = null
    }

    const removeLocation = (id: string) => {
        if (!currentPlan.value) {
            error.value = '没有当前规划'
            return
        }

        const locationIndex = currentPlan.value.locations.findIndex(loc => loc.id === id)
        if (locationIndex === -1) {
            error.value = '地点不存在'
            return
        }

        // 移除相关路线
        currentPlan.value.routes = currentPlan.value.routes.filter(
            route => route.fromLocationId !== id && route.toLocationId !== id
        )

        currentPlan.value.locations.splice(locationIndex, 1)
        currentPlan.value.updatedAt = new Date()
        error.value = null
    }

    const addRoute = (routeData: Omit<Route, 'id'>) => {
        if (!currentPlan.value) {
            error.value = '没有当前规划'
            return
        }

        // 验证地点存在
        const fromExists = currentPlan.value.locations.some(loc => loc.id === routeData.fromLocationId)
        const toExists = currentPlan.value.locations.some(loc => loc.id === routeData.toLocationId)

        if (!fromExists || !toExists) {
            error.value = '路线的起点或终点不存在'
            return
        }

        // 检查是否已存在相同路线
        const routeExists = currentPlan.value.routes.some(
            route => route.fromLocationId === routeData.fromLocationId &&
                route.toLocationId === routeData.toLocationId
        )

        if (routeExists) {
            error.value = '路线已存在'
            return
        }

        const newRoute: Route = {
            ...routeData,
            id: nanoid()
        }

        currentPlan.value.routes.push(newRoute)
        currentPlan.value.updatedAt = new Date()
        error.value = null
    }

    const updateRoute = (id: string, updates: Partial<Route>) => {
        if (!currentPlan.value) {
            error.value = '没有当前规划'
            return
        }

        const routeIndex = currentPlan.value.routes.findIndex(route => route.id === id)
        if (routeIndex === -1) {
            error.value = '路线不存在'
            return
        }

        const updatedRoute = {
            ...currentPlan.value.routes[routeIndex],
            ...updates
        }

        currentPlan.value.routes[routeIndex] = updatedRoute
        currentPlan.value.updatedAt = new Date()
        error.value = null
    }

    const removeRoute = (id: string) => {
        if (!currentPlan.value) {
            error.value = '没有当前规划'
            return
        }

        const routeIndex = currentPlan.value.routes.findIndex(route => route.id === id)
        if (routeIndex === -1) {
            error.value = '路线不存在'
            return
        }

        currentPlan.value.routes.splice(routeIndex, 1)
        currentPlan.value.updatedAt = new Date()
        error.value = null
    }

    const savePlan = () => {
        if (!currentPlan.value) {
            error.value = '没有当前规划'
            return
        }

        isLoading.value = true

        try {
            // 检查是否已存在
            const existingIndex = savedPlans.value.findIndex(plan => plan.id === currentPlan.value!.id)

            if (existingIndex >= 0) {
                // 更新现有规划
                savedPlans.value[existingIndex] = { ...currentPlan.value }
            } else {
                // 添加新规划
                savedPlans.value.push({ ...currentPlan.value })
            }

            // 保存到本地存储
            localStorage.setItem('travel-plans', JSON.stringify(savedPlans.value))
            error.value = null
        } catch (err) {
            error.value = '保存失败: ' + (err instanceof Error ? err.message : '未知错误')
        } finally {
            isLoading.value = false
        }
    }

    const loadPlan = (id: string) => {
        isLoading.value = true

        try {
            const plan = savedPlans.value.find(p => p.id === id)
            if (!plan) {
                error.value = '规划不存在'
                return
            }

            currentPlan.value = { ...plan }
            error.value = null
        } catch (err) {
            error.value = '加载失败: ' + (err instanceof Error ? err.message : '未知错误')
        } finally {
            isLoading.value = false
        }
    }

    const deletePlan = (id: string) => {
        try {
            const planIndex = savedPlans.value.findIndex(plan => plan.id === id)
            if (planIndex === -1) {
                error.value = '规划不存在'
                return
            }

            savedPlans.value.splice(planIndex, 1)

            // 如果删除的是当前规划，清空当前规划
            if (currentPlan.value?.id === id) {
                currentPlan.value = null
            }

            // 更新本地存储
            localStorage.setItem('travel-plans', JSON.stringify(savedPlans.value))
            error.value = null
        } catch (err) {
            error.value = '删除失败: ' + (err instanceof Error ? err.message : '未知错误')
        }
    }

    const loadSavedPlans = () => {
        try {
            const stored = localStorage.getItem('travel-plans')
            if (stored) {
                const plans = JSON.parse(stored) as TravelPlan[]
                savedPlans.value = plans.map(plan => ({
                    ...plan,
                    createdAt: new Date(plan.createdAt),
                    updatedAt: new Date(plan.updatedAt),
                    locations: plan.locations.map(loc => ({
                        ...loc,
                        createdAt: new Date(loc.createdAt),
                        updatedAt: new Date(loc.updatedAt)
                    }))
                }))
            }
            error.value = null
        } catch (err) {
            error.value = '加载已保存规划失败: ' + (err instanceof Error ? err.message : '未知错误')
        }
    }

    const clearError = () => {
        error.value = null
    }

    const clearCurrentPlan = () => {
        currentPlan.value = null
        error.value = null
    }

    // 初始化时加载已保存的规划
    loadSavedPlans()

    return {
        // State
        currentPlan,
        savedPlans,
        isLoading,
        error,

        // Getters
        hasCurrentPlan,
        currentLocations,
        currentRoutes,
        startLocation,
        endLocation,
        waypointLocations,

        // Actions
        createPlan,
        addLocation,
        updateLocation,
        removeLocation,
        addRoute,
        updateRoute,
        removeRoute,
        savePlan,
        loadPlan,
        deletePlan,
        loadSavedPlans,
        clearError,
        clearCurrentPlan
    }
})
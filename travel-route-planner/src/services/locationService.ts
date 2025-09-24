/**
 * 地点管理服务
 * Location management service
 */

import type { Location, LocationType } from '@/types'
import { usePlanStore } from '@/stores/planStore'

export interface LocationValidationResult {
    isValid: boolean
    errors: string[]
}

export interface LocationFormData {
    name: string
    type: LocationType
    coordinates: {
        lat: number
        lng: number
    }
    address?: string
    description?: string
    tags?: string[]
    dayNumber?: number
    visitDuration?: number
}

export class LocationService {
    private get planStore() {
        return usePlanStore()
    }

    /**
     * 验证地点数据
     */
    validateLocation(data: LocationFormData, existingLocationId?: string): LocationValidationResult {
        const errors: string[] = []

        // 验证名称
        if (!data.name || data.name.trim().length === 0) {
            errors.push('地点名称不能为空')
        } else if (data.name.trim().length > 50) {
            errors.push('地点名称不能超过50个字符')
        }

        // 验证坐标
        if (typeof data.coordinates.lat !== 'number' || isNaN(data.coordinates.lat)) {
            errors.push('纬度必须是有效数字')
        } else if (data.coordinates.lat < -90 || data.coordinates.lat > 90) {
            errors.push('纬度必须在-90到90之间')
        }

        if (typeof data.coordinates.lng !== 'number' || isNaN(data.coordinates.lng)) {
            errors.push('经度必须是有效数字')
        } else if (data.coordinates.lng < -180 || data.coordinates.lng > 180) {
            errors.push('经度必须在-180到180之间')
        }

        // 验证地点类型限制
        if (data.type === 'start') {
            const existingStart = this.planStore.startLocation
            if (existingStart && existingStart.id !== existingLocationId) {
                errors.push('只能有一个出发点')
            }
        }

        if (data.type === 'end') {
            const existingEnd = this.planStore.endLocation
            if (existingEnd && existingEnd.id !== existingLocationId) {
                errors.push('只能有一个终点')
            }
        }

        // 验证天数
        if (data.dayNumber !== undefined) {
            const totalDays = this.planStore.currentPlan?.totalDays || 1
            if (data.dayNumber < 1 || data.dayNumber > totalDays) {
                errors.push(`天数必须在1到${totalDays}之间`)
            }
        }

        // 验证游览时长
        if (data.visitDuration !== undefined) {
            if (data.visitDuration < 0 || data.visitDuration > 1440) {
                errors.push('游览时长必须在0到1440分钟之间')
            }
        }

        // 验证标签
        if (data.tags) {
            for (const tag of data.tags) {
                if (tag.length > 20) {
                    errors.push('标签长度不能超过20个字符')
                }
            }
            if (data.tags.length > 10) {
                errors.push('标签数量不能超过10个')
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }

    /**
     * 添加地点
     */
    async addLocation(data: LocationFormData): Promise<{ success: boolean; error?: string }> {
        try {
            // 验证数据
            const validation = this.validateLocation(data)
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.errors.join('; ')
                }
            }

            // 清理数据
            const cleanData = this.cleanLocationData(data)

            // 添加到store
            this.planStore.addLocation(cleanData)

            if (this.planStore.error) {
                return {
                    success: false,
                    error: this.planStore.error
                }
            }

            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '添加地点失败'
            }
        }
    }

    /**
     * 更新地点
     */
    async updateLocation(locationId: string, data: LocationFormData): Promise<{ success: boolean; error?: string }> {
        try {
            // 验证数据
            const validation = this.validateLocation(data, locationId)
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.errors.join('; ')
                }
            }

            // 清理数据
            const cleanData = this.cleanLocationData(data)

            // 更新store
            this.planStore.updateLocation(locationId, cleanData)

            if (this.planStore.error) {
                return {
                    success: false,
                    error: this.planStore.error
                }
            }

            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '更新地点失败'
            }
        }
    }

    /**
     * 删除地点
     */
    async deleteLocation(locationId: string): Promise<{ success: boolean; error?: string }> {
        try {
            this.planStore.removeLocation(locationId)

            if (this.planStore.error) {
                return {
                    success: false,
                    error: this.planStore.error
                }
            }

            return { success: true }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '删除地点失败'
            }
        }
    }

    /**
     * 获取地点列表
     */
    getLocations(): Location[] {
        return this.planStore.currentLocations
    }

    /**
     * 根据ID获取地点
     */
    getLocationById(id: string): Location | undefined {
        return this.planStore.currentLocations.find(loc => loc.id === id)
    }

    /**
     * 获取按类型分组的地点
     */
    getLocationsByType(): {
        start: Location[]
        waypoint: Location[]
        end: Location[]
    } {
        const locations = this.planStore.currentLocations
        return {
            start: locations.filter(loc => loc.type === 'start'),
            waypoint: locations.filter(loc => loc.type === 'waypoint'),
            end: locations.filter(loc => loc.type === 'end')
        }
    }

    /**
     * 获取按天数分组的地点
     */
    getLocationsByDay(): Map<number, Location[]> {
        const locations = this.planStore.currentLocations
        const locationsByDay = new Map<number, Location[]>()

        locations.forEach(location => {
            if (location.dayNumber) {
                if (!locationsByDay.has(location.dayNumber)) {
                    locationsByDay.set(location.dayNumber, [])
                }
                locationsByDay.get(location.dayNumber)!.push(location)
            }
        })

        return locationsByDay
    }

    /**
     * 检查是否可以添加特定类型的地点
     */
    canAddLocationType(type: LocationType): boolean {
        switch (type) {
            case 'start':
                return !this.planStore.startLocation
            case 'end':
                return !this.planStore.endLocation
            case 'waypoint':
                return true
            default:
                return false
        }
    }

    /**
     * 获取地点类型的显示名称
     */
    getLocationTypeLabel(type: LocationType): string {
        switch (type) {
            case 'start':
                return '出发点'
            case 'waypoint':
                return '途经点'
            case 'end':
                return '终点'
            default:
                return '未知'
        }
    }

    /**
     * 清理地点数据
     */
    private cleanLocationData(data: LocationFormData): Omit<Location, 'id' | 'createdAt' | 'updatedAt'> {
        return {
            name: data.name.trim(),
            type: data.type,
            coordinates: {
                lat: Number(data.coordinates.lat),
                lng: Number(data.coordinates.lng)
            },
            address: data.address?.trim() || undefined,
            description: data.description?.trim() || undefined,
            tags: data.tags && data.tags.length > 0 ? data.tags.filter(tag => tag.trim().length > 0).map(tag => tag.trim()) : undefined,
            dayNumber: data.dayNumber,
            visitDuration: data.visitDuration
        }
    }

    /**
     * 验证坐标格式
     */
    validateCoordinates(lat: number, lng: number): boolean {
        return !isNaN(lat) && !isNaN(lng) &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180
    }

    /**
     * 格式化坐标显示
     */
    formatCoordinates(coordinates: { lat: number; lng: number }): string {
        return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
    }

    /**
     * 计算两点间距离（简单计算）
     */
    calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
        const R = 6371 // 地球半径（公里）
        const dLat = this.toRadians(coord2.lat - coord1.lat)
        const dLng = this.toRadians(coord2.lng - coord1.lng)
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180)
    }
}

// 创建单例实例
export const locationService = new LocationService()
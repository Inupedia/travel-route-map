import type { TravelPlan } from '@/types'

/**
 * 本地存储服务
 * 负责管理旅游规划数据的本地存储和检索
 */
export class StorageService {
    private readonly STORAGE_KEY = 'travel-route-planner'
    private readonly PLANS_KEY = 'saved-plans'
    private readonly CURRENT_PLAN_KEY = 'current-plan'

    /**
     * 保存旅游规划到本地存储
     */
    async savePlan(plan: TravelPlan): Promise<void> {
        try {
            // 检查存储空间
            const storageInfo = this.getStorageInfo()
            if (storageInfo.percentage > 95) {
                throw new Error('存储空间不足，请清理数据或删除不需要的规划')
            }

            const savedPlans = await this.getSavedPlans()
            const existingIndex = savedPlans.findIndex(p => p.id === plan.id)

            if (existingIndex >= 0) {
                savedPlans[existingIndex] = { ...plan, updatedAt: new Date() }
            } else {
                savedPlans.push({ ...plan, updatedAt: new Date() })
            }

            const dataToSave = JSON.stringify(savedPlans)

            // 尝试保存，如果失败可能是存储空间不足
            try {
                localStorage.setItem(
                    `${this.STORAGE_KEY}-${this.PLANS_KEY}`,
                    dataToSave
                )
            } catch (storageError: any) {
                if ((storageError instanceof DOMException || storageError.name === 'QuotaExceededError') &&
                    (storageError.code === 22 || storageError.name === 'QuotaExceededError')) {
                    throw new Error('存储空间不足，无法保存规划。请删除一些旧规划或清理浏览器数据。')
                }
                throw storageError
            }
        } catch (error) {
            throw new Error(`保存规划失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 获取所有已保存的旅游规划
     */
    async getSavedPlans(): Promise<TravelPlan[]> {
        try {
            const data = localStorage.getItem(`${this.STORAGE_KEY}-${this.PLANS_KEY}`)
            if (!data) return []

            const plans = JSON.parse(data) as TravelPlan[]
            return plans.map(plan => ({
                ...plan,
                createdAt: new Date(plan.createdAt),
                updatedAt: new Date(plan.updatedAt),
                locations: plan.locations.map(location => ({
                    ...location,
                    createdAt: new Date(location.createdAt),
                    updatedAt: new Date(location.updatedAt)
                }))
            }))
        } catch (error) {
            console.error('获取保存的规划失败:', error)
            return []
        }
    }

    /**
     * 根据ID获取特定的旅游规划
     */
    async getPlanById(id: string): Promise<TravelPlan | null> {
        try {
            const savedPlans = await this.getSavedPlans()
            return savedPlans.find(plan => plan.id === id) || null
        } catch (error) {
            console.error('获取规划失败:', error)
            return null
        }
    }

    /**
     * 删除指定的旅游规划
     */
    async deletePlan(id: string): Promise<void> {
        try {
            const savedPlans = await this.getSavedPlans()
            const filteredPlans = savedPlans.filter(plan => plan.id !== id)

            localStorage.setItem(
                `${this.STORAGE_KEY}-${this.PLANS_KEY}`,
                JSON.stringify(filteredPlans)
            )
        } catch (error) {
            throw new Error(`删除规划失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 保存当前正在编辑的规划
     */
    async saveCurrentPlan(plan: TravelPlan | null): Promise<void> {
        try {
            if (plan) {
                localStorage.setItem(
                    `${this.STORAGE_KEY}-${this.CURRENT_PLAN_KEY}`,
                    JSON.stringify(plan)
                )
            } else {
                localStorage.removeItem(`${this.STORAGE_KEY}-${this.CURRENT_PLAN_KEY}`)
            }
        } catch (error) {
            throw new Error(`保存当前规划失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 获取当前正在编辑的规划
     */
    async getCurrentPlan(): Promise<TravelPlan | null> {
        try {
            const data = localStorage.getItem(`${this.STORAGE_KEY}-${this.CURRENT_PLAN_KEY}`)
            if (!data) return null

            const plan = JSON.parse(data) as TravelPlan
            return {
                ...plan,
                createdAt: new Date(plan.createdAt),
                updatedAt: new Date(plan.updatedAt),
                locations: plan.locations.map(location => ({
                    ...location,
                    createdAt: new Date(location.createdAt),
                    updatedAt: new Date(location.updatedAt)
                }))
            }
        } catch (error) {
            console.error('获取当前规划失败:', error)
            return null
        }
    }

    /**
     * 清理所有存储数据
     */
    async clearAllData(): Promise<void> {
        try {
            localStorage.removeItem(`${this.STORAGE_KEY}-${this.PLANS_KEY}`)
            localStorage.removeItem(`${this.STORAGE_KEY}-${this.CURRENT_PLAN_KEY}`)
        } catch (error) {
            throw new Error(`清理数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 检查存储空间使用情况
     */
    getStorageInfo(): { used: number; available: number; percentage: number; quota?: number } {
        try {
            let used = 0
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    used += localStorage[key].length + key.length
                }
            }

            // 尝试获取实际存储配额
            let quota = 5 * 1024 * 1024 // 默认5MB

            // 使用现代浏览器的存储API获取更准确的信息
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                navigator.storage.estimate().then(estimate => {
                    if (estimate.quota) {
                        quota = estimate.quota
                    }
                }).catch(() => {
                    // 忽略错误，使用默认值
                })
            }

            const available = Math.max(0, quota - used)
            const percentage = (used / quota) * 100

            return {
                used,
                available,
                percentage: Math.min(100, percentage),
                quota
            }
        } catch (error) {
            return { used: 0, available: 0, percentage: 0 }
        }
    }

    /**
     * 导出所有数据为JSON
     */
    async exportData(): Promise<string> {
        try {
            const savedPlans = await this.getSavedPlans()
            const currentPlan = await this.getCurrentPlan()

            const exportData = {
                savedPlans,
                currentPlan,
                exportDate: new Date().toISOString(),
                version: '1.0'
            }

            return JSON.stringify(exportData, null, 2)
        } catch (error) {
            throw new Error(`导出数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 从JSON导入数据
     */
    async importData(jsonData: string): Promise<void> {
        try {
            const data = JSON.parse(jsonData)

            // 验证数据格式
            if (!data || typeof data !== 'object') {
                throw new Error('无效的数据格式')
            }

            // 检查存储空间
            const storageInfo = this.getStorageInfo()
            const dataSize = jsonData.length * 2 // 估算存储大小
            if (storageInfo.available < dataSize) {
                throw new Error('存储空间不足，无法导入数据')
            }

            if (data.savedPlans && Array.isArray(data.savedPlans)) {
                // 验证每个规划的数据结构
                for (const plan of data.savedPlans) {
                    if (!plan.id || !plan.name || !Array.isArray(plan.locations)) {
                        throw new Error('数据格式错误：规划数据不完整')
                    }
                }

                localStorage.setItem(
                    `${this.STORAGE_KEY}-${this.PLANS_KEY}`,
                    JSON.stringify(data.savedPlans)
                )
            }

            if (data.currentPlan) {
                if (!data.currentPlan.id || !data.currentPlan.name) {
                    throw new Error('数据格式错误：当前规划数据不完整')
                }

                localStorage.setItem(
                    `${this.STORAGE_KEY}-${this.CURRENT_PLAN_KEY}`,
                    JSON.stringify(data.currentPlan)
                )
            }
        } catch (error) {
            throw new Error(`导入数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 获取存储统计信息
     */
    async getStorageStats(): Promise<{
        totalPlans: number
        totalLocations: number
        totalRoutes: number
        oldestPlan?: Date
        newestPlan?: Date
        averagePlanSize: number
    }> {
        try {
            const savedPlans = await this.getSavedPlans()

            if (savedPlans.length === 0) {
                return {
                    totalPlans: 0,
                    totalLocations: 0,
                    totalRoutes: 0,
                    averagePlanSize: 0
                }
            }

            const totalLocations = savedPlans.reduce((sum, plan) => sum + plan.locations.length, 0)
            const totalRoutes = savedPlans.reduce((sum, plan) => sum + plan.routes.length, 0)

            const dates = savedPlans.map(plan => plan.createdAt).sort((a, b) => a.getTime() - b.getTime())
            const oldestPlan = dates[0]
            const newestPlan = dates[dates.length - 1]

            const totalSize = JSON.stringify(savedPlans).length
            const averagePlanSize = totalSize / savedPlans.length

            return {
                totalPlans: savedPlans.length,
                totalLocations,
                totalRoutes,
                oldestPlan,
                newestPlan,
                averagePlanSize
            }
        } catch (error) {
            throw new Error(`获取存储统计失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 清理旧数据（保留最近的N个规划）
     */
    async cleanupOldPlans(keepCount: number = 10): Promise<number> {
        try {
            const savedPlans = await this.getSavedPlans()

            if (savedPlans.length <= keepCount) {
                return 0
            }

            // 按更新时间排序，保留最新的
            const sortedPlans = savedPlans.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            const plansToKeep = sortedPlans.slice(0, keepCount)
            const removedCount = savedPlans.length - keepCount

            localStorage.setItem(
                `${this.STORAGE_KEY}-${this.PLANS_KEY}`,
                JSON.stringify(plansToKeep)
            )

            return removedCount
        } catch (error) {
            throw new Error(`清理旧数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 压缩存储数据（移除不必要的字段）
     */
    async compressData(): Promise<number> {
        try {
            const savedPlans = await this.getSavedPlans()
            const originalSize = JSON.stringify(savedPlans).length

            // 移除可选的空字段来减少存储大小
            const compressedPlans = savedPlans.map(plan => ({
                ...plan,
                description: plan.description || undefined,
                locations: plan.locations.map(loc => ({
                    ...loc,
                    address: loc.address || undefined,
                    description: loc.description || undefined,
                    images: loc.images?.length ? loc.images : undefined,
                    tags: loc.tags?.length ? loc.tags : undefined
                })),
                routes: plan.routes.map(route => ({
                    ...route,
                    path: route.path?.length ? route.path : undefined
                }))
            }))

            localStorage.setItem(
                `${this.STORAGE_KEY}-${this.PLANS_KEY}`,
                JSON.stringify(compressedPlans)
            )

            const newSize = JSON.stringify(compressedPlans).length
            return originalSize - newSize
        } catch (error) {
            throw new Error(`压缩数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }
}

// 创建单例实例
export const storageService = new StorageService()
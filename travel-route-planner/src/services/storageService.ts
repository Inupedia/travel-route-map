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
            const savedPlans = await this.getSavedPlans()
            const existingIndex = savedPlans.findIndex(p => p.id === plan.id)

            if (existingIndex >= 0) {
                savedPlans[existingIndex] = { ...plan, updatedAt: new Date() }
            } else {
                savedPlans.push({ ...plan, updatedAt: new Date() })
            }

            localStorage.setItem(
                `${this.STORAGE_KEY}-${this.PLANS_KEY}`,
                JSON.stringify(savedPlans)
            )
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
    getStorageInfo(): { used: number; available: number; percentage: number } {
        try {
            let used = 0
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    used += localStorage[key].length + key.length
                }
            }

            // 估算可用空间 (大多数浏览器限制为5-10MB)
            const estimated = 5 * 1024 * 1024 // 5MB
            const available = Math.max(0, estimated - used)
            const percentage = (used / estimated) * 100

            return {
                used,
                available,
                percentage: Math.min(100, percentage)
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

            if (data.savedPlans && Array.isArray(data.savedPlans)) {
                localStorage.setItem(
                    `${this.STORAGE_KEY}-${this.PLANS_KEY}`,
                    JSON.stringify(data.savedPlans)
                )
            }

            if (data.currentPlan) {
                localStorage.setItem(
                    `${this.STORAGE_KEY}-${this.CURRENT_PLAN_KEY}`,
                    JSON.stringify(data.currentPlan)
                )
            }
        } catch (error) {
            throw new Error(`导入数据失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }
}

// 创建单例实例
export const storageService = new StorageService()
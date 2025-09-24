/**
 * 数据管理组合式函数
 * Data management composable
 */

import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storageService } from '@/services/storageService'
import { usePlanStore } from '@/stores/planStore'
import type { TravelPlan } from '@/types'

export function useDataManagement() {
    const planStore = usePlanStore()

    // 响应式状态
    const isLoading = ref(false)
    const isExporting = ref(false)
    const isImporting = ref(false)
    const isClearing = ref(false)
    const isCompressing = ref(false)

    // 计算属性
    const storageInfo = computed(() => storageService.getStorageInfo())
    const isStorageNearFull = computed(() => storageInfo.value.percentage > 80)
    const isStorageFull = computed(() => storageInfo.value.percentage > 95)

    /**
     * 导出所有数据
     */
    const exportAllData = async (): Promise<void> => {
        isExporting.value = true
        try {
            const dataStr = await storageService.exportData()
            downloadFile(dataStr, `travel_plans_backup_${getDateString()}.json`, 'application/json')
            ElMessage.success('数据导出成功')
        } catch (error) {
            ElMessage.error('导出数据失败: ' + (error instanceof Error ? error.message : '未知错误'))
            throw error
        } finally {
            isExporting.value = false
        }
    }

    /**
     * 导出单个规划
     */
    const exportPlan = async (plan: TravelPlan): Promise<void> => {
        try {
            const dataStr = JSON.stringify(plan, null, 2)
            downloadFile(dataStr, `${plan.name}_${getDateString()}.json`, 'application/json')
            ElMessage.success('规划导出成功')
        } catch (error) {
            ElMessage.error('导出规划失败: ' + (error instanceof Error ? error.message : '未知错误'))
            throw error
        }
    }

    /**
     * 导入数据
     */
    const importData = async (file: File): Promise<void> => {
        isImporting.value = true
        try {
            const fileContent = await readFileAsText(file)

            // 确认导入
            await ElMessageBox.confirm(
                '导入数据将覆盖现有的所有规划，确定要继续吗？建议先导出备份。',
                '确认导入',
                {
                    confirmButtonText: '导入',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )

            await storageService.importData(fileContent)
            await planStore.loadSavedPlans()
            ElMessage.success('数据导入成功')
        } catch (error) {
            if (error !== 'cancel') {
                ElMessage.error('导入数据失败: ' + (error instanceof Error ? error.message : '未知错误'))
                throw error
            }
        } finally {
            isImporting.value = false
        }
    }

    /**
     * 清空所有数据
     */
    const clearAllData = async (): Promise<void> => {
        isClearing.value = true
        try {
            await ElMessageBox.confirm(
                '确定要清空所有数据吗？此操作不可恢复，强烈建议先导出备份。',
                '确认清空',
                {
                    confirmButtonText: '清空',
                    cancelButtonText: '取消',
                    type: 'error',
                    confirmButtonClass: 'el-button--danger'
                }
            )

            await storageService.clearAllData()
            await planStore.loadSavedPlans()
            planStore.clearCurrentPlan()
            ElMessage.success('所有数据已清空')
        } catch (error) {
            if (error !== 'cancel') {
                ElMessage.error('清空数据失败: ' + (error instanceof Error ? error.message : '未知错误'))
                throw error
            }
        } finally {
            isClearing.value = false
        }
    }

    /**
     * 清理旧数据
     */
    const cleanupOldData = async (keepCount: number = 10): Promise<void> => {
        isLoading.value = true
        try {
            const removedCount = await storageService.cleanupOldPlans(keepCount)
            if (removedCount > 0) {
                await planStore.loadSavedPlans()
                ElMessage.success(`已清理 ${removedCount} 个旧规划`)
            } else {
                ElMessage.info('没有需要清理的旧数据')
            }
        } catch (error) {
            ElMessage.error('清理数据失败: ' + (error instanceof Error ? error.message : '未知错误'))
            throw error
        } finally {
            isLoading.value = false
        }
    }

    /**
     * 压缩数据
     */
    const compressData = async (): Promise<void> => {
        isCompressing.value = true
        try {
            const savedBytes = await storageService.compressData()
            if (savedBytes > 0) {
                await planStore.loadSavedPlans()
                ElMessage.success(`数据压缩完成，节省了 ${formatBytes(savedBytes)} 空间`)
            } else {
                ElMessage.info('数据已经是最优状态，无需压缩')
            }
        } catch (error) {
            ElMessage.error('压缩数据失败: ' + (error instanceof Error ? error.message : '未知错误'))
            throw error
        } finally {
            isCompressing.value = false
        }
    }

    /**
     * 获取存储统计信息
     */
    const getStorageStats = async () => {
        try {
            return await storageService.getStorageStats()
        } catch (error) {
            ElMessage.error('获取存储统计失败: ' + (error instanceof Error ? error.message : '未知错误'))
            throw error
        }
    }

    /**
     * 检查存储健康状态
     */
    const checkStorageHealth = async (): Promise<{
        status: 'healthy' | 'warning' | 'critical'
        message: string
        suggestions: string[]
    }> => {
        try {
            const info = storageInfo.value
            const stats = await getStorageStats()

            let status: 'healthy' | 'warning' | 'critical' = 'healthy'
            let message = '存储状态良好'
            const suggestions: string[] = []

            if (info.percentage > 95) {
                status = 'critical'
                message = '存储空间严重不足'
                suggestions.push('立即删除不需要的规划')
                suggestions.push('导出重要数据进行备份')
                suggestions.push('清理浏览器缓存')
            } else if (info.percentage > 80) {
                status = 'warning'
                message = '存储空间不足'
                suggestions.push('考虑删除一些旧规划')
                suggestions.push('定期导出数据进行备份')
            }

            if (stats.totalPlans > 50) {
                suggestions.push('规划数量较多，建议定期清理')
            }

            if (stats.averagePlanSize > 50000) { // 50KB
                suggestions.push('规划数据较大，考虑压缩数据')
            }

            return { status, message, suggestions }
        } catch (error) {
            return {
                status: 'critical',
                message: '无法检查存储状态',
                suggestions: ['请检查浏览器存储权限']
            }
        }
    }

    // 工具函数
    const downloadFile = (content: string, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.onerror = (e) => reject(e)
            reader.readAsText(file)
        })
    }

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getDateString = (): string => {
        return new Date().toISOString().split('T')[0]
    }

    return {
        // 状态
        isLoading,
        isExporting,
        isImporting,
        isClearing,
        isCompressing,

        // 计算属性
        storageInfo,
        isStorageNearFull,
        isStorageFull,

        // 方法
        exportAllData,
        exportPlan,
        importData,
        clearAllData,
        cleanupOldData,
        compressData,
        getStorageStats,
        checkStorageHealth,

        // 工具函数
        formatBytes
    }
}
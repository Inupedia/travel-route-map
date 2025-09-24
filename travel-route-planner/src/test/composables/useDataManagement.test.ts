/**
 * 数据管理组合式函数测试
 * Data management composable tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDataManagement } from '@/composables/useDataManagement'
import { storageService } from '@/services/storageService'
import { usePlanStore } from '@/stores/planStore'

// Mock dependencies
vi.mock('@/services/storageService')
vi.mock('@/stores/planStore')
vi.mock('element-plus', () => ({
    ElMessage: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn()
    },
    ElMessageBox: {
        confirm: vi.fn()
    }
}))

describe('useDataManagement', () => {
    let dataManagement: ReturnType<typeof useDataManagement>
    let mockPlanStore: any

    beforeEach(() => {
        vi.clearAllMocks()

        mockPlanStore = {
            loadSavedPlans: vi.fn(),
            clearCurrentPlan: vi.fn()
        }

        vi.mocked(usePlanStore).mockReturnValue(mockPlanStore)

        vi.mocked(storageService.getStorageInfo).mockReturnValue({
            used: 1024,
            available: 4096,
            percentage: 20
        })

        dataManagement = useDataManagement()
    })

    describe('storageInfo', () => {
        it('应该返回存储信息', () => {
            expect(dataManagement.storageInfo.value).toEqual({
                used: 1024,
                available: 4096,
                percentage: 20
            })
        })
    })

    describe('isStorageNearFull', () => {
        it('当存储使用率超过80%时应该返回true', () => {
            vi.mocked(storageService.getStorageInfo).mockReturnValue({
                used: 4096,
                available: 1024,
                percentage: 85
            })

            const { isStorageNearFull } = useDataManagement()
            expect(isStorageNearFull.value).toBe(true)
        })

        it('当存储使用率低于80%时应该返回false', () => {
            expect(dataManagement.isStorageNearFull.value).toBe(false)
        })
    })

    describe('isStorageFull', () => {
        it('当存储使用率超过95%时应该返回true', () => {
            vi.mocked(storageService.getStorageInfo).mockReturnValue({
                used: 4800,
                available: 200,
                percentage: 96
            })

            const { isStorageFull } = useDataManagement()
            expect(isStorageFull.value).toBe(true)
        })
    })

    describe('exportAllData', () => {
        it('应该成功导出所有数据', async () => {
            const mockData = '{"savedPlans": [], "currentPlan": null}'
            vi.mocked(storageService.exportData).mockResolvedValue(mockData)

            // Mock URL.createObjectURL and related DOM APIs
            global.URL.createObjectURL = vi.fn(() => 'mock-url')
            global.URL.revokeObjectURL = vi.fn()

            const mockLink = {
                href: '',
                download: '',
                click: vi.fn()
            }
            vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
            vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
            vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)

            await dataManagement.exportAllData()

            expect(storageService.exportData).toHaveBeenCalled()
            expect(mockLink.click).toHaveBeenCalled()
        })

        it('导出失败时应该抛出错误', async () => {
            vi.mocked(storageService.exportData).mockRejectedValue(new Error('导出失败'))

            await expect(dataManagement.exportAllData()).rejects.toThrow('导出失败')
        })
    })

    describe('checkStorageHealth', () => {
        it('存储健康时应该返回healthy状态', async () => {
            vi.mocked(storageService.getStorageStats).mockResolvedValue({
                totalPlans: 5,
                totalLocations: 20,
                totalRoutes: 15,
                averagePlanSize: 1024
            })

            const health = await dataManagement.checkStorageHealth()

            expect(health.status).toBe('healthy')
            expect(health.message).toBe('存储状态良好')
        })

        it('存储使用率超过80%时应该返回warning状态', async () => {
            vi.mocked(storageService.getStorageInfo).mockReturnValue({
                used: 4096,
                available: 1024,
                percentage: 85
            })

            vi.mocked(storageService.getStorageStats).mockResolvedValue({
                totalPlans: 5,
                totalLocations: 20,
                totalRoutes: 15,
                averagePlanSize: 1024
            })

            const { checkStorageHealth } = useDataManagement()
            const health = await checkStorageHealth()

            expect(health.status).toBe('warning')
            expect(health.message).toBe('存储空间不足')
            expect(health.suggestions).toContain('考虑删除一些旧规划')
        })

        it('存储使用率超过95%时应该返回critical状态', async () => {
            vi.mocked(storageService.getStorageInfo).mockReturnValue({
                used: 4800,
                available: 200,
                percentage: 96
            })

            vi.mocked(storageService.getStorageStats).mockResolvedValue({
                totalPlans: 5,
                totalLocations: 20,
                totalRoutes: 15,
                averagePlanSize: 1024
            })

            const { checkStorageHealth } = useDataManagement()
            const health = await checkStorageHealth()

            expect(health.status).toBe('critical')
            expect(health.message).toBe('存储空间严重不足')
            expect(health.suggestions).toContain('立即删除不需要的规划')
        })

        it('规划数量过多时应该提供清理建议', async () => {
            vi.mocked(storageService.getStorageStats).mockResolvedValue({
                totalPlans: 60,
                totalLocations: 200,
                totalRoutes: 150,
                averagePlanSize: 1024
            })

            const health = await dataManagement.checkStorageHealth()

            expect(health.suggestions).toContain('规划数量较多，建议定期清理')
        })

        it('平均规划大小过大时应该提供压缩建议', async () => {
            vi.mocked(storageService.getStorageStats).mockResolvedValue({
                totalPlans: 5,
                totalLocations: 20,
                totalRoutes: 15,
                averagePlanSize: 60000 // 60KB
            })

            const health = await dataManagement.checkStorageHealth()

            expect(health.suggestions).toContain('规划数据较大，考虑压缩数据')
        })
    })

    describe('formatBytes', () => {
        it('应该正确格式化字节数', () => {
            expect(dataManagement.formatBytes(0)).toBe('0 B')
            expect(dataManagement.formatBytes(1024)).toBe('1 KB')
            expect(dataManagement.formatBytes(1048576)).toBe('1 MB')
            expect(dataManagement.formatBytes(1073741824)).toBe('1 GB')
        })

        it('应该正确处理小数', () => {
            expect(dataManagement.formatBytes(1536)).toBe('1.5 KB')
            expect(dataManagement.formatBytes(2621440)).toBe('2.5 MB')
        })
    })

    describe('cleanupOldData', () => {
        it('应该成功清理旧数据', async () => {
            vi.mocked(storageService.cleanupOldPlans).mockResolvedValue(5)

            await dataManagement.cleanupOldData(10)

            expect(storageService.cleanupOldPlans).toHaveBeenCalledWith(10)
            expect(mockPlanStore.loadSavedPlans).toHaveBeenCalled()
        })

        it('没有需要清理的数据时应该显示提示', async () => {
            vi.mocked(storageService.cleanupOldPlans).mockResolvedValue(0)

            await dataManagement.cleanupOldData(10)

            expect(storageService.cleanupOldPlans).toHaveBeenCalledWith(10)
        })
    })

    describe('compressData', () => {
        it('应该成功压缩数据', async () => {
            vi.mocked(storageService.compressData).mockResolvedValue(1024)

            await dataManagement.compressData()

            expect(storageService.compressData).toHaveBeenCalled()
            expect(mockPlanStore.loadSavedPlans).toHaveBeenCalled()
        })

        it('数据已经最优时应该显示提示', async () => {
            vi.mocked(storageService.compressData).mockResolvedValue(0)

            await dataManagement.compressData()

            expect(storageService.compressData).toHaveBeenCalled()
        })
    })
})
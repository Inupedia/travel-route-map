/**
 * 存储服务测试
 * Storage service tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageService } from '@/services/storageService'
import type { TravelPlan } from '@/types'
import { Theme } from '@/types'

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

describe('StorageService', () => {
    let storageService: StorageService
    let mockPlan: TravelPlan

    beforeEach(() => {
        storageService = new StorageService()
        vi.clearAllMocks()

        mockPlan = {
            id: 'test-plan-1',
            name: '测试规划',
            description: '这是一个测试规划',
            totalDays: 3,
            locations: [
                {
                    id: 'loc-1',
                    name: '北京',
                    type: 'start',
                    coordinates: { lat: 39.9042, lng: 116.4074 },
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ],
            routes: [],
            settings: {
                mapCenter: { lat: 39.9042, lng: 116.4074 },
                mapZoom: 10,
                theme: Theme.LIGHT,
                showDistances: true,
                showDurations: true
            },
            createdAt: new Date(),
            updatedAt: new Date()
        }
    })

    describe('savePlan', () => {
        it('应该成功保存规划', async () => {
            localStorageMock.getItem.mockReturnValue('[]')

            await storageService.savePlan(mockPlan)

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'travel-route-planner-saved-plans',
                expect.stringContaining(mockPlan.id)
            )
        })

        it('应该更新现有规划', async () => {
            const existingPlans = [mockPlan]
            localStorageMock.getItem.mockReturnValue(JSON.stringify(existingPlans))

            const updatedPlan = { ...mockPlan, name: '更新的规划' }
            await storageService.savePlan(updatedPlan)

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'travel-route-planner-saved-plans',
                expect.stringContaining('更新的规划')
            )
        })

        it('存储空间不足时应该抛出错误', async () => {
            localStorageMock.getItem.mockReturnValue('[]')
            localStorageMock.setItem.mockImplementation(() => {
                const error = new Error('QuotaExceededError')
                // Mock DOMException properties
                Object.defineProperty(error, 'code', { value: 22 })
                Object.defineProperty(error, 'name', { value: 'QuotaExceededError' })
                throw error
            })

            await expect(storageService.savePlan(mockPlan)).rejects.toThrow('存储空间不足')
        })
    })

    describe('getSavedPlans', () => {
        it('应该返回空数组当没有保存的规划时', async () => {
            localStorageMock.getItem.mockReturnValue(null)

            const plans = await storageService.getSavedPlans()

            expect(plans).toEqual([])
        })

        it('应该正确解析保存的规划', async () => {
            const savedPlans = [mockPlan]
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPlans))

            const plans = await storageService.getSavedPlans()

            expect(plans).toHaveLength(1)
            expect(plans[0].id).toBe(mockPlan.id)
            expect(plans[0].name).toBe(mockPlan.name)
        })

        it('应该正确转换日期对象', async () => {
            const savedPlans = [mockPlan]
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPlans))

            const plans = await storageService.getSavedPlans()

            expect(plans[0].createdAt).toBeInstanceOf(Date)
            expect(plans[0].updatedAt).toBeInstanceOf(Date)
            expect(plans[0].locations[0].createdAt).toBeInstanceOf(Date)
        })
    })

    describe('getPlanById', () => {
        it('应该返回指定ID的规划', async () => {
            const savedPlans = [mockPlan]
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPlans))

            const plan = await storageService.getPlanById(mockPlan.id)

            expect(plan).not.toBeNull()
            expect(plan?.id).toBe(mockPlan.id)
        })

        it('应该返回null当规划不存在时', async () => {
            localStorageMock.getItem.mockReturnValue('[]')

            const plan = await storageService.getPlanById('non-existent')

            expect(plan).toBeNull()
        })
    })

    describe('deletePlan', () => {
        it('应该成功删除规划', async () => {
            const savedPlans = [mockPlan]
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPlans))
            localStorageMock.setItem.mockImplementation(() => { }) // Mock successful setItem

            await storageService.deletePlan(mockPlan.id)

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'travel-route-planner-saved-plans',
                '[]'
            )
        })
    })

    describe('getStorageInfo', () => {
        it('应该返回存储使用信息', () => {
            // Mock localStorage entries
            Object.defineProperty(localStorage, 'test-key', {
                value: 'test-value',
                enumerable: true
            })

            const info = storageService.getStorageInfo()

            expect(info).toHaveProperty('used')
            expect(info).toHaveProperty('available')
            expect(info).toHaveProperty('percentage')
            expect(typeof info.used).toBe('number')
            expect(typeof info.percentage).toBe('number')
        })
    })

    describe('exportData', () => {
        it('应该导出所有数据为JSON', async () => {
            const savedPlans = [mockPlan]
            localStorageMock.getItem
                .mockReturnValueOnce(JSON.stringify(savedPlans)) // getSavedPlans
                .mockReturnValueOnce(JSON.stringify(mockPlan))    // getCurrentPlan

            const exportedData = await storageService.exportData()
            const parsedData = JSON.parse(exportedData)

            expect(parsedData).toHaveProperty('savedPlans')
            expect(parsedData).toHaveProperty('currentPlan')
            expect(parsedData).toHaveProperty('exportDate')
            expect(parsedData).toHaveProperty('version')
            expect(parsedData.savedPlans).toHaveLength(1)
        })
    })

    describe('importData', () => {
        it('应该成功导入有效数据', async () => {
            const importData = {
                savedPlans: [mockPlan],
                currentPlan: mockPlan,
                exportDate: new Date().toISOString(),
                version: '1.0'
            }

            localStorageMock.setItem.mockImplementation(() => { }) // Mock successful setItem

            await storageService.importData(JSON.stringify(importData))

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'travel-route-planner-saved-plans',
                JSON.stringify(importData.savedPlans)
            )
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'travel-route-planner-current-plan',
                JSON.stringify(importData.currentPlan)
            )
        })

        it('应该拒绝无效数据格式', async () => {
            await expect(storageService.importData('invalid json')).rejects.toThrow('导入数据失败')
        })

        it('应该验证规划数据结构', async () => {
            const invalidData = {
                savedPlans: [{ id: 'test' }] // 缺少必要字段
            }

            await expect(storageService.importData(JSON.stringify(invalidData))).rejects.toThrow('数据格式错误')
        })
    })

    describe('getStorageStats', () => {
        it('应该返回存储统计信息', async () => {
            const savedPlans = [mockPlan]
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPlans))

            const stats = await storageService.getStorageStats()

            expect(stats).toHaveProperty('totalPlans')
            expect(stats).toHaveProperty('totalLocations')
            expect(stats).toHaveProperty('totalRoutes')
            expect(stats).toHaveProperty('averagePlanSize')
            expect(stats.totalPlans).toBe(1)
            expect(stats.totalLocations).toBe(1)
        })

        it('应该处理空数据情况', async () => {
            localStorageMock.getItem.mockReturnValue('[]')

            const stats = await storageService.getStorageStats()

            expect(stats.totalPlans).toBe(0)
            expect(stats.totalLocations).toBe(0)
            expect(stats.totalRoutes).toBe(0)
            expect(stats.averagePlanSize).toBe(0)
        })
    })

    describe('cleanupOldPlans', () => {
        it('应该保留指定数量的最新规划', async () => {
            const oldPlan = { ...mockPlan, id: 'old-plan', updatedAt: new Date('2023-01-01') }
            const newPlan = { ...mockPlan, id: 'new-plan', updatedAt: new Date('2023-12-01') }
            const savedPlans = [oldPlan, newPlan]

            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPlans))
            localStorageMock.setItem.mockImplementation(() => { }) // Mock successful setItem

            const removedCount = await storageService.cleanupOldPlans(1)

            expect(removedCount).toBe(1)
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'travel-route-planner-saved-plans',
                expect.stringContaining('new-plan')
            )
        })

        it('当规划数量不超过保留数量时应该返回0', async () => {
            const savedPlans = [mockPlan]
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPlans))

            const removedCount = await storageService.cleanupOldPlans(10)

            expect(removedCount).toBe(0)
        })
    })

    describe('clearAllData', () => {
        it('应该清除所有存储数据', async () => {
            await storageService.clearAllData()

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('travel-route-planner-saved-plans')
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('travel-route-planner-current-plan')
        })
    })
})
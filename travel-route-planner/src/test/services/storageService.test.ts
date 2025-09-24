import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageService } from '@/services/storageService'
import type { TravelPlan } from '@/types'

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
            name: '测试旅游规划',
            description: '这是一个测试规划',
            totalDays: 3,
            locations: [
                {
                    id: 'loc-1',
                    name: '北京天安门',
                    type: 'start',
                    coordinates: { lat: 39.9042, lng: 116.4074 },
                    address: '北京市东城区天安门广场',
                    description: '中华人民共和国的象征',
                    images: [],
                    tags: ['历史', '文化'],
                    dayNumber: 1,
                    visitDuration: 120,
                    createdAt: new Date('2023-01-01'),
                    updatedAt: new Date('2023-01-01')
                }
            ],
            routes: [],
            settings: {
                mapCenter: { lat: 39.9042, lng: 116.4074 },
                mapZoom: 10,
                theme: 'light',
                showDistances: true,
                showDurations: true
            },
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01')
        }
    })

    describe('savePlan', () => {
        it('应该成功保存新的旅游规划', async () => {
            localStorageMock.getItem.mockReturnValue(null)

            await storageService.savePlan(mockPlan)

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'travel-route-planner-saved-plans',
                expect.stringContaining(mockPlan.id)
            )
        })

        it('应该更新已存在的旅游规划', async () => {
            const existingPlans = [mockPlan]
            localStorageMock.getItem.mockReturnValue(JSON.stringify(existingPlans))

            const updatedPlan = { ...mockPlan, name: '更新后的规划' }
            await storageService.savePlan(updatedPlan)

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'travel-route-planner-saved-plans',
                expect.stringContaining('更新后的规划')
            )
        })

        it('应该在保存失败时抛出错误', async () => {
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('存储空间不足')
            })

            await expect(storageService.savePlan(mockPlan)).rejects.toThrow('保存规划失败')
        })
    })

    describe('getSavedPlans', () => {
        it('应该返回所有已保存的规划', async () => {
            const savedPlans = [mockPlan]
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPlans))

            const result = await storageService.getSavedPlans()

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe(mockPlan.id)
            expect(result[0].createdAt).toBeInstanceOf(Date)
        })

        it('应该在没有保存数据时返回空数组', async () => {
            localStorageMock.getItem.mockReturnValue(null)

            const result = await storageService.getSavedPlans()

            expect(result).toEqual([])
        })

        it('应该在数据解析失败时返回空数组', async () => {
            localStorageMock.getItem.mockReturnValue('invalid json')
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

            const result = await storageService.getSavedPlans()

            expect(result).toEqual([])
            expect(consoleSpy).toHaveBeenCalled()

            consoleSpy.mockRestore()
        })
    })

    describe('getPlanById', () => {
        it('应该根据ID返回特定的规划', async () => {
            const savedPlans = [mockPlan]
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPlans))

            const result = await storageService.getPlanById(mockPlan.id)

            expect(result).not.toBeNull()
            expect(result!.id).toBe(mockPlan.id)
        })

        it('应该在找不到规划时返回null', async () => {
            localStorageMock.getItem.mockReturnValue(JSON.stringify([]))

            const result = await storageService.getPlanById('non-existent-id')

            expect(result).toBeNull()
        })
    })

    describe('deletePlan', () => {
        it('应该成功删除指定的规划', async () => {
            const savedPlans = [mockPlan]
            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPlans))
            localStorageMock.setItem.mockImplementation(() => { }) // Reset any previous error mocks

            await storageService.deletePlan(mockPlan.id)

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'travel-route-planner-saved-plans',
                '[]'
            )
        })

        it('应该在删除失败时抛出错误', async () => {
            localStorageMock.getItem.mockReturnValue(JSON.stringify([mockPlan]))
            localStorageMock.setItem.mockImplementation(() => {
                throw new Error('存储空间不足')
            })

            await expect(storageService.deletePlan(mockPlan.id)).rejects.toThrow('删除规划失败')
        })
    })

    describe('saveCurrentPlan', () => {
        it('应该保存当前规划', async () => {
            localStorageMock.setItem.mockImplementation(() => { }) // Reset any previous error mocks

            await storageService.saveCurrentPlan(mockPlan)

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'travel-route-planner-current-plan',
                expect.stringContaining(mockPlan.id)
            )
        })

        it('应该在传入null时清除当前规划', async () => {
            await storageService.saveCurrentPlan(null)

            expect(localStorageMock.removeItem).toHaveBeenCalledWith(
                'travel-route-planner-current-plan'
            )
        })
    })

    describe('getCurrentPlan', () => {
        it('应该返回当前规划', async () => {
            localStorageMock.getItem.mockReturnValue(JSON.stringify(mockPlan))

            const result = await storageService.getCurrentPlan()

            expect(result).not.toBeNull()
            expect(result!.id).toBe(mockPlan.id)
        })

        it('应该在没有当前规划时返回null', async () => {
            localStorageMock.getItem.mockReturnValue(null)

            const result = await storageService.getCurrentPlan()

            expect(result).toBeNull()
        })
    })

    describe('clearAllData', () => {
        it('应该清除所有存储数据', async () => {
            await storageService.clearAllData()

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('travel-route-planner-saved-plans')
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('travel-route-planner-current-plan')
        })
    })

    describe('getStorageInfo', () => {
        it('应该返回存储使用情况', () => {
            // Mock localStorage keys and values
            Object.defineProperty(localStorageMock, 'hasOwnProperty', {
                value: vi.fn().mockReturnValue(true)
            })

            const mockStorage = {
                'key1': 'value1',
                'key2': 'value2'
            }

            Object.keys(mockStorage).forEach(key => {
                Object.defineProperty(localStorageMock, key, {
                    value: mockStorage[key as keyof typeof mockStorage],
                    enumerable: true
                })
            })

            const result = storageService.getStorageInfo()

            expect(result).toHaveProperty('used')
            expect(result).toHaveProperty('available')
            expect(result).toHaveProperty('percentage')
            expect(typeof result.used).toBe('number')
            expect(typeof result.available).toBe('number')
            expect(typeof result.percentage).toBe('number')
        })
    })

    describe('exportData', () => {
        it('应该导出所有数据为JSON', async () => {
            const savedPlans = [mockPlan]
            localStorageMock.getItem
                .mockReturnValueOnce(JSON.stringify(savedPlans)) // getSavedPlans
                .mockReturnValueOnce(JSON.stringify(mockPlan))   // getCurrentPlan

            const result = await storageService.exportData()

            const exportedData = JSON.parse(result)
            expect(exportedData).toHaveProperty('savedPlans')
            expect(exportedData).toHaveProperty('currentPlan')
            expect(exportedData).toHaveProperty('exportDate')
            expect(exportedData).toHaveProperty('version')
        })
    })

    describe('importData', () => {
        it('应该成功导入数据', async () => {
            localStorageMock.setItem.mockImplementation(() => { }) // Reset any previous error mocks

            const importData = {
                savedPlans: [mockPlan],
                currentPlan: mockPlan,
                exportDate: new Date().toISOString(),
                version: '1.0'
            }

            await storageService.importData(JSON.stringify(importData))

            expect(localStorageMock.setItem).toHaveBeenCalledTimes(2)
        })

        it('应该在导入无效数据时抛出错误', async () => {
            await expect(storageService.importData('invalid json')).rejects.toThrow('导入数据失败')
        })
    })
})
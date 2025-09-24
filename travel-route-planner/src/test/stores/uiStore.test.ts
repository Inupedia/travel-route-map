/**
 * UIStore 单元测试
 * UIStore unit tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUIStore } from '@/stores/uiStore'

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

// Mock document
Object.defineProperty(document, 'documentElement', {
    value: {
        classList: {
            remove: vi.fn(),
            add: vi.fn()
        }
    }
})

describe('UIStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        localStorageMock.getItem.mockClear()
        localStorageMock.setItem.mockClear()
        localStorageMock.removeItem.mockClear()
        localStorageMock.clear.mockClear()
        vi.clearAllMocks()
    })

    describe('初始状态', () => {
        it('应该有正确的初始状态', () => {
            const store = useUIStore()

            expect(store.activePanel).toBeNull()
            expect(store.showLocationForm).toBe(false)
            expect(store.showRouteForm).toBe(false)
            expect(store.selectedDay).toBe(1)
            expect(store.theme).toBe('light')
            expect(store.isMobile).toBe(false)
            expect(store.isLoading).toBe(false)
            expect(store.notifications).toEqual([])

            // Getters
            expect(store.hasActivePanel).toBe(false)
            expect(store.isLocationPanelActive).toBe(false)
            expect(store.isRoutePanelActive).toBe(false)
            expect(store.isDayPlanPanelActive).toBe(false)
            expect(store.isExportPanelActive).toBe(false)
            expect(store.isDarkTheme).toBe(false)
            expect(store.isLightTheme).toBe(true)
            expect(store.hasNotifications).toBe(false)
        })
    })

    describe('面板管理', () => {
        it('应该能设置活动面板', () => {
            const store = useUIStore()

            store.setActivePanel('location')

            expect(store.activePanel).toBe('location')
            expect(store.hasActivePanel).toBe(true)
            expect(store.isLocationPanelActive).toBe(true)
        })

        it('应该能切换面板', () => {
            const store = useUIStore()

            // 打开面板
            store.togglePanel('location')
            expect(store.activePanel).toBe('location')

            // 关闭面板
            store.togglePanel('location')
            expect(store.activePanel).toBeNull()

            // 切换到不同面板
            store.setActivePanel('route')
            store.togglePanel('location')
            expect(store.activePanel).toBe('location')
        })

        it('应该能关闭面板', () => {
            const store = useUIStore()

            store.setActivePanel('location')
            expect(store.activePanel).toBe('location')

            store.closePanel()
            expect(store.activePanel).toBeNull()
        })

        it('应该正确识别不同面板状态', () => {
            const store = useUIStore()

            store.setActivePanel('route')
            expect(store.isRoutePanelActive).toBe(true)
            expect(store.isLocationPanelActive).toBe(false)

            store.setActivePanel('day-plan')
            expect(store.isDayPlanPanelActive).toBe(true)
            expect(store.isRoutePanelActive).toBe(false)

            store.setActivePanel('export')
            expect(store.isExportPanelActive).toBe(true)
            expect(store.isDayPlanPanelActive).toBe(false)
        })
    })

    describe('表单对话框管理', () => {
        it('应该能管理地点表单对话框', () => {
            const store = useUIStore()

            store.showLocationFormDialog()
            expect(store.showLocationForm).toBe(true)

            store.hideLocationFormDialog()
            expect(store.showLocationForm).toBe(false)

            store.toggleLocationForm()
            expect(store.showLocationForm).toBe(true)

            store.toggleLocationForm()
            expect(store.showLocationForm).toBe(false)
        })

        it('应该能管理路线表单对话框', () => {
            const store = useUIStore()

            store.showRouteFormDialog()
            expect(store.showRouteForm).toBe(true)

            store.hideRouteFormDialog()
            expect(store.showRouteForm).toBe(false)

            store.toggleRouteForm()
            expect(store.showRouteForm).toBe(true)

            store.toggleRouteForm()
            expect(store.showRouteForm).toBe(false)
        })
    })

    describe('天数管理', () => {
        it('应该能设置选中的天数', () => {
            const store = useUIStore()

            store.setSelectedDay(3)
            expect(store.selectedDay).toBe(3)
        })

        it('应该阻止设置无效的天数', () => {
            const store = useUIStore()

            store.setSelectedDay(0)
            expect(store.selectedDay).toBe(1) // 保持原值

            store.setSelectedDay(-1)
            expect(store.selectedDay).toBe(1) // 保持原值
        })

        it('应该能切换到下一天', () => {
            const store = useUIStore()

            store.nextDay()
            expect(store.selectedDay).toBe(2)

            store.nextDay()
            expect(store.selectedDay).toBe(3)
        })

        it('应该能切换到上一天', () => {
            const store = useUIStore()

            store.setSelectedDay(3)

            store.previousDay()
            expect(store.selectedDay).toBe(2)

            store.previousDay()
            expect(store.selectedDay).toBe(1)

            // 不应该小于1
            store.previousDay()
            expect(store.selectedDay).toBe(1)
        })
    })

    describe('主题管理', () => {
        it('应该能设置主题', () => {
            const store = useUIStore()

            store.setTheme('dark')

            expect(store.theme).toBe('dark')
            expect(store.isDarkTheme).toBe(true)
            expect(store.isLightTheme).toBe(false)
            expect(localStorageMock.setItem).toHaveBeenCalledWith('travel-planner-theme', 'dark')
        })

        it('应该能切换主题', () => {
            const store = useUIStore()

            expect(store.theme).toBe('light')

            store.toggleTheme()
            expect(store.theme).toBe('dark')

            store.toggleTheme()
            expect(store.theme).toBe('light')
        })

        it('应该从本地存储加载主题', () => {
            localStorageMock.getItem.mockReturnValue('dark')

            const store = useUIStore()

            expect(store.theme).toBe('dark')
        })
    })

    describe('移动设备检测', () => {
        it('应该能设置移动设备状态', () => {
            const store = useUIStore()

            store.setMobile(true)
            expect(store.isMobile).toBe(true)

            store.setMobile(false)
            expect(store.isMobile).toBe(false)
        })
    })

    describe('加载状态', () => {
        it('应该能设置加载状态', () => {
            const store = useUIStore()

            store.setLoading(true)
            expect(store.isLoading).toBe(true)

            store.setLoading(false)
            expect(store.isLoading).toBe(false)
        })
    })

    describe('通知管理', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('应该能添加通知', () => {
            const store = useUIStore()

            const id = store.addNotification({
                type: 'success',
                title: '成功',
                message: '操作成功'
            })

            expect(store.notifications).toHaveLength(1)
            expect(store.notifications[0].type).toBe('success')
            expect(store.notifications[0].title).toBe('成功')
            expect(store.notifications[0].message).toBe('操作成功')
            expect(store.notifications[0].id).toBe(id)
            expect(store.hasNotifications).toBe(true)
        })

        it('应该能自动移除通知', () => {
            const store = useUIStore()

            store.addNotification({
                type: 'info',
                title: '信息',
                message: '测试消息',
                duration: 1000
            })

            expect(store.notifications).toHaveLength(1)

            vi.advanceTimersByTime(1000)

            expect(store.notifications).toHaveLength(0)
        })

        it('应该能手动移除通知', () => {
            const store = useUIStore()

            const id = store.addNotification({
                type: 'warning',
                title: '警告',
                message: '测试警告',
                duration: 0 // 不自动移除
            })

            expect(store.notifications).toHaveLength(1)

            store.removeNotification(id)

            expect(store.notifications).toHaveLength(0)
        })

        it('应该能清除所有通知', () => {
            const store = useUIStore()

            store.addNotification({
                type: 'success',
                title: '成功1',
                message: '消息1',
                duration: 0
            })

            store.addNotification({
                type: 'error',
                title: '错误1',
                message: '消息2',
                duration: 0
            })

            expect(store.notifications).toHaveLength(2)

            store.clearNotifications()

            expect(store.notifications).toHaveLength(0)
        })

        it('应该提供便捷的通知方法', () => {
            const store = useUIStore()

            store.showSuccessMessage('成功', '操作成功')
            store.showErrorMessage('错误', '操作失败')
            store.showWarningMessage('警告', '注意事项')
            store.showInfoMessage('信息', '提示信息')

            expect(store.notifications).toHaveLength(4)
            expect(store.notifications[0].type).toBe('success')
            expect(store.notifications[1].type).toBe('error')
            expect(store.notifications[2].type).toBe('warning')
            expect(store.notifications[3].type).toBe('info')
        })
    })

    describe('UI重置', () => {
        it('应该能重置UI状态', () => {
            const store = useUIStore()

            // 修改一些状态
            store.setActivePanel('location')
            store.showLocationFormDialog()
            store.showRouteFormDialog()
            store.setSelectedDay(5)
            store.setLoading(true)
            store.addNotification({
                type: 'info',
                title: '测试',
                message: '测试消息',
                duration: 0
            })

            // 重置
            store.resetUI()

            expect(store.activePanel).toBeNull()
            expect(store.showLocationForm).toBe(false)
            expect(store.showRouteForm).toBe(false)
            expect(store.selectedDay).toBe(1)
            expect(store.isLoading).toBe(false)
            expect(store.notifications).toHaveLength(0)
        })
    })
})
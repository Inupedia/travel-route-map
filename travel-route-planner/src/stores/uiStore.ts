/**
 * UI状态管理
 * UI state management
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ActivePanel, Theme } from '@/types'

export interface UIState {
    activePanel: ActivePanel | null
    showLocationForm: boolean
    showRouteForm: boolean
    selectedDay: number
    theme: Theme
    isMobile: boolean
}

export const useUIStore = defineStore('ui', () => {
    // State
    const activePanel = ref<ActivePanel | null>(null)
    const showLocationForm = ref(false)
    const showRouteForm = ref(false)
    const selectedDay = ref(1)
    const theme = ref<Theme>('light')
    const isMobile = ref(false)

    // 其他UI状态
    const isLoading = ref(false)
    const notifications = ref<Array<{
        id: string
        type: 'success' | 'error' | 'warning' | 'info'
        title: string
        message: string
        duration?: number
        timestamp: Date
    }>>([])

    // Getters
    const hasActivePanel = computed(() => activePanel.value !== null)
    const isLocationPanelActive = computed(() => activePanel.value === 'location')
    const isRoutePanelActive = computed(() => activePanel.value === 'route')
    const isDayPlanPanelActive = computed(() => activePanel.value === 'day-plan')
    const isExportPanelActive = computed(() => activePanel.value === 'export')
    const isDarkTheme = computed(() => theme.value === 'dark')
    const isLightTheme = computed(() => theme.value === 'light')
    const hasNotifications = computed(() => notifications.value.length > 0)

    // Actions
    const setActivePanel = (panel: ActivePanel | null) => {
        activePanel.value = panel
    }

    const togglePanel = (panel: ActivePanel) => {
        if (activePanel.value === panel) {
            activePanel.value = null
        } else {
            activePanel.value = panel
        }
    }

    const closePanel = () => {
        activePanel.value = null
    }

    const showLocationFormDialog = () => {
        showLocationForm.value = true
    }

    const hideLocationFormDialog = () => {
        showLocationForm.value = false
    }

    const toggleLocationForm = () => {
        showLocationForm.value = !showLocationForm.value
    }

    const showRouteFormDialog = () => {
        showRouteForm.value = true
    }

    const hideRouteFormDialog = () => {
        showRouteForm.value = false
    }

    const toggleRouteForm = () => {
        showRouteForm.value = !showRouteForm.value
    }

    const setSelectedDay = (day: number) => {
        if (day >= 1) {
            selectedDay.value = day
        }
    }

    const nextDay = () => {
        selectedDay.value += 1
    }

    const previousDay = () => {
        if (selectedDay.value > 1) {
            selectedDay.value -= 1
        }
    }

    const setTheme = (newTheme: Theme) => {
        theme.value = newTheme

        // 保存到本地存储
        localStorage.setItem('travel-planner-theme', newTheme)

        // 更新HTML根元素的类名
        if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('light', 'dark')
            document.documentElement.classList.add(newTheme)
        }
    }

    const toggleTheme = () => {
        const newTheme = theme.value === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
    }

    const setMobile = (mobile: boolean) => {
        isMobile.value = mobile
    }

    const setLoading = (loading: boolean) => {
        isLoading.value = loading
    }

    const addNotification = (notification: {
        type: 'success' | 'error' | 'warning' | 'info'
        title: string
        message: string
        duration?: number
    }) => {
        const id = Date.now().toString()
        const newNotification = {
            id,
            ...notification,
            timestamp: new Date()
        }

        notifications.value.push(newNotification)

        // 自动移除通知
        const duration = notification.duration || 5000
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id)
            }, duration)
        }

        return id
    }

    const removeNotification = (id: string) => {
        const index = notifications.value.findIndex(n => n.id === id)
        if (index >= 0) {
            notifications.value.splice(index, 1)
        }
    }

    const clearNotifications = () => {
        notifications.value = []
    }

    const showSuccessMessage = (title: string, message: string, duration?: number) => {
        return addNotification({ type: 'success', title, message, duration })
    }

    const showErrorMessage = (title: string, message: string, duration?: number) => {
        return addNotification({ type: 'error', title, message, duration })
    }

    const showWarningMessage = (title: string, message: string, duration?: number) => {
        return addNotification({ type: 'warning', title, message, duration })
    }

    const showInfoMessage = (title: string, message: string, duration?: number) => {
        return addNotification({ type: 'info', title, message, duration })
    }

    const resetUI = () => {
        activePanel.value = null
        showLocationForm.value = false
        showRouteForm.value = false
        selectedDay.value = 1
        isLoading.value = false
        clearNotifications()
    }

    // 初始化
    const initializeUI = () => {
        // 从本地存储加载主题
        const savedTheme = localStorage.getItem('travel-planner-theme') as Theme
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            setTheme(savedTheme)
        }

        // 检测移动设备
        const checkMobile = () => {
            if (typeof window !== 'undefined') {
                setMobile(window.innerWidth <= 768)
            }
        }

        checkMobile()

        // 监听窗口大小变化
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', checkMobile)
        }
    }

    // 清理函数
    const cleanup = () => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', () => { })
        }
    }

    // 初始化UI
    initializeUI()

    return {
        // State
        activePanel,
        showLocationForm,
        showRouteForm,
        selectedDay,
        theme,
        isMobile,
        isLoading,
        notifications,

        // Getters
        hasActivePanel,
        isLocationPanelActive,
        isRoutePanelActive,
        isDayPlanPanelActive,
        isExportPanelActive,
        isDarkTheme,
        isLightTheme,
        hasNotifications,

        // Actions
        setActivePanel,
        togglePanel,
        closePanel,
        showLocationFormDialog,
        hideLocationFormDialog,
        toggleLocationForm,
        showRouteFormDialog,
        hideRouteFormDialog,
        toggleRouteForm,
        setSelectedDay,
        nextDay,
        previousDay,
        setTheme,
        toggleTheme,
        setMobile,
        setLoading,
        addNotification,
        removeNotification,
        clearNotifications,
        showSuccessMessage,
        showErrorMessage,
        showWarningMessage,
        showInfoMessage,
        resetUI,
        initializeUI,
        cleanup
    }
})
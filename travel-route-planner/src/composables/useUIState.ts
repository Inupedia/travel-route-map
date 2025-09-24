/**
 * UI状态管理组合式函数
 * UI state management composable
 */

import { ref, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import type { MessageOptions, NotificationOptions } from 'element-plus'

export interface LoadingState {
    isLoading: boolean
    text?: string
    type?: 'default' | 'dots' | 'circle' | 'pulse'
}

export interface NotificationState {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    duration?: number
    timestamp: Date
}

export function useUIState() {
    // 响应式数据
    const loadingState = ref<LoadingState>({
        isLoading: false
    })

    const notifications = ref<NotificationState[]>([])
    const modals = ref<Set<string>>(new Set())
    const tooltips = ref<Map<string, boolean>>(new Map())

    // 计算属性
    const isLoading = computed(() => loadingState.value.isLoading)
    const hasNotifications = computed(() => notifications.value.length > 0)
    const hasModals = computed(() => modals.value.size > 0)

    // 加载状态管理
    const showLoading = (text?: string, type?: LoadingState['type']) => {
        loadingState.value = {
            isLoading: true,
            text,
            type
        }
    }

    const hideLoading = () => {
        loadingState.value = {
            isLoading: false
        }
    }

    const withLoading = async <T>(
        promise: Promise<T>,
        text?: string,
        type?: LoadingState['type']
    ): Promise<T> => {
        showLoading(text, type)
        try {
            const result = await promise
            return result
        } finally {
            hideLoading()
        }
    }

    // 通知管理
    const addNotification = (notification: Omit<NotificationState, 'id' | 'timestamp'>) => {
        const id = Date.now().toString()
        const newNotification: NotificationState = {
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

    // 消息提示
    const showMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', options?: Partial<MessageOptions>) => {
        return ElMessage({
            message,
            type,
            duration: 3000,
            showClose: true,
            ...options
        })
    }

    const showSuccessMessage = (message: string, options?: Partial<MessageOptions>) => {
        return showMessage(message, 'success', options)
    }

    const showErrorMessage = (message: string, options?: Partial<MessageOptions>) => {
        return showMessage(message, 'error', { duration: 5000, ...options })
    }

    const showWarningMessage = (message: string, options?: Partial<MessageOptions>) => {
        return showMessage(message, 'warning', options)
    }

    const showInfoMessage = (message: string, options?: Partial<MessageOptions>) => {
        return showMessage(message, 'info', options)
    }

    // 通知提示
    const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', options?: Partial<NotificationOptions>) => {
        return ElNotification({
            title,
            message,
            type,
            duration: 4500,
            ...options
        })
    }

    const showSuccessNotification = (title: string, message: string, options?: Partial<NotificationOptions>) => {
        return showNotification(title, message, 'success', options)
    }

    const showErrorNotification = (title: string, message: string, options?: Partial<NotificationOptions>) => {
        return showNotification(title, message, 'error', { duration: 0, ...options })
    }

    const showWarningNotification = (title: string, message: string, options?: Partial<NotificationOptions>) => {
        return showNotification(title, message, 'warning', options)
    }

    const showInfoNotification = (title: string, message: string, options?: Partial<NotificationOptions>) => {
        return showNotification(title, message, 'info', options)
    }

    // 确认对话框
    const showConfirm = async (
        message: string,
        title: string = '确认操作',
        options?: {
            confirmButtonText?: string
            cancelButtonText?: string
            type?: 'warning' | 'info' | 'success' | 'error'
        }
    ): Promise<boolean> => {
        try {
            await ElMessageBox.confirm(message, title, {
                confirmButtonText: options?.confirmButtonText || '确定',
                cancelButtonText: options?.cancelButtonText || '取消',
                type: options?.type || 'warning',
                center: true
            })
            return true
        } catch {
            return false
        }
    }

    const showAlert = async (
        message: string,
        title: string = '提示',
        options?: {
            confirmButtonText?: string
            type?: 'warning' | 'info' | 'success' | 'error'
        }
    ): Promise<void> => {
        await ElMessageBox.alert(message, title, {
            confirmButtonText: options?.confirmButtonText || '确定',
            type: options?.type || 'info',
            center: true
        })
    }

    const showPrompt = async (
        message: string,
        title: string = '输入',
        options?: {
            confirmButtonText?: string
            cancelButtonText?: string
            inputPattern?: RegExp
            inputErrorMessage?: string
            inputPlaceholder?: string
            inputValue?: string
        }
    ): Promise<string | null> => {
        try {
            const { value } = await ElMessageBox.prompt(message, title, {
                confirmButtonText: options?.confirmButtonText || '确定',
                cancelButtonText: options?.cancelButtonText || '取消',
                inputPattern: options?.inputPattern,
                inputErrorMessage: options?.inputErrorMessage,
                inputPlaceholder: options?.inputPlaceholder,
                inputValue: options?.inputValue,
                center: true
            })
            return value
        } catch {
            return null
        }
    }

    // 模态框管理
    const openModal = (id: string) => {
        modals.value.add(id)
    }

    const closeModal = (id: string) => {
        modals.value.delete(id)
    }

    const isModalOpen = (id: string) => {
        return modals.value.has(id)
    }

    const closeAllModals = () => {
        modals.value.clear()
    }

    // 工具提示管理
    const showTooltip = (id: string) => {
        tooltips.value.set(id, true)
    }

    const hideTooltip = (id: string) => {
        tooltips.value.set(id, false)
    }

    const isTooltipVisible = (id: string) => {
        return tooltips.value.get(id) || false
    }

    // 焦点管理
    const focusElement = async (selector: string | HTMLElement) => {
        await nextTick()

        let element: HTMLElement | null = null

        if (typeof selector === 'string') {
            element = document.querySelector(selector)
        } else {
            element = selector
        }

        if (element && typeof element.focus === 'function') {
            element.focus()
        }
    }

    const blurElement = async (selector: string | HTMLElement) => {
        await nextTick()

        let element: HTMLElement | null = null

        if (typeof selector === 'string') {
            element = document.querySelector(selector)
        } else {
            element = selector
        }

        if (element && typeof element.blur === 'function') {
            element.blur()
        }
    }

    // 滚动管理
    const scrollToElement = (
        selector: string | HTMLElement,
        options?: ScrollIntoViewOptions
    ) => {
        let element: HTMLElement | null = null

        if (typeof selector === 'string') {
            element = document.querySelector(selector)
        } else {
            element = selector
        }

        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest',
                ...options
            })
        }
    }

    const scrollToTop = (smooth: boolean = true) => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: smooth ? 'smooth' : 'auto'
        })
    }

    // 错误处理
    const handleError = (error: Error | string, context?: string) => {
        const message = typeof error === 'string' ? error : error.message
        const fullMessage = context ? `${context}: ${message}` : message

        console.error('UI Error:', error)
        showErrorMessage(fullMessage)

        // 可以在这里添加错误上报逻辑
    }

    const handleAsyncError = async (
        asyncFn: () => Promise<void>,
        errorMessage?: string,
        context?: string
    ) => {
        try {
            await asyncFn()
        } catch (error) {
            const message = errorMessage || '操作失败'
            handleError(error as Error, context || message)
        }
    }

    return {
        // 状态
        loadingState,
        notifications,
        isLoading,
        hasNotifications,
        hasModals,

        // 加载管理
        showLoading,
        hideLoading,
        withLoading,

        // 通知管理
        addNotification,
        removeNotification,
        clearNotifications,

        // 消息提示
        showMessage,
        showSuccessMessage,
        showErrorMessage,
        showWarningMessage,
        showInfoMessage,

        // 通知提示
        showNotification,
        showSuccessNotification,
        showErrorNotification,
        showWarningNotification,
        showInfoNotification,

        // 对话框
        showConfirm,
        showAlert,
        showPrompt,

        // 模态框管理
        openModal,
        closeModal,
        isModalOpen,
        closeAllModals,

        // 工具提示管理
        showTooltip,
        hideTooltip,
        isTooltipVisible,

        // 焦点管理
        focusElement,
        blurElement,

        // 滚动管理
        scrollToElement,
        scrollToTop,

        // 错误处理
        handleError,
        handleAsyncError
    }
}
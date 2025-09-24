/**
 * 响应式设计工具组合式函数
 * Responsive design utilities composable
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

// 断点配置
export const BREAKPOINTS = {
    xs: 0,
    sm: 768,
    md: 992,
    lg: 1200,
    xl: 1920
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

export interface ResponsiveState {
    width: number
    height: number
    breakpoint: Breakpoint
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
    isLargeScreen: boolean
}

export function useResponsive() {
    // 响应式数据
    const windowSize = ref({
        width: 0,
        height: 0
    })

    // 计算属性
    const breakpoint = computed<Breakpoint>(() => {
        const width = windowSize.value.width
        if (width >= BREAKPOINTS.xl) return 'xl'
        if (width >= BREAKPOINTS.lg) return 'lg'
        if (width >= BREAKPOINTS.md) return 'md'
        if (width >= BREAKPOINTS.sm) return 'sm'
        return 'xs'
    })

    const isMobile = computed(() => windowSize.value.width < BREAKPOINTS.sm)
    const isTablet = computed(() =>
        windowSize.value.width >= BREAKPOINTS.sm && windowSize.value.width < BREAKPOINTS.md
    )
    const isDesktop = computed(() => windowSize.value.width >= BREAKPOINTS.md)
    const isLargeScreen = computed(() => windowSize.value.width >= BREAKPOINTS.lg)

    const responsiveState = computed<ResponsiveState>(() => ({
        width: windowSize.value.width,
        height: windowSize.value.height,
        breakpoint: breakpoint.value,
        isMobile: isMobile.value,
        isTablet: isTablet.value,
        isDesktop: isDesktop.value,
        isLargeScreen: isLargeScreen.value
    }))

    // 方法
    const updateWindowSize = () => {
        windowSize.value = {
            width: window.innerWidth,
            height: window.innerHeight
        }
    }

    const isBreakpoint = (bp: Breakpoint) => {
        return breakpoint.value === bp
    }

    const isBreakpointUp = (bp: Breakpoint) => {
        return windowSize.value.width >= BREAKPOINTS[bp]
    }

    const isBreakpointDown = (bp: Breakpoint) => {
        return windowSize.value.width < BREAKPOINTS[bp]
    }

    const isBreakpointBetween = (min: Breakpoint, max: Breakpoint) => {
        const width = windowSize.value.width
        return width >= BREAKPOINTS[min] && width < BREAKPOINTS[max]
    }

    // 获取响应式值
    const getResponsiveValue = <T>(values: Partial<Record<Breakpoint, T>>): T | undefined => {
        const currentBp = breakpoint.value

        // 优先返回当前断点的值
        if (values[currentBp] !== undefined) {
            return values[currentBp]
        }

        // 向下查找最近的断点值
        const breakpointOrder: Breakpoint[] = ['xl', 'lg', 'md', 'sm', 'xs']
        const currentIndex = breakpointOrder.indexOf(currentBp)

        for (let i = currentIndex + 1; i < breakpointOrder.length; i++) {
            const bp = breakpointOrder[i]
            if (values[bp] !== undefined) {
                return values[bp]
            }
        }

        return undefined
    }

    // 媒体查询匹配
    const matchMedia = (query: string) => {
        if (typeof window === 'undefined') return false
        return window.matchMedia(query).matches
    }

    // 检测设备特性
    const deviceFeatures = computed(() => ({
        // 触摸设备
        hasTouch: typeof window !== 'undefined' && 'ontouchstart' in window,
        // 高分辨率屏幕
        isHighDPI: typeof window !== 'undefined' && window.devicePixelRatio > 1,
        // 横屏模式
        isLandscape: windowSize.value.width > windowSize.value.height,
        // 竖屏模式
        isPortrait: windowSize.value.width <= windowSize.value.height,
        // 深色模式偏好
        prefersDark: matchMedia('(prefers-color-scheme: dark)'),
        // 减少动画偏好
        prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)'),
        // 高对比度偏好
        prefersHighContrast: matchMedia('(prefers-contrast: high)')
    }))

    // 防抖处理
    let resizeTimer: NodeJS.Timeout | null = null
    const handleResize = () => {
        if (resizeTimer) {
            clearTimeout(resizeTimer)
        }
        resizeTimer = setTimeout(() => {
            updateWindowSize()
        }, 100)
    }

    // 生命周期
    onMounted(() => {
        updateWindowSize()
        window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
        window.removeEventListener('resize', handleResize)
        if (resizeTimer) {
            clearTimeout(resizeTimer)
        }
    })

    return {
        // 响应式状态
        windowSize: windowSize.value,
        breakpoint,
        isMobile,
        isTablet,
        isDesktop,
        isLargeScreen,
        responsiveState,
        deviceFeatures,

        // 方法
        updateWindowSize,
        isBreakpoint,
        isBreakpointUp,
        isBreakpointDown,
        isBreakpointBetween,
        getResponsiveValue,
        matchMedia,

        // 常量
        BREAKPOINTS
    }
}

// 响应式CSS类生成器
export function useResponsiveClasses() {
    const { breakpoint, isMobile, isTablet, isDesktop, isLargeScreen } = useResponsive()

    const classes = computed(() => ({
        [`breakpoint-${breakpoint.value}`]: true,
        'is-mobile': isMobile.value,
        'is-tablet': isTablet.value,
        'is-desktop': isDesktop.value,
        'is-large-screen': isLargeScreen.value
    }))

    return {
        classes,
        breakpoint,
        isMobile,
        isTablet,
        isDesktop,
        isLargeScreen
    }
}

// 响应式网格系统
export function useResponsiveGrid() {
    const { getResponsiveValue } = useResponsive()

    const getGridCols = (cols: Partial<Record<Breakpoint, number>>) => {
        return getResponsiveValue(cols) || 1
    }

    const getGridGap = (gaps: Partial<Record<Breakpoint, string>>) => {
        return getResponsiveValue(gaps) || '16px'
    }

    return {
        getGridCols,
        getGridGap
    }
}

// 响应式字体大小
export function useResponsiveFontSize() {
    const { getResponsiveValue } = useResponsive()

    const getFontSize = (sizes: Partial<Record<Breakpoint, string>>) => {
        return getResponsiveValue(sizes) || '14px'
    }

    const getLineHeight = (heights: Partial<Record<Breakpoint, string>>) => {
        return getResponsiveValue(heights) || '1.5'
    }

    return {
        getFontSize,
        getLineHeight
    }
}

// 响应式间距
export function useResponsiveSpacing() {
    const { getResponsiveValue } = useResponsive()

    const getSpacing = (spacings: Partial<Record<Breakpoint, string>>) => {
        return getResponsiveValue(spacings) || '16px'
    }

    const getPadding = (paddings: Partial<Record<Breakpoint, string>>) => {
        return getResponsiveValue(paddings) || '16px'
    }

    const getMargin = (margins: Partial<Record<Breakpoint, string>>) => {
        return getResponsiveValue(margins) || '16px'
    }

    return {
        getSpacing,
        getPadding,
        getMargin
    }
}
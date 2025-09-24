<template>
    <div class="responsive-layout" :class="layoutClasses">
        <!-- 移动端顶部导航栏 -->
        <div v-if="isMobile" class="mobile-header">
            <div class="header-content">
                <div class="header-left">
                    <el-button type="text" @click="toggleMobileSidebar" class="menu-toggle">
                        <el-icon>
                            <Menu />
                        </el-icon>
                    </el-button>
                    <div class="app-title">
                        <slot name="title">旅游路线规划</slot>
                    </div>
                </div>
                <div class="header-right">
                    <slot name="header-actions" />
                </div>
            </div>
        </div>

        <!-- 侧边栏 -->
        <div v-if="showSidebar" class="layout-sidebar" :class="{ 'mobile-sidebar': isMobile }">
            <div class="sidebar-content">
                <slot name="sidebar" />
            </div>

            <!-- 移动端遮罩 -->
            <div v-if="isMobile && mobileSidebarVisible" class="mobile-overlay" @click="closeMobileSidebar"></div>
        </div>

        <!-- 主内容区域 -->
        <div class="layout-main" :class="{ 'with-sidebar': showSidebar }">
            <!-- 桌面端顶部工具栏 -->
            <div v-if="!isMobile && showToolbar" class="desktop-toolbar">
                <div class="toolbar-content">
                    <div class="toolbar-left">
                        <slot name="toolbar-left" />
                    </div>
                    <div class="toolbar-center">
                        <slot name="toolbar-center" />
                    </div>
                    <div class="toolbar-right">
                        <slot name="toolbar-right" />
                    </div>
                </div>
            </div>

            <!-- 主要内容 -->
            <div class="main-content" :class="{ 'with-toolbar': !isMobile && showToolbar }">
                <slot name="default" />
            </div>

            <!-- 浮动操作按钮 -->
            <div v-if="showFab" class="floating-actions">
                <slot name="fab" />
            </div>
        </div>

        <!-- 底部面板（移动端） -->
        <div v-if="isMobile && showBottomPanel" class="bottom-panel">
            <div class="panel-content">
                <slot name="bottom-panel" />
            </div>
        </div>

        <!-- 全局加载遮罩 -->
        <div v-if="loading" class="global-loading">
            <LoadingSpinner :text="loadingText" :type="loadingType" size="large" full-screen />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Menu } from '@element-plus/icons-vue'
import LoadingSpinner from './LoadingSpinner.vue'
import { useUIStore } from '@/stores/uiStore'

interface Props {
    /** 是否显示侧边栏 */
    showSidebar?: boolean
    /** 是否显示工具栏 */
    showToolbar?: boolean
    /** 是否显示底部面板 */
    showBottomPanel?: boolean
    /** 是否显示浮动操作按钮 */
    showFab?: boolean
    /** 侧边栏宽度 */
    sidebarWidth?: string
    /** 是否全局加载中 */
    loading?: boolean
    /** 加载文本 */
    loadingText?: string
    /** 加载动画类型 */
    loadingType?: 'default' | 'dots' | 'circle' | 'pulse'
    /** 布局模式 */
    mode?: 'default' | 'fullscreen' | 'compact'
}

interface Emits {
    (e: 'mobile-sidebar-toggle', visible: boolean): void
    (e: 'resize', size: { width: number; height: number }): void
}

const props = withDefaults(defineProps<Props>(), {
    showSidebar: true,
    showToolbar: true,
    showBottomPanel: false,
    showFab: true,
    sidebarWidth: '300px',
    loading: false,
    loadingType: 'default',
    mode: 'default'
})

const emit = defineEmits<Emits>()

// 使用UI store
const uiStore = useUIStore()

// 响应式数据
const mobileSidebarVisible = ref(false)
const windowSize = ref({ width: 0, height: 0 })

// 计算属性
const isMobile = computed(() => uiStore.isMobile)

const layoutClasses = computed(() => ({
    'is-mobile': isMobile.value,
    'is-desktop': !isMobile.value,
    'sidebar-visible': showSidebar.value,
    'mobile-sidebar-visible': mobileSidebarVisible.value,
    [`mode-${props.mode}`]: true,
    'is-loading': props.loading
}))

const showSidebar = computed(() => {
    if (isMobile.value) {
        return mobileSidebarVisible.value
    }
    return props.showSidebar
})

// 方法
const toggleMobileSidebar = () => {
    mobileSidebarVisible.value = !mobileSidebarVisible.value
    emit('mobile-sidebar-toggle', mobileSidebarVisible.value)
}

const closeMobileSidebar = () => {
    mobileSidebarVisible.value = false
    emit('mobile-sidebar-toggle', false)
}

const updateWindowSize = () => {
    windowSize.value = {
        width: window.innerWidth,
        height: window.innerHeight
    }
    emit('resize', windowSize.value)
}

const handleResize = () => {
    updateWindowSize()

    // 桌面端自动关闭移动端侧边栏
    if (!isMobile.value && mobileSidebarVisible.value) {
        mobileSidebarVisible.value = false
    }
}

const handleKeydown = (event: KeyboardEvent) => {
    // ESC键关闭移动端侧边栏
    if (event.key === 'Escape' && mobileSidebarVisible.value) {
        closeMobileSidebar()
    }
}

// 生命周期
onMounted(() => {
    updateWindowSize()
    window.addEventListener('resize', handleResize)
    document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    document.removeEventListener('keydown', handleKeydown)
})

// 暴露方法
defineExpose({
    toggleMobileSidebar,
    closeMobileSidebar,
    windowSize: windowSize.value
})
</script>

<style scoped lang="scss">
.responsive-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    position: relative;

    // 移动端顶部导航栏
    .mobile-header {
        height: 56px;
        background: var(--el-bg-color);
        border-bottom: 1px solid var(--el-border-color-light);
        z-index: 100;
        flex-shrink: 0;

        .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 100%;
            padding: 0 16px;

            .header-left {
                display: flex;
                align-items: center;
                gap: 12px;

                .menu-toggle {
                    padding: 8px;
                    margin: -8px;
                }

                .app-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--el-text-color-primary);
                }
            }

            .header-right {
                display: flex;
                align-items: center;
                gap: 8px;
            }
        }
    }

    // 主要布局容器
    .layout-container {
        display: flex;
        flex: 1;
        overflow: hidden;
    }

    // 侧边栏
    .layout-sidebar {
        background: var(--el-bg-color);
        border-right: 1px solid var(--el-border-color-light);
        z-index: 90;
        flex-shrink: 0;

        .sidebar-content {
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
        }

        // 移动端侧边栏
        &.mobile-sidebar {
            position: fixed;
            top: 56px;
            left: 0;
            bottom: 0;
            width: 280px;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);

            .mobile-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: -1;
            }
        }
    }

    // 主内容区域
    .layout-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;

        &.with-sidebar {
            width: calc(100% - v-bind(sidebarWidth));
        }

        // 桌面端工具栏
        .desktop-toolbar {
            height: 48px;
            background: var(--el-bg-color);
            border-bottom: 1px solid var(--el-border-color-light);
            flex-shrink: 0;

            .toolbar-content {
                display: flex;
                align-items: center;
                height: 100%;
                padding: 0 16px;

                .toolbar-left,
                .toolbar-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .toolbar-center {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            }
        }

        // 主要内容
        .main-content {
            flex: 1;
            overflow: hidden;
            position: relative;

            &.with-toolbar {
                height: calc(100% - 48px);
            }
        }

        // 浮动操作按钮
        .floating-actions {
            position: absolute;
            bottom: 20px;
            right: 20px;
            z-index: 80;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
    }

    // 底部面板（移动端）
    .bottom-panel {
        height: 60px;
        background: var(--el-bg-color);
        border-top: 1px solid var(--el-border-color-light);
        flex-shrink: 0;

        .panel-content {
            display: flex;
            align-items: center;
            justify-content: space-around;
            height: 100%;
            padding: 0 16px;
        }
    }

    // 全局加载遮罩
    .global-loading {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
    }

    // 状态类
    &.is-mobile {
        .layout-container {
            flex-direction: column;
        }

        .layout-main {
            &.with-sidebar {
                width: 100%;
            }
        }

        .floating-actions {
            bottom: 80px; // 为底部面板留出空间
        }
    }

    &.mobile-sidebar-visible {
        .layout-sidebar.mobile-sidebar {
            transform: translateX(0);
        }
    }

    &.mode-fullscreen {

        .mobile-header,
        .desktop-toolbar,
        .bottom-panel {
            display: none;
        }

        .layout-sidebar {
            display: none;
        }

        .layout-main {
            width: 100%;
        }
    }

    &.mode-compact {
        .mobile-header {
            height: 48px;
        }

        .desktop-toolbar {
            height: 40px;
        }

        .bottom-panel {
            height: 50px;
        }

        .floating-actions {
            bottom: 60px;
            right: 16px;
        }
    }

    &.is-loading {
        pointer-events: none;
    }
}

// 桌面端样式
@media (min-width: 769px) {
    .responsive-layout {
        flex-direction: row;

        .layout-sidebar {
            width: v-bind(sidebarWidth);
            position: relative;
            top: auto;
            left: auto;
            bottom: auto;
            transform: none;
            box-shadow: none;

            &.mobile-sidebar {
                position: relative;
                width: v-bind(sidebarWidth);
                transform: none;
                top: auto;
                left: auto;
                bottom: auto;
            }
        }

        .layout-main {
            .floating-actions {
                bottom: 20px;
            }
        }
    }
}

// 大屏幕优化
@media (min-width: 1200px) {
    .responsive-layout {
        .layout-main {
            .desktop-toolbar {
                .toolbar-content {
                    padding: 0 24px;
                }
            }

            .main-content {
                padding: 0;
            }

            .floating-actions {
                bottom: 24px;
                right: 24px;
            }
        }
    }
}

// 深色主题适配
@media (prefers-color-scheme: dark) {
    .responsive-layout {

        .mobile-header,
        .desktop-toolbar,
        .bottom-panel,
        .layout-sidebar {
            background: var(--el-bg-color);
            border-color: var(--el-border-color);
        }

        .layout-sidebar.mobile-sidebar {
            box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
        }
    }
}

// 高对比度模式
@media (prefers-contrast: high) {
    .responsive-layout {

        .mobile-header,
        .desktop-toolbar,
        .bottom-panel,
        .layout-sidebar {
            border-width: 2px;
        }
    }
}

// 减少动画模式
@media (prefers-reduced-motion: reduce) {
    .responsive-layout {
        .layout-sidebar.mobile-sidebar {
            transition: none;
        }
    }
}
</style>
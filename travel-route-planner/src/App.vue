<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import ResponsiveLayout from '@/components/Common/ResponsiveLayout.vue'
import HelpGuide from '@/components/Common/HelpGuide.vue'
import ErrorMessage from '@/components/Common/ErrorMessage.vue'
import { useUIStore } from '@/stores/uiStore'
import { Setting, Moon, Sunny, QuestionFilled, Bell } from '@element-plus/icons-vue'

// 使用stores
const uiStore = useUIStore()
const route = useRoute()

// 响应式数据
const globalError = ref<any>(null)
const showSettings = ref(false)
const helpGuideRef = ref()

// 计算属性
const isDarkTheme = computed(() => uiStore.isDarkTheme)
const isLoading = computed(() => uiStore.isLoading)
const hasNotifications = computed(() => uiStore.hasNotifications)

// 方法
const toggleTheme = () => {
  uiStore.toggleTheme()
  ElMessage.success(`已切换到${isDarkTheme.value ? '深色' : '浅色'}主题`)
}

const openSettings = () => {
  showSettings.value = true
}

const showHelp = () => {
  helpGuideRef.value?.show()
}

const handleGlobalError = (error: any) => {
  console.error('Global error:', error)
  globalError.value = {
    title: '应用程序错误',
    message: error.message || '发生了未知错误',
    details: error.stack,
    timestamp: new Date(),
    retryable: true
  }
}

const clearGlobalError = () => {
  globalError.value = null
}

const retryAfterError = () => {
  clearGlobalError()
  // 可以在这里添加重试逻辑
  window.location.reload()
}

const handleFeedbackSubmit = (feedback: any) => {
  console.log('Feedback submitted:', feedback)
  // 这里可以发送反馈到服务器
}

const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  // 全局快捷键处理
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'd':
        event.preventDefault()
        toggleTheme()
        break
      case 'h':
        event.preventDefault()
        showHelp()
        break
      case ',':
        event.preventDefault()
        openSettings()
        break
    }
  }

  // F1 显示帮助
  if (event.key === 'F1') {
    event.preventDefault()
    showHelp()
  }
}

// 生命周期
onMounted(() => {
  // 注册全局错误处理
  window.addEventListener('error', (event) => {
    handleGlobalError(event.error)
  })

  window.addEventListener('unhandledrejection', (event) => {
    handleGlobalError(event.reason)
  })

  // 注册键盘快捷键
  document.addEventListener('keydown', handleKeyboardShortcuts)

  // 初始化UI
  uiStore.initializeUI()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts)
  uiStore.cleanup()
})
</script>

<template>
  <div id="app" :class="{ 'dark-theme': isDarkTheme }">
    <!-- 全局错误提示 -->
    <div v-if="globalError" class="global-error">
      <ErrorMessage :title="globalError.title" :message="globalError.message" :details="globalError.details"
        :retryable="globalError.retryable" :show-support="true" @retry="retryAfterError" @close="clearGlobalError"
        @report="handleFeedbackSubmit" />
    </div>

    <!-- 主要布局 -->
    <ResponsiveLayout :loading="isLoading" loading-text="加载中..." loading-type="circle" :show-sidebar="false"
      :show-toolbar="true" :show-fab="true">
      <!-- 页面标题 -->
      <template #title>
        <div class="app-title">
          <img src="@/assets/logo.svg" alt="Logo" class="app-logo" />
          <span>旅游路线规划器</span>
        </div>
      </template>

      <!-- 顶部工具栏左侧 -->
      <template #toolbar-left>
        <div class="toolbar-section">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.name !== 'home'">
              {{ route.meta?.title || route.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
      </template>

      <!-- 顶部工具栏中央 -->
      <template #toolbar-center>
        <div class="search-section">
          <!-- 这里可以放置搜索框或其他中央工具 -->
        </div>
      </template>

      <!-- 顶部工具栏右侧 -->
      <template #toolbar-right>
        <div class="toolbar-actions">
          <!-- 通知指示器 -->
          <el-badge v-if="hasNotifications" :value="uiStore.notifications.length" class="notification-badge">
            <el-button type="text" @click="uiStore.clearNotifications()">
              <el-icon>
                <Bell />
              </el-icon>
            </el-button>
          </el-badge>

          <!-- 主题切换 -->
          <el-tooltip :content="isDarkTheme ? '切换到浅色主题' : '切换到深色主题'" placement="bottom">
            <el-button type="text" @click="toggleTheme">
              <el-icon>
                <component :is="isDarkTheme ? Sunny : Moon" />
              </el-icon>
            </el-button>
          </el-tooltip>

          <!-- 帮助按钮 -->
          <el-tooltip content="帮助指南 (F1)" placement="bottom">
            <el-button type="text" @click="showHelp">
              <el-icon>
                <QuestionFilled />
              </el-icon>
            </el-button>
          </el-tooltip>

          <!-- 设置按钮 -->
          <el-tooltip content="设置 (Ctrl+,)" placement="bottom">
            <el-button type="text" @click="openSettings">
              <el-icon>
                <Setting />
              </el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </template>

      <!-- 主要内容区域 -->
      <template #default>
        <div class="router-view-container">
          <RouterView v-slot="{ Component, route }">
            <Transition name="page" mode="out-in">
              <component :is="Component" :key="route.path" />
            </Transition>
          </RouterView>
        </div>
      </template>

      <!-- 浮动操作按钮 -->
      <template #fab>
        <!-- 帮助指南组件会自动显示浮动帮助按钮 -->
      </template>
    </ResponsiveLayout>

    <!-- 帮助指南 -->
    <HelpGuide ref="helpGuideRef" @feedback-submit="handleFeedbackSubmit" />

    <!-- 全局通知容器 -->
    <div class="notifications-container">
      <TransitionGroup name="notification" tag="div">
        <div v-for="notification in uiStore.notifications" :key="notification.id" class="notification-item"
          :class="`notification-${notification.type}`">
          <el-alert :title="notification.title" :description="notification.message" :type="notification.type"
            :closable="true" @close="uiStore.removeNotification(notification.id)" />
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped lang="scss">
#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  transition: all 0.3s ease;

  &.dark-theme {
    color-scheme: dark;
  }
}

.global-error {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  max-width: 600px;
  width: calc(100% - 40px);
}

.app-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .app-logo {
    width: 32px;
    height: 32px;
  }
}

.toolbar-section {
  display: flex;
  align-items: center;
}

.search-section {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;

  .notification-badge {
    :deep(.el-badge__content) {
      top: 8px;
      right: 8px;
    }
  }
}

.router-view-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.notifications-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9000;
  max-width: 400px;
  width: calc(100% - 40px);

  .notification-item {
    margin-bottom: 12px;
  }
}

// 页面切换动画
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

// 通知动画
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}

// 响应式设计
@media (max-width: 768px) {
  .global-error {
    top: 10px;
    width: calc(100% - 20px);
  }

  .notifications-container {
    top: 70px;
    right: 10px;
    width: calc(100% - 20px);
  }

  .toolbar-actions {
    gap: 4px;

    .el-button {
      padding: 8px;
    }
  }
}

// 深色主题特定样式
.dark-theme {
  .global-error {
    :deep(.error-message) {
      background: var(--el-bg-color);
      border-color: var(--el-border-color);
    }
  }
}

// 高对比度模式
@media (prefers-contrast: high) {
  .toolbar-actions {
    .el-button {
      border: 1px solid var(--el-border-color);
    }
  }
}

// 减少动画模式
@media (prefers-reduced-motion: reduce) {

  .page-enter-active,
  .page-leave-active,
  .notification-enter-active,
  .notification-leave-active {
    transition: none;
  }
}
</style>

<template>
    <div class="help-guide">
        <!-- 帮助按钮 -->
        <el-button v-if="!visible" class="help-trigger" :class="{ 'floating': floating }" type="primary" :size="size"
            circle @click="showGuide">
            <el-icon>
                <QuestionFilled />
            </el-icon>
        </el-button>

        <!-- 帮助面板 -->
        <el-drawer v-model="visible" title="操作指引" :size="drawerSize" direction="rtl" :modal="modal"
            :close-on-click-modal="closeOnClickModal">
            <div class="help-content">
                <!-- 搜索框 -->
                <div class="help-search">
                    <el-input v-model="searchQuery" placeholder="搜索帮助内容..." clearable @input="handleSearch">
                        <template #prefix>
                            <el-icon>
                                <Search />
                            </el-icon>
                        </template>
                    </el-input>
                </div>

                <!-- 快速导航 -->
                <div class="help-navigation">
                    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
                        <el-tab-pane label="快速入门" name="quickstart">
                            <QuickStartGuide />
                        </el-tab-pane>
                        <el-tab-pane label="功能介绍" name="features">
                            <FeaturesGuide :search-query="searchQuery" />
                        </el-tab-pane>
                        <el-tab-pane label="常见问题" name="faq">
                            <FAQGuide :search-query="searchQuery" />
                        </el-tab-pane>
                        <el-tab-pane label="快捷键" name="shortcuts">
                            <ShortcutsGuide />
                        </el-tab-pane>
                    </el-tabs>
                </div>

                <!-- 底部操作 -->
                <div class="help-footer">
                    <el-divider />
                    <div class="footer-actions">
                        <el-button type="text" @click="startTour">
                            <el-icon>
                                <Guide />
                            </el-icon>
                            开始引导教程
                        </el-button>
                        <el-button type="text" @click="openFeedback">
                            <el-icon>
                                <ChatDotRound />
                            </el-icon>
                            意见反馈
                        </el-button>
                        <el-button type="text" @click="resetTutorial">
                            <el-icon>
                                <RefreshLeft />
                            </el-icon>
                            重置教程
                        </el-button>
                    </div>
                </div>
            </div>
        </el-drawer>

        <!-- 引导遮罩 -->
        <TourGuide v-model="showTour" :steps="tourSteps" @finish="handleTourFinish" @skip="handleTourSkip" />

        <!-- 反馈对话框 -->
        <FeedbackDialog v-model="showFeedback" @submit="handleFeedbackSubmit" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
    QuestionFilled,
    Search,
    Guide,
    ChatDotRound,
    RefreshLeft
} from '@element-plus/icons-vue'
import QuickStartGuide from './HelpGuide/QuickStartGuide.vue'
import FeaturesGuide from './HelpGuide/FeaturesGuide.vue'
import FAQGuide from './HelpGuide/FAQGuide.vue'
import ShortcutsGuide from './HelpGuide/ShortcutsGuide.vue'
import TourGuide from './TourGuide.vue'
import FeedbackDialog from './FeedbackDialog.vue'

interface Props {
    /** 是否浮动显示 */
    floating?: boolean
    /** 按钮尺寸 */
    size?: 'small' | 'default' | 'large'
    /** 抽屉尺寸 */
    drawerSize?: string | number
    /** 是否显示遮罩 */
    modal?: boolean
    /** 点击遮罩是否关闭 */
    closeOnClickModal?: boolean
    /** 初始显示的标签页 */
    defaultTab?: string
}

interface Emits {
    (e: 'tour-start'): void
    (e: 'tour-finish'): void
    (e: 'feedback-submit', feedback: any): void
}

const props = withDefaults(defineProps<Props>(), {
    floating: true,
    size: 'default',
    drawerSize: '400px',
    modal: false,
    closeOnClickModal: true,
    defaultTab: 'quickstart'
})

const emit = defineEmits<Emits>()

// 响应式数据
const visible = ref(false)
const activeTab = ref(props.defaultTab)
const searchQuery = ref('')
const showTour = ref(false)
const showFeedback = ref(false)

// 引导步骤配置
const tourSteps = ref([
    {
        target: '.map-container',
        title: '地图区域',
        content: '这里是主要的地图显示区域，您可以在这里查看和编辑旅游路线。',
        placement: 'bottom'
    },
    {
        target: '.location-panel',
        title: '地点管理',
        content: '在这里可以添加、编辑和管理旅游地点信息。',
        placement: 'left'
    },
    {
        target: '.route-panel',
        title: '路线规划',
        content: '查看和调整地点之间的路线连接和行程安排。',
        placement: 'left'
    },
    {
        target: '.export-panel',
        title: '导出功能',
        content: '完成规划后，可以将路线图导出为图片格式。',
        placement: 'left'
    }
])

// 计算属性
const isFirstVisit = computed(() => {
    return !localStorage.getItem('travel-planner-tutorial-completed')
})

// 方法
const showGuide = () => {
    visible.value = true
}

const hideGuide = () => {
    visible.value = false
}

const handleSearch = (query: string) => {
    // 搜索逻辑将在子组件中处理
}

const handleTabChange = (tabName: string) => {
    activeTab.value = tabName
}

const startTour = () => {
    visible.value = false
    showTour.value = true
    emit('tour-start')
}

const handleTourFinish = () => {
    localStorage.setItem('travel-planner-tutorial-completed', 'true')
    ElMessage.success('引导教程完成！')
    emit('tour-finish')
}

const handleTourSkip = () => {
    localStorage.setItem('travel-planner-tutorial-completed', 'true')
    ElMessage.info('已跳过引导教程')
}

const openFeedback = () => {
    showFeedback.value = true
}

const handleFeedbackSubmit = (feedback: any) => {
    emit('feedback-submit', feedback)
    ElMessage.success('感谢您的反馈！')
}

const resetTutorial = () => {
    localStorage.removeItem('travel-planner-tutorial-completed')
    ElMessage.success('教程状态已重置，下次访问时将重新显示引导')
}

// 生命周期
onMounted(() => {
    // 首次访问自动显示引导
    if (isFirstVisit.value) {
        setTimeout(() => {
            showTour.value = true
        }, 1000)
    }
})

// 暴露方法
defineExpose({
    show: showGuide,
    hide: hideGuide,
    startTour
})
</script>

<style scoped lang="scss">
.help-guide {
    .help-trigger {
        &.floating {
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
            }
        }
    }

    .help-content {
        height: 100%;
        display: flex;
        flex-direction: column;

        .help-search {
            margin-bottom: 20px;
        }

        .help-navigation {
            flex: 1;
            overflow: hidden;

            :deep(.el-tabs__content) {
                height: calc(100% - 40px);
                overflow-y: auto;
            }

            :deep(.el-tab-pane) {
                height: 100%;
            }
        }

        .help-footer {
            margin-top: auto;
            padding-top: 20px;

            .footer-actions {
                display: flex;
                flex-direction: column;
                gap: 8px;

                .el-button {
                    justify-content: flex-start;
                    width: 100%;
                }
            }
        }
    }
}

// 响应式设计
@media (max-width: 768px) {
    .help-guide {
        .help-trigger.floating {
            bottom: 60px;
            right: 15px;
        }
    }
}

// 深色主题适配
@media (prefers-color-scheme: dark) {
    .help-guide {
        .help-trigger.floating {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

            &:hover {
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
            }
        }
    }
}
</style>
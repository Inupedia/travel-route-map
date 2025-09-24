<template>
    <div v-if="visible" class="tour-guide">
        <!-- 遮罩层 -->
        <div class="tour-overlay" @click="handleOverlayClick"></div>

        <!-- 高亮区域 -->
        <div v-if="currentStep && highlightRect" class="tour-highlight" :style="highlightStyle"></div>

        <!-- 引导气泡 -->
        <div v-if="currentStep" class="tour-popup" :class="[`placement-${currentStep.placement || 'bottom'}`]"
            :style="popupStyle">
            <div class="popup-header">
                <div class="step-indicator">
                    <span class="current-step">{{ currentStepIndex + 1 }}</span>
                    <span class="total-steps">/ {{ steps.length }}</span>
                </div>
                <el-button type="text" @click="closeTour" class="close-btn">
                    <el-icon>
                        <Close />
                    </el-icon>
                </el-button>
            </div>

            <div class="popup-content">
                <h3 class="step-title">{{ currentStep.title }}</h3>
                <p class="step-content">{{ currentStep.content }}</p>

                <div v-if="currentStep.image" class="step-image">
                    <el-image :src="currentStep.image" :alt="currentStep.title" fit="contain"
                        style="width: 100%; max-height: 150px;" />
                </div>
            </div>

            <div class="popup-footer">
                <div class="step-progress">
                    <div v-for="(step, index) in steps" :key="index" class="progress-dot"
                        :class="{ active: index === currentStepIndex, completed: index < currentStepIndex }"
                        @click="goToStep(index)"></div>
                </div>

                <div class="step-actions">
                    <el-button v-if="currentStepIndex > 0" @click="previousStep">
                        上一步
                    </el-button>
                    <el-button type="text" @click="skipTour">
                        跳过引导
                    </el-button>
                    <el-button v-if="currentStepIndex < steps.length - 1" type="primary" @click="nextStep">
                        下一步
                    </el-button>
                    <el-button v-else type="success" @click="finishTour">
                        完成
                    </el-button>
                </div>
            </div>

            <!-- 箭头指示器 -->
            <div class="popup-arrow" :class="`arrow-${currentStep.placement || 'bottom'}`"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Close } from '@element-plus/icons-vue'

interface TourStep {
    target: string
    title: string
    content: string
    placement?: 'top' | 'bottom' | 'left' | 'right'
    image?: string
    beforeShow?: () => void
    afterShow?: () => void
}

interface Props {
    modelValue: boolean
    steps: TourStep[]
    maskClosable?: boolean
    showProgress?: boolean
    autoNext?: boolean
    autoNextDelay?: number
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'finish'): void
    (e: 'skip'): void
    (e: 'step-change', step: number): void
}

const props = withDefaults(defineProps<Props>(), {
    maskClosable: false,
    showProgress: true,
    autoNext: false,
    autoNextDelay: 3000
})

const emit = defineEmits<Emits>()

// 响应式数据
const visible = ref(props.modelValue)
const currentStepIndex = ref(0)
const highlightRect = ref<DOMRect | null>(null)
const popupPosition = ref({ x: 0, y: 0 })
const autoNextTimer = ref<NodeJS.Timeout>()

// 计算属性
const currentStep = computed(() => props.steps[currentStepIndex.value])

const highlightStyle = computed(() => {
    if (!highlightRect.value) return {}

    return {
        left: `${highlightRect.value.left - 4}px`,
        top: `${highlightRect.value.top - 4}px`,
        width: `${highlightRect.value.width + 8}px`,
        height: `${highlightRect.value.height + 8}px`
    }
})

const popupStyle = computed(() => {
    return {
        left: `${popupPosition.value.x}px`,
        top: `${popupPosition.value.y}px`
    }
})

// 监听器
watch(() => props.modelValue, (newValue) => {
    visible.value = newValue
    if (newValue) {
        startTour()
    } else {
        stopTour()
    }
})

watch(visible, (newValue) => {
    emit('update:modelValue', newValue)
})

watch(currentStepIndex, (newIndex) => {
    emit('step-change', newIndex)
    updateHighlight()

    if (props.autoNext && newIndex < props.steps.length - 1) {
        startAutoNextTimer()
    }
})

// 方法
const startTour = async () => {
    currentStepIndex.value = 0
    await nextTick()
    updateHighlight()

    // 执行当前步骤的前置操作
    if (currentStep.value?.beforeShow) {
        currentStep.value.beforeShow()
    }
}

const stopTour = () => {
    clearAutoNextTimer()
    highlightRect.value = null
}

const updateHighlight = async () => {
    if (!currentStep.value) return

    await nextTick()

    const targetElement = document.querySelector(currentStep.value.target)
    if (targetElement) {
        highlightRect.value = targetElement.getBoundingClientRect()
        calculatePopupPosition(targetElement)

        // 滚动到目标元素
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        })

        // 执行当前步骤的后置操作
        if (currentStep.value.afterShow) {
            currentStep.value.afterShow()
        }
    } else {
        console.warn(`Tour target not found: ${currentStep.value.target}`)
    }
}

const calculatePopupPosition = (targetElement: Element) => {
    const targetRect = targetElement.getBoundingClientRect()
    const placement = currentStep.value?.placement || 'bottom'
    const popupWidth = 320
    const popupHeight = 200
    const offset = 20

    let x = 0
    let y = 0

    switch (placement) {
        case 'top':
            x = targetRect.left + targetRect.width / 2 - popupWidth / 2
            y = targetRect.top - popupHeight - offset
            break
        case 'bottom':
            x = targetRect.left + targetRect.width / 2 - popupWidth / 2
            y = targetRect.bottom + offset
            break
        case 'left':
            x = targetRect.left - popupWidth - offset
            y = targetRect.top + targetRect.height / 2 - popupHeight / 2
            break
        case 'right':
            x = targetRect.right + offset
            y = targetRect.top + targetRect.height / 2 - popupHeight / 2
            break
    }

    // 确保弹窗在视窗内
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    x = Math.max(10, Math.min(x, viewportWidth - popupWidth - 10))
    y = Math.max(10, Math.min(y, viewportHeight - popupHeight - 10))

    popupPosition.value = { x, y }
}

const nextStep = () => {
    clearAutoNextTimer()
    if (currentStepIndex.value < props.steps.length - 1) {
        currentStepIndex.value++
    }
}

const previousStep = () => {
    clearAutoNextTimer()
    if (currentStepIndex.value > 0) {
        currentStepIndex.value--
    }
}

const goToStep = (index: number) => {
    clearAutoNextTimer()
    if (index >= 0 && index < props.steps.length) {
        currentStepIndex.value = index
    }
}

const finishTour = () => {
    visible.value = false
    emit('finish')
}

const skipTour = () => {
    visible.value = false
    emit('skip')
}

const closeTour = () => {
    visible.value = false
}

const handleOverlayClick = () => {
    if (props.maskClosable) {
        closeTour()
    }
}

const startAutoNextTimer = () => {
    clearAutoNextTimer()
    autoNextTimer.value = setTimeout(() => {
        nextStep()
    }, props.autoNextDelay)
}

const clearAutoNextTimer = () => {
    if (autoNextTimer.value) {
        clearTimeout(autoNextTimer.value)
        autoNextTimer.value = undefined
    }
}

const handleResize = () => {
    if (visible.value && currentStep.value) {
        updateHighlight()
    }
}

// 生命周期
onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    clearAutoNextTimer()
})

// 暴露方法
defineExpose({
    nextStep,
    previousStep,
    goToStep,
    finish: finishTour,
    skip: skipTour
})
</script>

<style scoped lang="scss">
.tour-guide {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    pointer-events: none;

    .tour-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        pointer-events: all;
    }

    .tour-highlight {
        position: absolute;
        border: 2px solid var(--el-color-primary);
        border-radius: 4px;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
        pointer-events: none;
        z-index: 1;
        animation: highlight-pulse 2s infinite;
    }

    .tour-popup {
        position: absolute;
        width: 320px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        pointer-events: all;
        z-index: 2;
        animation: popup-enter 0.3s ease-out;

        .popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 16px 0;

            .step-indicator {
                font-size: 14px;
                color: var(--el-text-color-secondary);

                .current-step {
                    font-weight: 600;
                    color: var(--el-color-primary);
                }
            }

            .close-btn {
                padding: 4px;
                margin: -4px;
            }
        }

        .popup-content {
            padding: 16px;

            .step-title {
                margin: 0 0 8px 0;
                font-size: 18px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }

            .step-content {
                margin: 0 0 16px 0;
                line-height: 1.6;
                color: var(--el-text-color-regular);
            }

            .step-image {
                margin-bottom: 16px;
                border-radius: 6px;
                overflow: hidden;
            }
        }

        .popup-footer {
            padding: 0 16px 16px;

            .step-progress {
                display: flex;
                justify-content: center;
                gap: 8px;
                margin-bottom: 16px;

                .progress-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--el-border-color);
                    cursor: pointer;
                    transition: all 0.2s;

                    &.active {
                        background: var(--el-color-primary);
                        transform: scale(1.2);
                    }

                    &.completed {
                        background: var(--el-color-success);
                    }

                    &:hover {
                        transform: scale(1.1);
                    }
                }
            }

            .step-actions {
                display: flex;
                justify-content: space-between;
                gap: 8px;

                .el-button {
                    flex: 1;
                }
            }
        }

        .popup-arrow {
            position: absolute;
            width: 0;
            height: 0;
            border: 8px solid transparent;

            &.arrow-top {
                bottom: -16px;
                left: 50%;
                transform: translateX(-50%);
                border-top-color: white;
            }

            &.arrow-bottom {
                top: -16px;
                left: 50%;
                transform: translateX(-50%);
                border-bottom-color: white;
            }

            &.arrow-left {
                right: -16px;
                top: 50%;
                transform: translateY(-50%);
                border-left-color: white;
            }

            &.arrow-right {
                left: -16px;
                top: 50%;
                transform: translateY(-50%);
                border-right-color: white;
            }
        }

        // 不同位置的样式调整
        &.placement-top {
            transform-origin: center bottom;
        }

        &.placement-bottom {
            transform-origin: center top;
        }

        &.placement-left {
            transform-origin: right center;
        }

        &.placement-right {
            transform-origin: left center;
        }
    }
}

// 动画定义
@keyframes highlight-pulse {

    0%,
    100% {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
    }

    50% {
        border-color: var(--el-color-primary-light-3);
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
    }
}

@keyframes popup-enter {
    0% {
        opacity: 0;
        transform: scale(0.8);
    }

    100% {
        opacity: 1;
        transform: scale(1);
    }
}

// 响应式设计
@media (max-width: 768px) {
    .tour-guide {
        .tour-popup {
            width: calc(100vw - 40px);
            max-width: 320px;
            left: 20px !important;
            right: 20px;

            .popup-footer {
                .step-actions {
                    flex-direction: column;

                    .el-button {
                        width: 100%;
                    }
                }
            }
        }
    }
}

// 深色主题适配
@media (prefers-color-scheme: dark) {
    .tour-guide {
        .tour-popup {
            background: var(--el-bg-color);
            border: 1px solid var(--el-border-color);

            .popup-arrow {
                &.arrow-top {
                    border-top-color: var(--el-bg-color);
                }

                &.arrow-bottom {
                    border-bottom-color: var(--el-bg-color);
                }

                &.arrow-left {
                    border-left-color: var(--el-bg-color);
                }

                &.arrow-right {
                    border-right-color: var(--el-bg-color);
                }
            }
        }
    }
}
</style>
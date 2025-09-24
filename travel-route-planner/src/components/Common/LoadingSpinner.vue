<template>
    <div class="loading-spinner" :class="{ 'full-screen': fullScreen, [`size-${size}`]: true }">
        <div class="spinner-container">
            <div class="spinner" :class="{ [`type-${type}`]: true }">
                <div v-if="type === 'dots'" class="dots">
                    <div class="dot" v-for="i in 3" :key="i"></div>
                </div>
                <div v-else-if="type === 'circle'" class="circle">
                    <div class="circle-path"></div>
                </div>
                <div v-else-if="type === 'pulse'" class="pulse">
                    <div class="pulse-ring" v-for="i in 3" :key="i"></div>
                </div>
                <div v-else class="default-spinner">
                    <el-icon class="is-loading">
                        <Loading />
                    </el-icon>
                </div>
            </div>
            <div v-if="text" class="loading-text">{{ text }}</div>
            <div v-if="progress !== undefined" class="loading-progress">
                <el-progress :percentage="progress" :show-text="false" :stroke-width="4" />
                <span class="progress-text">{{ progress }}%</span>
            </div>
        </div>
        <div v-if="fullScreen" class="loading-overlay" @click="handleOverlayClick"></div>
    </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'

interface Props {
    /** 加载文本 */
    text?: string
    /** 加载进度 (0-100) */
    progress?: number
    /** 是否全屏显示 */
    fullScreen?: boolean
    /** 加载动画类型 */
    type?: 'default' | 'dots' | 'circle' | 'pulse'
    /** 尺寸 */
    size?: 'small' | 'medium' | 'large'
    /** 是否可以点击遮罩关闭 */
    closable?: boolean
}

interface Emits {
    (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
    type: 'default',
    size: 'medium',
    fullScreen: false,
    closable: false
})

const emit = defineEmits<Emits>()

const handleOverlayClick = () => {
    if (props.closable) {
        emit('close')
    }
}
</script>

<style scoped lang="scss">
.loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    &.full-screen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(2px);
    }

    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: -1;
    }

    .spinner-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        z-index: 1;
    }

    .spinner {
        display: flex;
        align-items: center;
        justify-content: center;

        &.type-dots {
            .dots {
                display: flex;
                gap: 4px;

                .dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--el-color-primary);
                    animation: dot-bounce 1.4s ease-in-out infinite both;

                    &:nth-child(1) {
                        animation-delay: -0.32s;
                    }

                    &:nth-child(2) {
                        animation-delay: -0.16s;
                    }

                    &:nth-child(3) {
                        animation-delay: 0s;
                    }
                }
            }
        }

        &.type-circle {
            .circle {
                width: 40px;
                height: 40px;
                position: relative;

                .circle-path {
                    width: 100%;
                    height: 100%;
                    border: 3px solid var(--el-border-color-light);
                    border-top-color: var(--el-color-primary);
                    border-radius: 50%;
                    animation: circle-spin 1s linear infinite;
                }
            }
        }

        &.type-pulse {
            .pulse {
                position: relative;
                width: 40px;
                height: 40px;

                .pulse-ring {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border: 2px solid var(--el-color-primary);
                    border-radius: 50%;
                    opacity: 0;
                    animation: pulse-scale 2s ease-in-out infinite;

                    &:nth-child(1) {
                        animation-delay: 0s;
                    }

                    &:nth-child(2) {
                        animation-delay: 0.7s;
                    }

                    &:nth-child(3) {
                        animation-delay: 1.4s;
                    }
                }
            }
        }

        .default-spinner {
            .el-icon {
                font-size: 24px;
                color: var(--el-color-primary);
            }
        }
    }

    .loading-text {
        color: var(--el-text-color-regular);
        font-size: 14px;
        text-align: center;
        white-space: nowrap;
    }

    .loading-progress {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        min-width: 200px;

        .progress-text {
            font-size: 12px;
            color: var(--el-text-color-secondary);
        }
    }

    // 尺寸变体
    &.size-small {
        .spinner {
            &.type-dots .dots .dot {
                width: 6px;
                height: 6px;
            }

            &.type-circle .circle {
                width: 24px;
                height: 24px;
            }

            &.type-pulse .pulse {
                width: 24px;
                height: 24px;
            }

            .default-spinner .el-icon {
                font-size: 18px;
            }
        }

        .loading-text {
            font-size: 12px;
        }
    }

    &.size-large {
        .spinner {
            &.type-dots .dots {
                gap: 6px;

                .dot {
                    width: 12px;
                    height: 12px;
                }
            }

            &.type-circle .circle {
                width: 60px;
                height: 60px;
            }

            &.type-pulse .pulse {
                width: 60px;
                height: 60px;
            }

            .default-spinner .el-icon {
                font-size: 36px;
            }
        }

        .loading-text {
            font-size: 16px;
        }
    }
}

// 动画定义
@keyframes dot-bounce {

    0%,
    80%,
    100% {
        transform: scale(0);
    }

    40% {
        transform: scale(1);
    }
}

@keyframes circle-spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

@keyframes pulse-scale {
    0% {
        transform: scale(0);
        opacity: 1;
    }

    100% {
        transform: scale(1);
        opacity: 0;
    }
}

// 响应式设计
@media (max-width: 768px) {
    .loading-spinner {
        .loading-progress {
            min-width: 150px;
        }

        .loading-text {
            font-size: 13px;
        }
    }
}
</style>
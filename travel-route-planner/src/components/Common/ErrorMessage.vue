<template>
    <div class="error-message" :class="[`type-${type}`, `size-${size}`, { 'show-details': showDetails }]">
        <div class="error-header" @click="toggleDetails">
            <div class="error-icon">
                <el-icon>
                    <component :is="iconComponent" />
                </el-icon>
            </div>
            <div class="error-content">
                <div class="error-title">{{ title }}</div>
                <div class="error-description">{{ message }}</div>
            </div>
            <div class="error-actions">
                <el-button v-if="retryable" type="primary" size="small" @click="handleRetry">
                    <el-icon>
                        <Refresh />
                    </el-icon>
                    重试
                </el-button>
                <el-button v-if="closable" type="text" size="small" @click="handleClose">
                    <el-icon>
                        <Close />
                    </el-icon>
                </el-button>
                <el-button v-if="details" type="text" size="small" @click="toggleDetails">
                    <el-icon>
                        <component :is="showDetails ? 'ArrowUp' : 'ArrowDown'" />
                    </el-icon>
                    {{ showDetails ? '收起' : '详情' }}
                </el-button>
            </div>
        </div>

        <!-- 错误详情 -->
        <div v-if="details && showDetails" class="error-details">
            <div class="details-header">
                <el-icon>
                    <Document />
                </el-icon>
                错误详情
            </div>
            <div class="details-content">
                <pre v-if="typeof details === 'string'">{{ details }}</pre>
                <div v-else>
                    <div v-for="(value, key) in details" :key="key" class="detail-item">
                        <strong>{{ key }}:</strong> {{ value }}
                    </div>
                </div>
            </div>
        </div>

        <!-- 建议操作 -->
        <div v-if="suggestions && suggestions.length > 0" class="error-suggestions">
            <div class="suggestions-header">
                <el-icon>
                    <Star />
                </el-icon>
                解决建议
            </div>
            <ul class="suggestions-list">
                <li v-for="(suggestion, index) in suggestions" :key="index">
                    {{ suggestion }}
                </li>
            </ul>
        </div>

        <!-- 联系支持 -->
        <div v-if="showSupport" class="error-support">
            <el-divider />
            <div class="support-content">
                <p>如果问题持续存在，请联系技术支持：</p>
                <div class="support-actions">
                    <el-button type="text" @click="copyErrorInfo">
                        <el-icon>
                            <CopyDocument />
                        </el-icon>
                        复制错误信息
                    </el-button>
                    <el-button type="text" @click="reportError">
                        <el-icon>
                            <Warning />
                        </el-icon>
                        报告问题
                    </el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
    CircleClose,
    Warning,
    InfoFilled,
    SuccessFilled,
    Refresh,
    Close,
    ArrowUp,
    ArrowDown,
    Document,
    Star,
    CopyDocument
} from '@element-plus/icons-vue'

interface Props {
    /** 错误类型 */
    type?: 'error' | 'warning' | 'info' | 'success'
    /** 错误标题 */
    title: string
    /** 错误消息 */
    message: string
    /** 错误详情 */
    details?: string | Record<string, any>
    /** 解决建议 */
    suggestions?: string[]
    /** 是否可重试 */
    retryable?: boolean
    /** 是否可关闭 */
    closable?: boolean
    /** 是否显示技术支持 */
    showSupport?: boolean
    /** 尺寸 */
    size?: 'small' | 'medium' | 'large'
    /** 错误代码 */
    errorCode?: string
    /** 时间戳 */
    timestamp?: Date
}

interface Emits {
    (e: 'retry'): void
    (e: 'close'): void
    (e: 'report', errorInfo: any): void
}

const props = withDefaults(defineProps<Props>(), {
    type: 'error',
    size: 'medium',
    retryable: false,
    closable: true,
    showSupport: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const showDetails = ref(false)

// 计算属性
const iconComponent = computed(() => {
    switch (props.type) {
        case 'error': return CircleClose
        case 'warning': return Warning
        case 'info': return InfoFilled
        case 'success': return SuccessFilled
        default: return CircleClose
    }
})

// 方法
const toggleDetails = () => {
    if (props.details) {
        showDetails.value = !showDetails.value
    }
}

const handleRetry = () => {
    emit('retry')
}

const handleClose = () => {
    emit('close')
}

const copyErrorInfo = async () => {
    const errorInfo = {
        title: props.title,
        message: props.message,
        details: props.details,
        errorCode: props.errorCode,
        timestamp: props.timestamp || new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
    }

    try {
        await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2))
        ElMessage.success('错误信息已复制到剪贴板')
    } catch (error) {
        ElMessage.error('复制失败，请手动复制')
        console.error('Copy failed:', error)
    }
}

const reportError = () => {
    const errorInfo = {
        title: props.title,
        message: props.message,
        details: props.details,
        errorCode: props.errorCode,
        timestamp: props.timestamp || new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
    }

    emit('report', errorInfo)
}
</script>

<style scoped lang="scss">
.error-message {
    border-radius: 8px;
    border: 1px solid;
    background: white;
    overflow: hidden;
    transition: all 0.3s ease;

    &.type-error {
        border-color: var(--el-color-danger-light-7);
        background: var(--el-color-danger-light-9);

        .error-icon {
            color: var(--el-color-danger);
        }

        .error-title {
            color: var(--el-color-danger);
        }
    }

    &.type-warning {
        border-color: var(--el-color-warning-light-7);
        background: var(--el-color-warning-light-9);

        .error-icon {
            color: var(--el-color-warning);
        }

        .error-title {
            color: var(--el-color-warning-dark-2);
        }
    }

    &.type-info {
        border-color: var(--el-color-info-light-7);
        background: var(--el-color-info-light-9);

        .error-icon {
            color: var(--el-color-info);
        }

        .error-title {
            color: var(--el-color-info-dark-2);
        }
    }

    &.type-success {
        border-color: var(--el-color-success-light-7);
        background: var(--el-color-success-light-9);

        .error-icon {
            color: var(--el-color-success);
        }

        .error-title {
            color: var(--el-color-success-dark-2);
        }
    }

    .error-header {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        cursor: pointer;

        .error-icon {
            flex-shrink: 0;
            font-size: 20px;
            margin-top: 2px;
        }

        .error-content {
            flex: 1;
            min-width: 0;

            .error-title {
                font-weight: 600;
                font-size: 16px;
                margin-bottom: 4px;
                line-height: 1.4;
            }

            .error-description {
                color: var(--el-text-color-regular);
                font-size: 14px;
                line-height: 1.5;
                word-break: break-word;
            }
        }

        .error-actions {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
    }

    .error-details {
        border-top: 1px solid var(--el-border-color-lighter);
        padding: 16px;
        background: rgba(0, 0, 0, 0.02);

        .details-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin-bottom: 12px;
        }

        .details-content {
            pre {
                background: var(--el-bg-color-page);
                padding: 12px;
                border-radius: 4px;
                font-size: 12px;
                line-height: 1.4;
                overflow-x: auto;
                margin: 0;
                white-space: pre-wrap;
                word-break: break-word;
            }

            .detail-item {
                margin-bottom: 8px;
                font-size: 13px;
                line-height: 1.4;

                strong {
                    color: var(--el-text-color-primary);
                    margin-right: 8px;
                }
            }
        }
    }

    .error-suggestions {
        border-top: 1px solid var(--el-border-color-lighter);
        padding: 16px;

        .suggestions-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin-bottom: 12px;
        }

        .suggestions-list {
            margin: 0;
            padding-left: 20px;

            li {
                margin-bottom: 8px;
                color: var(--el-text-color-regular);
                line-height: 1.5;
            }
        }
    }

    .error-support {
        .support-content {
            padding: 0 16px 16px;

            p {
                margin: 0 0 12px 0;
                color: var(--el-text-color-secondary);
                font-size: 13px;
            }

            .support-actions {
                display: flex;
                gap: 12px;
            }
        }
    }

    // 尺寸变体
    &.size-small {
        .error-header {
            padding: 12px;
            gap: 8px;

            .error-icon {
                font-size: 16px;
            }

            .error-content {
                .error-title {
                    font-size: 14px;
                }

                .error-description {
                    font-size: 13px;
                }
            }
        }

        .error-details,
        .error-suggestions {
            padding: 12px;
        }
    }

    &.size-large {
        .error-header {
            padding: 20px;
            gap: 16px;

            .error-icon {
                font-size: 24px;
            }

            .error-content {
                .error-title {
                    font-size: 18px;
                }

                .error-description {
                    font-size: 15px;
                }
            }
        }

        .error-details,
        .error-suggestions {
            padding: 20px;
        }
    }
}

// 响应式设计
@media (max-width: 768px) {
    .error-message {
        .error-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;

            .error-actions {
                justify-content: flex-end;
            }
        }

        .error-details .details-content pre {
            font-size: 11px;
        }

        .error-support .support-content .support-actions {
            flex-direction: column;
            align-items: stretch;
        }
    }
}
</style>
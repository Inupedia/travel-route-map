<template>
    <el-dialog v-model="visible" :title="title" :width="width" :close-on-click-modal="closeOnClickModal"
        :close-on-press-escape="closeOnPressEscape" :show-close="showClose" :center="center"
        :destroy-on-close="destroyOnClose" @close="handleClose">
        <div class="confirm-dialog-content">
            <div v-if="icon || type" class="dialog-icon">
                <el-icon :class="`icon-${type}`">
                    <component :is="iconComponent" />
                </el-icon>
            </div>

            <div class="dialog-message">
                <div v-if="message" class="message-text">{{ message }}</div>
                <div v-if="description" class="message-description">{{ description }}</div>

                <!-- 自定义内容插槽 -->
                <div v-if="$slots.default" class="message-content">
                    <slot />
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button v-if="showCancelButton" @click="handleCancel" :disabled="loading">
                    {{ cancelButtonText }}
                </el-button>
                <el-button :type="confirmButtonType" @click="handleConfirm" :loading="loading" :disabled="disabled">
                    {{ confirmButtonText }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
    Warning,
    CircleClose,
    InfoFilled,
    SuccessFilled,
    QuestionFilled
} from '@element-plus/icons-vue'

interface Props {
    /** 是否显示对话框 */
    modelValue: boolean
    /** 对话框标题 */
    title?: string
    /** 主要消息 */
    message?: string
    /** 描述信息 */
    description?: string
    /** 对话框类型 */
    type?: 'warning' | 'error' | 'info' | 'success' | 'question'
    /** 自定义图标 */
    icon?: any
    /** 对话框宽度 */
    width?: string | number
    /** 确认按钮文本 */
    confirmButtonText?: string
    /** 取消按钮文本 */
    cancelButtonText?: string
    /** 确认按钮类型 */
    confirmButtonType?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
    /** 是否显示取消按钮 */
    showCancelButton?: boolean
    /** 是否显示关闭按钮 */
    showClose?: boolean
    /** 点击遮罩是否关闭 */
    closeOnClickModal?: boolean
    /** 按ESC是否关闭 */
    closeOnPressEscape?: boolean
    /** 是否居中 */
    center?: boolean
    /** 关闭时销毁 */
    destroyOnClose?: boolean
    /** 是否加载中 */
    loading?: boolean
    /** 是否禁用确认按钮 */
    disabled?: boolean
    /** 自动关闭延迟（毫秒） */
    autoCloseDelay?: number
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm'): void
    (e: 'cancel'): void
    (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
    title: '确认操作',
    type: 'question',
    width: '420px',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    confirmButtonType: 'primary',
    showCancelButton: true,
    showClose: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    center: false,
    destroyOnClose: false,
    loading: false,
    disabled: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const visible = ref(props.modelValue)
const autoCloseTimer = ref<NodeJS.Timeout>()

// 计算属性
const iconComponent = computed(() => {
    if (props.icon) return props.icon

    switch (props.type) {
        case 'warning': return Warning
        case 'error': return CircleClose
        case 'info': return InfoFilled
        case 'success': return SuccessFilled
        case 'question': return QuestionFilled
        default: return QuestionFilled
    }
})

// 监听器
watch(() => props.modelValue, (newValue) => {
    visible.value = newValue

    if (newValue && props.autoCloseDelay) {
        startAutoCloseTimer()
    } else {
        clearAutoCloseTimer()
    }
})

watch(visible, (newValue) => {
    emit('update:modelValue', newValue)
})

// 方法
const handleConfirm = () => {
    emit('confirm')
}

const handleCancel = () => {
    visible.value = false
    emit('cancel')
}

const handleClose = () => {
    clearAutoCloseTimer()
    emit('close')
}

const startAutoCloseTimer = () => {
    clearAutoCloseTimer()
    if (props.autoCloseDelay && props.autoCloseDelay > 0) {
        autoCloseTimer.value = setTimeout(() => {
            visible.value = false
        }, props.autoCloseDelay)
    }
}

const clearAutoCloseTimer = () => {
    if (autoCloseTimer.value) {
        clearTimeout(autoCloseTimer.value)
        autoCloseTimer.value = undefined
    }
}

// 暴露方法
defineExpose({
    close: () => {
        visible.value = false
    },
    confirm: handleConfirm,
    cancel: handleCancel
})
</script>

<style scoped lang="scss">
.confirm-dialog-content {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 10px 0;

    .dialog-icon {
        flex-shrink: 0;
        font-size: 24px;
        margin-top: 2px;

        .icon-warning {
            color: var(--el-color-warning);
        }

        .icon-error {
            color: var(--el-color-danger);
        }

        .icon-info {
            color: var(--el-color-info);
        }

        .icon-success {
            color: var(--el-color-success);
        }

        .icon-question {
            color: var(--el-color-primary);
        }
    }

    .dialog-message {
        flex: 1;
        min-width: 0;

        .message-text {
            font-size: 16px;
            font-weight: 500;
            color: var(--el-text-color-primary);
            line-height: 1.5;
            margin-bottom: 8px;
        }

        .message-description {
            font-size: 14px;
            color: var(--el-text-color-regular);
            line-height: 1.6;
            margin-bottom: 12px;
        }

        .message-content {
            margin-top: 12px;
        }
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

// 响应式设计
@media (max-width: 768px) {
    .confirm-dialog-content {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 12px;

        .dialog-icon {
            margin-top: 0;
        }
    }

    .dialog-footer {
        flex-direction: column-reverse;
        gap: 8px;

        .el-button {
            width: 100%;
        }
    }
}

// 深色主题适配
:deep(.el-dialog) {
    @media (prefers-color-scheme: dark) {
        background-color: var(--el-bg-color);
        border: 1px solid var(--el-border-color);
    }
}
</style>
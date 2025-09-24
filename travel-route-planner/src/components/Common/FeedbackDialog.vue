<template>
    <el-dialog v-model="visible" title="意见反馈" width="500px" :close-on-click-modal="false" @close="handleClose">
        <el-form ref="formRef" :model="feedbackForm" :rules="formRules" label-width="80px"
            @submit.prevent="submitFeedback">
            <el-form-item label="反馈类型" prop="type">
                <el-select v-model="feedbackForm.type" placeholder="请选择反馈类型" style="width: 100%">
                    <el-option v-for="option in feedbackTypes" :key="option.value" :label="option.label"
                        :value="option.value">
                        <div class="feedback-option">
                            <el-icon>
                                <component :is="option.icon" />
                            </el-icon>
                            <span>{{ option.label }}</span>
                        </div>
                    </el-option>
                </el-select>
            </el-form-item>

            <el-form-item label="问题描述" prop="description">
                <el-input v-model="feedbackForm.description" type="textarea" :rows="4" placeholder="请详细描述您遇到的问题或建议..."
                    maxlength="500" show-word-limit />
            </el-form-item>

            <el-form-item label="重现步骤" v-if="feedbackForm.type === 'bug'">
                <el-input v-model="feedbackForm.steps" type="textarea" :rows="3" placeholder="请描述问题的重现步骤..."
                    maxlength="300" show-word-limit />
            </el-form-item>

            <el-form-item label="期望结果" v-if="feedbackForm.type === 'feature'">
                <el-input v-model="feedbackForm.expected" type="textarea" :rows="3" placeholder="请描述您期望的功能或改进..."
                    maxlength="300" show-word-limit />
            </el-form-item>

            <el-form-item label="联系方式">
                <el-input v-model="feedbackForm.contact" placeholder="邮箱或其他联系方式（可选）" maxlength="100" />
                <div class="form-tip">
                    <el-icon>
                        <InfoFilled />
                    </el-icon>
                    <span>提供联系方式有助于我们更好地跟进您的反馈</span>
                </div>
            </el-form-item>

            <el-form-item label="截图上传">
                <el-upload v-model:file-list="fileList" :auto-upload="false" :limit="3" accept="image/*"
                    list-type="picture-card" @exceed="handleExceed">
                    <el-icon>
                        <Plus />
                    </el-icon>
                    <template #tip>
                        <div class="upload-tip">
                            最多上传3张截图，支持 jpg/png 格式
                        </div>
                    </template>
                </el-upload>
            </el-form-item>

            <el-form-item label="优先级" v-if="feedbackForm.type === 'bug'">
                <el-radio-group v-model="feedbackForm.priority">
                    <el-radio value="low">
                        <el-icon>
                            <InfoFilled />
                        </el-icon>
                        低 - 不影响使用
                    </el-radio>
                    <el-radio value="medium">
                        <el-icon>
                            <Warning />
                        </el-icon>
                        中 - 影响部分功能
                    </el-radio>
                    <el-radio value="high">
                        <el-icon>
                            <CircleClose />
                        </el-icon>
                        高 - 严重影响使用
                    </el-radio>
                </el-radio-group>
            </el-form-item>

            <el-form-item>
                <div class="system-info">
                    <el-collapse>
                        <el-collapse-item title="系统信息" name="system">
                            <div class="info-grid">
                                <div class="info-item">
                                    <strong>浏览器：</strong>
                                    <span>{{ systemInfo.browser }}</span>
                                </div>
                                <div class="info-item">
                                    <strong>操作系统：</strong>
                                    <span>{{ systemInfo.os }}</span>
                                </div>
                                <div class="info-item">
                                    <strong>屏幕分辨率：</strong>
                                    <span>{{ systemInfo.screen }}</span>
                                </div>
                                <div class="info-item">
                                    <strong>时间戳：</strong>
                                    <span>{{ systemInfo.timestamp }}</span>
                                </div>
                            </div>
                        </el-collapse-item>
                    </el-collapse>
                </div>
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="handleClose">取消</el-button>
                <el-button type="primary" @click="submitFeedback" :loading="submitting">
                    提交反馈
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadUserFile } from 'element-plus'
import {
    Tools,
    Star,
    ChatDotRound,
    QuestionFilled,
    Plus,
    InfoFilled,
    Warning,
    CircleClose
} from '@element-plus/icons-vue'

interface Props {
    modelValue: boolean
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit', feedback: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const visible = ref(props.modelValue)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const fileList = ref<UploadUserFile[]>([])

// 反馈表单
const feedbackForm = ref({
    type: '',
    description: '',
    steps: '',
    expected: '',
    contact: '',
    priority: 'medium'
})

// 反馈类型配置
const feedbackTypes = [
    {
        value: 'bug',
        label: '问题报告',
        icon: Tools
    },
    {
        value: 'feature',
        label: '功能建议',
        icon: Star
    },
    {
        value: 'improvement',
        label: '体验改进',
        icon: ChatDotRound
    },
    {
        value: 'other',
        label: '其他反馈',
        icon: QuestionFilled
    }
]

// 表单验证规则
const formRules: FormRules = {
    type: [
        { required: true, message: '请选择反馈类型', trigger: 'change' }
    ],
    description: [
        { required: true, message: '请描述您的问题或建议', trigger: 'blur' },
        { min: 10, message: '描述至少需要10个字符', trigger: 'blur' }
    ]
}

// 系统信息
const systemInfo = computed(() => {
    const ua = navigator.userAgent
    let browser = 'Unknown'
    let os = 'Unknown'

    // 检测浏览器
    if (ua.includes('Chrome')) browser = 'Chrome'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Safari')) browser = 'Safari'
    else if (ua.includes('Edge')) browser = 'Edge'

    // 检测操作系统
    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iOS')) os = 'iOS'

    return {
        browser: `${browser} ${getBrowserVersion(ua)}`,
        os,
        screen: `${screen.width}x${screen.height}`,
        timestamp: new Date().toLocaleString()
    }
})

// 监听器
watch(() => props.modelValue, (newValue) => {
    visible.value = newValue
})

watch(visible, (newValue) => {
    emit('update:modelValue', newValue)
    if (!newValue) {
        resetForm()
    }
})

// 方法
const getBrowserVersion = (ua: string): string => {
    const match = ua.match(/(Chrome|Firefox|Safari|Edge)\/(\d+\.\d+)/)
    return match ? match[2] : ''
}

const handleClose = () => {
    if (hasFormData()) {
        ElMessageBox.confirm(
            '您有未保存的反馈内容，确定要关闭吗？',
            '确认关闭',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        ).then(() => {
            visible.value = false
        }).catch(() => {
            // 用户取消关闭
        })
    } else {
        visible.value = false
    }
}

const hasFormData = (): boolean => {
    return !!(
        feedbackForm.value.type ||
        feedbackForm.value.description ||
        feedbackForm.value.steps ||
        feedbackForm.value.expected ||
        feedbackForm.value.contact ||
        fileList.value.length > 0
    )
}

const resetForm = () => {
    feedbackForm.value = {
        type: '',
        description: '',
        steps: '',
        expected: '',
        contact: '',
        priority: 'medium'
    }
    fileList.value = []
    formRef.value?.resetFields()
}

const handleExceed = () => {
    ElMessage.warning('最多只能上传3张图片')
}

const submitFeedback = async () => {
    if (!formRef.value) return

    try {
        await formRef.value.validate()
        submitting.value = true

        // 准备提交数据
        const feedbackData = {
            ...feedbackForm.value,
            images: fileList.value.map(file => file.raw),
            systemInfo: systemInfo.value,
            timestamp: new Date().toISOString(),
            url: window.location.href
        }

        // 模拟提交延迟
        await new Promise(resolve => setTimeout(resolve, 1000))

        emit('submit', feedbackData)
        visible.value = false
        ElMessage.success('反馈提交成功，感谢您的建议！')

    } catch (error) {
        console.error('Feedback submission failed:', error)
        ElMessage.error('提交失败，请稍后重试')
    } finally {
        submitting.value = false
    }
}
</script>

<style scoped lang="scss">
.feedback-option {
    display: flex;
    align-items: center;
    gap: 8px;

    .el-icon {
        color: var(--el-color-primary);
    }
}

.form-tip {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    .el-icon {
        font-size: 14px;
    }
}

.upload-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: center;
    margin-top: 8px;
}

.system-info {
    width: 100%;

    .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;

        .info-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;

            strong {
                color: var(--el-text-color-primary);
                min-width: 80px;
            }

            span {
                color: var(--el-text-color-regular);
                word-break: break-all;
            }
        }
    }
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

// 表单项样式调整
:deep(.el-form-item) {
    margin-bottom: 20px;

    .el-radio {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        margin-right: 0;

        .el-radio__label {
            display: flex;
            align-items: center;
            gap: 4px;
        }
    }
}

:deep(.el-upload--picture-card) {
    width: 80px;
    height: 80px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
    width: 80px;
    height: 80px;
}

// 响应式设计
@media (max-width: 768px) {
    .system-info {
        .info-grid {
            grid-template-columns: 1fr;
            gap: 8px;

            .info-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 4px;

                strong {
                    min-width: auto;
                }
            }
        }
    }

    .dialog-footer {
        flex-direction: column-reverse;

        .el-button {
            width: 100%;
        }
    }
}
</style>
<template>
    <div class="export-panel">
        <div class="export-header">
            <h3 class="export-title">
                <el-icon>
                    <Download />
                </el-icon>
                导出规划图
            </h3>
            <p class="export-description">
                将您的旅游路线规划导出为图片，方便分享和保存
            </p>
        </div>

        <div class="export-content">
            <!-- 导出格式选择 -->
            <div class="export-section">
                <label class="section-label">导出格式</label>
                <el-radio-group v-model="exportFormat" class="format-group">
                    <el-radio-button label="png">PNG (高质量)</el-radio-button>
                    <el-radio-button label="jpg">JPG (小文件)</el-radio-button>
                </el-radio-group>
            </div>

            <!-- 图片尺寸设置 -->
            <div class="export-section">
                <label class="section-label">图片尺寸</label>
                <el-select v-model="selectedSize" placeholder="选择尺寸" class="size-select">
                    <el-option v-for="size in imageSizes" :key="size.value" :label="size.label" :value="size.value" />
                </el-select>

                <!-- 自定义尺寸 -->
                <div v-if="selectedSize === 'custom'" class="custom-size">
                    <div class="size-inputs">
                        <el-input-number v-model="customWidth" :min="800" :max="4000" :step="100" placeholder="宽度"
                            class="size-input" />
                        <span class="size-separator">×</span>
                        <el-input-number v-model="customHeight" :min="600" :max="3000" :step="100" placeholder="高度"
                            class="size-input" />
                    </div>
                    <p class="size-hint">像素 (px)</p>
                </div>
            </div>

            <!-- 导出选项 -->
            <div class="export-section">
                <label class="section-label">导出选项</label>
                <div class="export-options">
                    <el-checkbox v-model="includeDetails">
                        包含地点详情信息
                    </el-checkbox>
                    <el-checkbox v-model="highQuality" :disabled="exportFormat === 'jpg'">
                        高质量模式 (仅PNG)
                    </el-checkbox>
                </div>
            </div>

            <!-- 质量设置 (JPG) -->
            <div v-if="exportFormat === 'jpg'" class="export-section">
                <label class="section-label">图片质量</label>
                <div class="quality-slider">
                    <el-slider v-model="jpgQuality" :min="0.1" :max="1.0" :step="0.1"
                        :format-tooltip="formatQualityTooltip" show-stops />
                    <div class="quality-labels">
                        <span>较小文件</span>
                        <span>较高质量</span>
                    </div>
                </div>
            </div>

            <!-- 预览信息 -->
            <div class="export-section">
                <div class="preview-info">
                    <div class="info-item">
                        <span class="info-label">预计尺寸:</span>
                        <span class="info-value">{{ currentWidth }} × {{ currentHeight }} px</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">文件格式:</span>
                        <span class="info-value">{{ exportFormat.toUpperCase() }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">预计大小:</span>
                        <span class="info-value">{{ estimatedSize }}</span>
                    </div>
                </div>
            </div>

            <!-- 导出按钮 -->
            <div class="export-actions">
                <el-button type="primary" size="large" :loading="isExporting" :disabled="!canExport"
                    @click="handleExport" class="export-button">
                    <el-icon v-if="!isExporting">
                        <Download />
                    </el-icon>
                    {{ isExporting ? '导出中...' : '开始导出' }}
                </el-button>
            </div>

            <!-- 导出进度 -->
            <div v-if="isExporting" class="export-progress">
                <div class="progress-info">
                    <span class="progress-text">{{ progressText }}</span>
                    <span class="progress-percent">{{ Math.round(exportProgress) }}%</span>
                </div>
                <el-progress :percentage="exportProgress" :stroke-width="8" :show-text="false" status="success" />
            </div>

            <!-- 错误提示 -->
            <el-alert v-if="exportError" :title="exportError" type="error" :closable="true" @close="exportError = ''"
                class="export-error" />

            <!-- 成功提示 -->
            <el-alert v-if="exportSuccess" title="导出成功！" description="图片已保存到您的下载文件夹" type="success" :closable="true"
                @close="exportSuccess = false" class="export-success" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { usePlanStore } from '@/stores/planStore'
import { exportService } from '@/services/exportService'

// Props
interface Props {
    mapElement?: HTMLElement
}

const props = withDefaults(defineProps<Props>(), {
    mapElement: undefined
})

// Store
const planStore = usePlanStore()

// 响应式数据
const exportFormat = ref<'png' | 'jpg'>('png')
const selectedSize = ref('1920x1080')
const customWidth = ref(1920)
const customHeight = ref(1080)
const includeDetails = ref(true)
const highQuality = ref(true)
const jpgQuality = ref(0.9)

const isExporting = ref(false)
const exportProgress = ref(0)
const exportError = ref('')
const exportSuccess = ref(false)

// 图片尺寸选项
const imageSizes = [
    { label: 'Full HD (1920×1080)', value: '1920x1080' },
    { label: '4K (3840×2160)', value: '3840x2160' },
    { label: 'A4 横向 (2480×1754)', value: '2480x1754' },
    { label: 'A4 纵向 (1754×2480)', value: '1754x2480' },
    { label: '正方形 (1080×1080)', value: '1080x1080' },
    { label: '宽屏 (2560×1440)', value: '2560x1440' },
    { label: '自定义', value: 'custom' }
]

// 计算属性
const currentWidth = computed(() => {
    if (selectedSize.value === 'custom') {
        return customWidth.value
    }
    const [width] = selectedSize.value.split('x').map(Number)
    return width
})

const currentHeight = computed(() => {
    if (selectedSize.value === 'custom') {
        return customHeight.value
    }
    const [, height] = selectedSize.value.split('x').map(Number)
    return height
})

const estimatedSize = computed(() => {
    const pixels = currentWidth.value * currentHeight.value
    let sizeInBytes: number

    if (exportFormat.value === 'png') {
        // PNG 通常每像素 3-4 字节
        sizeInBytes = pixels * (highQuality.value ? 4 : 3)
    } else {
        // JPG 根据质量估算
        const baseSize = pixels * 0.5
        sizeInBytes = baseSize * jpgQuality.value
    }

    // 转换为合适的单位
    if (sizeInBytes < 1024 * 1024) {
        return `${Math.round(sizeInBytes / 1024)} KB`
    } else {
        return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
    }
})

const canExport = computed(() => {
    return planStore.hasCurrentPlan && props.mapElement && !isExporting.value
})

const progressText = computed(() => {
    if (exportProgress.value < 30) {
        return '准备导出...'
    } else if (exportProgress.value < 70) {
        return '生成图片...'
    } else if (exportProgress.value < 90) {
        return '处理中...'
    } else {
        return '即将完成...'
    }
})

// 方法
const formatQualityTooltip = (value: number) => {
    return `${Math.round(value * 100)}%`
}

const handleExport = async () => {
    if (!planStore.currentPlan || !props.mapElement) {
        ElMessage.error('无法导出：缺少规划数据或地图元素')
        return
    }

    isExporting.value = true
    exportProgress.value = 0
    exportError.value = ''
    exportSuccess.value = false

    try {
        const options = {
            width: currentWidth.value,
            height: currentHeight.value,
            quality: exportFormat.value === 'png' ? (highQuality.value ? 1.0 : 0.8) : jpgQuality.value,
            includeDetails: includeDetails.value
        }

        // 使用带进度的导出方法
        const blob = await exportService.exportWithProgress(
            planStore.currentPlan,
            props.mapElement,
            exportFormat.value,
            options,
            (progress) => {
                exportProgress.value = progress
            }
        )

        // 生成文件名并下载
        const filename = exportService.generateFilename(
            planStore.currentPlan.name,
            exportFormat.value
        )

        await exportService.downloadFile(blob, filename)

        exportSuccess.value = true
        ElMessage.success('导出成功！')

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '导出失败'
        exportError.value = errorMessage
        ElMessage.error(errorMessage)
    } finally {
        isExporting.value = false
        exportProgress.value = 0
    }
}

// 监听格式变化，重置相关选项
watch(exportFormat, (newFormat) => {
    if (newFormat === 'jpg') {
        highQuality.value = false
    }
})
</script>

<style scoped lang="scss">
.export-panel {
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.export-header {
    margin-bottom: 24px;
    text-align: center;

    .export-title {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
    }

    .export-description {
        margin: 0;
        font-size: 14px;
        color: #6b7280;
        line-height: 1.5;
    }
}

.export-content {
    .export-section {
        margin-bottom: 20px;

        .section-label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
        }

        .format-group {
            width: 100%;
        }

        .size-select {
            width: 100%;
        }

        .custom-size {
            margin-top: 12px;

            .size-inputs {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;

                .size-input {
                    flex: 1;
                }

                .size-separator {
                    font-size: 16px;
                    color: #6b7280;
                }
            }

            .size-hint {
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
            }
        }

        .export-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .quality-slider {
            .quality-labels {
                display: flex;
                justify-content: space-between;
                margin-top: 4px;
                font-size: 12px;
                color: #6b7280;
            }
        }

        .preview-info {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;

            .info-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;

                &:last-child {
                    margin-bottom: 0;
                }

                .info-label {
                    font-size: 13px;
                    color: #6b7280;
                }

                .info-value {
                    font-size: 13px;
                    font-weight: 500;
                    color: #1f2937;
                }
            }
        }
    }

    .export-actions {
        margin-bottom: 16px;

        .export-button {
            width: 100%;
            height: 44px;
            font-size: 16px;
        }
    }

    .export-progress {
        margin-bottom: 16px;

        .progress-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .progress-text {
                font-size: 14px;
                color: #374151;
            }

            .progress-percent {
                font-size: 14px;
                font-weight: 500;
                color: #059669;
            }
        }
    }

    .export-error,
    .export-success {
        margin-bottom: 16px;
    }
}

// 响应式设计
@media (max-width: 768px) {
    .export-panel {
        padding: 16px;
    }

    .export-header {
        .export-title {
            font-size: 16px;
        }
    }

    .export-content {
        .export-section {
            .custom-size {
                .size-inputs {
                    flex-direction: column;
                    align-items: stretch;

                    .size-separator {
                        text-align: center;
                        margin: 4px 0;
                    }
                }
            }
        }
    }
}
</style>
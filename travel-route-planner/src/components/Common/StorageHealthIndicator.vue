<template>
    <div class="storage-health-indicator">
        <el-tooltip :content="tooltipContent" placement="top">
            <div class="indicator" :class="healthStatus.status" @click="showDetails = true">
                <el-icon>
                    <component :is="statusIcon" />
                </el-icon>
                <span class="percentage">{{ storageInfo.percentage.toFixed(0) }}%</span>
            </div>
        </el-tooltip>

        <!-- 详情对话框 -->
        <el-dialog v-model="showDetails" title="存储健康状态" width="500px">
            <div class="storage-details">
                <div class="status-section">
                    <div class="status-header" :class="healthStatus.status">
                        <el-icon>
                            <component :is="statusIcon" />
                        </el-icon>
                        <span>{{ healthStatus.message }}</span>
                    </div>

                    <el-progress :percentage="storageInfo.percentage" :color="progressColor" :stroke-width="20" />

                    <div class="storage-stats">
                        <p>已使用: {{ formatBytes(storageInfo.used) }}</p>
                        <p>可用: {{ formatBytes(storageInfo.available) }}</p>
                        <p v-if="storageInfo.quota">总容量: {{ formatBytes(storageInfo.quota) }}</p>
                    </div>
                </div>

                <div v-if="healthStatus.suggestions.length > 0" class="suggestions-section">
                    <h4>优化建议</h4>
                    <ul>
                        <li v-for="suggestion in healthStatus.suggestions" :key="suggestion">
                            {{ suggestion }}
                        </li>
                    </ul>
                </div>

                <div class="actions-section">
                    <el-button @click="$emit('openDataManagement')">
                        <el-icon>
                            <Setting />
                        </el-icon>
                        数据管理
                    </el-button>
                    <el-button v-if="healthStatus.status !== 'healthy'" type="primary" @click="handleOptimize">
                        <el-icon>
                            <Tools />
                        </el-icon>
                        优化存储
                    </el-button>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
    CircleCheck,
    Warning,
    CircleClose,
    Setting,
    Tools
} from '@element-plus/icons-vue'
import { useDataManagement } from '@/composables/useDataManagement'

// 事件定义
defineEmits<{
    openDataManagement: []
}>()

const {
    storageInfo,
    checkStorageHealth,
    cleanupOldData,
    compressData,
    formatBytes
} = useDataManagement()

// 响应式数据
const showDetails = ref(false)
const healthStatus = ref({
    status: 'healthy' as 'healthy' | 'warning' | 'critical',
    message: '检查中...',
    suggestions: [] as string[]
})

// 计算属性
const statusIcon = computed(() => {
    switch (healthStatus.value.status) {
        case 'healthy': return CircleCheck
        case 'warning': return Warning
        case 'critical': return CircleClose
        default: return CircleCheck
    }
})

const progressColor = computed(() => {
    const percentage = storageInfo.value.percentage
    if (percentage < 50) return '#67c23a'
    if (percentage < 80) return '#e6a23c'
    return '#f56c6c'
})

const tooltipContent = computed(() => {
    return `存储使用率: ${storageInfo.value.percentage.toFixed(1)}% - ${healthStatus.value.message}`
})

// 方法
const updateHealthStatus = async () => {
    try {
        healthStatus.value = await checkStorageHealth()
    } catch (error) {
        console.error('检查存储健康状态失败:', error)
    }
}

const handleOptimize = async () => {
    try {
        // 先尝试压缩数据
        await compressData()

        // 如果仍然空间不足，清理旧数据
        if (storageInfo.value.percentage > 80) {
            await cleanupOldData(20) // 保留最近20个规划
        }

        // 重新检查状态
        await updateHealthStatus()

        ElMessage.success('存储优化完成')
    } catch (error) {
        ElMessage.error('存储优化失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
}

// 生命周期
onMounted(() => {
    updateHealthStatus()

    // 定期更新状态
    setInterval(updateHealthStatus, 30000) // 每30秒更新一次
})
</script>

<style scoped lang="scss">
.storage-health-indicator {
    .indicator {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 5px 10px;
        border-radius: 15px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 12px;
        font-weight: 500;

        &.healthy {
            background-color: #f0f9ff;
            color: #67c23a;
            border: 1px solid #b3e19d;

            &:hover {
                background-color: #e8f5e8;
            }
        }

        &.warning {
            background-color: #fdf6ec;
            color: #e6a23c;
            border: 1px solid #f5dab1;

            &:hover {
                background-color: #faecd8;
            }
        }

        &.critical {
            background-color: #fef0f0;
            color: #f56c6c;
            border: 1px solid #fbc4c4;

            &:hover {
                background-color: #fde2e2;
            }
        }

        .el-icon {
            font-size: 14px;
        }

        .percentage {
            font-weight: 600;
        }
    }
}

.storage-details {
    .status-section {
        margin-bottom: 20px;

        .status-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 15px;
            font-weight: 600;
            font-size: 16px;

            &.healthy {
                color: #67c23a;
            }

            &.warning {
                color: #e6a23c;
            }

            &.critical {
                color: #f56c6c;
            }
        }

        .storage-stats {
            margin-top: 15px;

            p {
                margin: 5px 0;
                color: #606266;
            }
        }
    }

    .suggestions-section {
        margin-bottom: 20px;

        h4 {
            margin-bottom: 10px;
            color: #303133;
        }

        ul {
            margin: 0;
            padding-left: 20px;

            li {
                margin-bottom: 5px;
                color: #606266;
                line-height: 1.5;
            }
        }
    }

    .actions-section {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }
}
</style>
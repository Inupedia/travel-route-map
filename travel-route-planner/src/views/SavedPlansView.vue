<template>
    <div class="saved-plans-view">
        <div class="header">
            <h1>已保存的旅游规划</h1>
            <div class="header-actions">
                <el-button type="primary" @click="refreshPlans" :loading="isLoading">
                    <el-icon>
                        <Refresh />
                    </el-icon>
                    刷新
                </el-button>
                <el-button @click="showStorageInfo = true">
                    <el-icon>
                        <DataAnalysis />
                    </el-icon>
                    存储信息
                </el-button>
                <el-button @click="showDataManagement = true">
                    <el-icon>
                        <Setting />
                    </el-icon>
                    数据管理
                </el-button>
            </div>
        </div>

        <!-- 存储空间警告 -->
        <el-alert v-if="storageInfo.percentage > 80" :title="`存储空间使用率已达 ${storageInfo.percentage.toFixed(1)}%`"
            type="warning"
            :description="`已使用 ${formatBytes(storageInfo.used)}，剩余 ${formatBytes(storageInfo.available)}`" show-icon
            :closable="false" class="storage-warning" />

        <!-- 规划列表 -->
        <div class="plans-container">
            <el-empty v-if="!isLoading && savedPlans.length === 0" description="暂无保存的规划">
                <el-button type="primary" @click="$router.push('/')">创建新规划</el-button>
            </el-empty>

            <div v-else class="plans-grid">
                <div v-for="plan in savedPlans" :key="plan.id" class="plan-card" @click="loadPlan(plan.id)">
                    <div class="plan-header">
                        <h3>{{ plan.name }}</h3>
                        <el-dropdown @command="handlePlanAction" trigger="click" @click.stop>
                            <el-button type="text" size="small">
                                <el-icon>
                                    <MoreFilled />
                                </el-icon>
                            </el-button>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item :command="{ action: 'load', planId: plan.id }">
                                        <el-icon>
                                            <View />
                                        </el-icon>
                                        打开规划
                                    </el-dropdown-item>
                                    <el-dropdown-item :command="{ action: 'duplicate', planId: plan.id }">
                                        <el-icon>
                                            <CopyDocument />
                                        </el-icon>
                                        复制规划
                                    </el-dropdown-item>
                                    <el-dropdown-item :command="{ action: 'export', planId: plan.id }">
                                        <el-icon>
                                            <Download />
                                        </el-icon>
                                        导出规划
                                    </el-dropdown-item>
                                    <el-dropdown-item :command="{ action: 'delete', planId: plan.id }" divided>
                                        <el-icon>
                                            <Delete />
                                        </el-icon>
                                        删除规划
                                    </el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </div>

                    <div class="plan-info">
                        <p v-if="plan.description" class="description">{{ plan.description }}</p>
                        <div class="stats">
                            <span><el-icon>
                                    <Calendar />
                                </el-icon> {{ plan.totalDays }} 天</span>
                            <span><el-icon>
                                    <Location />
                                </el-icon> {{ plan.locations.length }} 个地点</span>
                            <span><el-icon>
                                    <Connection />
                                </el-icon> {{ plan.routes.length }} 条路线</span>
                        </div>
                        <div class="dates">
                            <span class="created">创建: {{ formatDate(plan.createdAt) }}</span>
                            <span class="updated">更新: {{ formatDate(plan.updatedAt) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 存储信息对话框 -->
        <el-dialog v-model="showStorageInfo" title="存储信息" width="500px">
            <div class="storage-info">
                <div class="storage-usage">
                    <h4>存储使用情况</h4>
                    <el-progress :percentage="storageInfo.percentage" :color="getStorageColor(storageInfo.percentage)"
                        :stroke-width="20" />
                    <div class="storage-details">
                        <p>已使用: {{ formatBytes(storageInfo.used) }}</p>
                        <p>可用: {{ formatBytes(storageInfo.available) }}</p>
                        <p>使用率: {{ storageInfo.percentage.toFixed(1) }}%</p>
                    </div>
                </div>

                <div class="storage-tips">
                    <h4>存储优化建议</h4>
                    <ul>
                        <li v-if="storageInfo.percentage > 80">存储空间不足，建议删除不需要的规划</li>
                        <li v-if="storageInfo.percentage > 60">定期导出重要规划进行备份</li>
                        <li>清理浏览器缓存可以释放更多空间</li>
                        <li>考虑使用导出功能备份数据到本地文件</li>
                    </ul>
                </div>
            </div>
        </el-dialog>

        <!-- 数据管理对话框 -->
        <el-dialog v-model="showDataManagement" title="数据管理" width="600px">
            <div class="data-management">
                <el-tabs v-model="activeTab">
                    <el-tab-pane label="导出数据" name="export">
                        <div class="export-section">
                            <p>导出所有旅游规划数据为JSON文件，可用于备份或迁移。</p>
                            <el-button type="primary" @click="exportAllData" :loading="isExporting">
                                <el-icon>
                                    <Download />
                                </el-icon>
                                导出所有数据
                            </el-button>
                        </div>
                    </el-tab-pane>

                    <el-tab-pane label="导入数据" name="import">
                        <div class="import-section">
                            <p>从JSON文件导入旅游规划数据。注意：这将覆盖现有数据。</p>
                            <el-upload ref="uploadRef" :auto-upload="false" :show-file-list="false" accept=".json"
                                :on-change="handleFileChange">
                                <el-button>
                                    <el-icon>
                                        <Upload />
                                    </el-icon>
                                    选择文件
                                </el-button>
                            </el-upload>
                            <el-button v-if="importFile" type="primary" @click="importData" :loading="isImporting"
                                style="margin-left: 10px">
                                导入数据
                            </el-button>
                            <p v-if="importFile" class="file-info">
                                已选择文件: {{ importFile.name }}
                            </p>
                        </div>
                    </el-tab-pane>

                    <el-tab-pane label="清理数据" name="cleanup">
                        <div class="cleanup-section">
                            <el-alert title="危险操作" type="error" description="以下操作将永久删除数据，请谨慎操作！" show-icon
                                :closable="false" />

                            <div class="cleanup-actions">
                                <el-button type="danger" @click="confirmClearAll" :loading="isClearing">
                                    <el-icon>
                                        <Delete />
                                    </el-icon>
                                    清空所有数据
                                </el-button>

                                <el-button @click="clearCurrentPlan">
                                    <el-icon>
                                        <Close />
                                    </el-icon>
                                    清空当前规划
                                </el-button>
                            </div>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus'
import {
    Refresh,
    DataAnalysis,
    Setting,
    MoreFilled,
    View,
    CopyDocument,
    Download,
    Delete,
    Calendar,
    Location,
    Connection,
    Upload,
    Close
} from '@element-plus/icons-vue'
import { usePlanStore } from '@/stores/planStore'
import { storageService } from '@/services/storageService'
import type { TravelPlan } from '@/types'
import { nanoid } from 'nanoid'

const router = useRouter()
const planStore = usePlanStore()

// 响应式数据
const isLoading = ref(false)
const showStorageInfo = ref(false)
const showDataManagement = ref(false)
const activeTab = ref('export')
const isExporting = ref(false)
const isImporting = ref(false)
const isClearing = ref(false)
const importFile = ref<UploadFile | null>(null)
const uploadRef = ref()

// 计算属性
const savedPlans = computed(() => planStore.savedPlans)
const storageInfo = computed(() => storageService.getStorageInfo())

// 方法
const refreshPlans = async () => {
    isLoading.value = true
    try {
        planStore.loadSavedPlans()
        ElMessage.success('刷新成功')
    } catch (error) {
        ElMessage.error('刷新失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
        isLoading.value = false
    }
}

const loadPlan = async (planId: string) => {
    try {
        planStore.loadPlan(planId)
        ElMessage.success('规划加载成功')
        router.push('/')
    } catch (error) {
        ElMessage.error('加载规划失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
}

const handlePlanAction = async (command: { action: string; planId: string }) => {
    const { action, planId } = command

    switch (action) {
        case 'load':
            await loadPlan(planId)
            break

        case 'duplicate':
            await duplicatePlan(planId)
            break

        case 'export':
            await exportPlan(planId)
            break

        case 'delete':
            await deletePlan(planId)
            break
    }
}

const duplicatePlan = async (planId: string) => {
    try {
        const originalPlan = savedPlans.value.find(p => p.id === planId)
        if (!originalPlan) {
            ElMessage.error('规划不存在')
            return
        }

        const duplicatedPlan: TravelPlan = {
            ...originalPlan,
            id: nanoid(),
            name: `${originalPlan.name} (副本)`,
            createdAt: new Date(),
            updatedAt: new Date(),
            locations: originalPlan.locations.map(loc => ({
                ...loc,
                id: nanoid(),
                createdAt: new Date(),
                updatedAt: new Date()
            })),
            routes: originalPlan.routes.map(route => ({
                ...route,
                id: nanoid()
            }))
        }

        await storageService.savePlan(duplicatedPlan)
        planStore.loadSavedPlans()
        ElMessage.success('规划复制成功')
    } catch (error) {
        ElMessage.error('复制规划失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
}

const exportPlan = async (planId: string) => {
    try {
        const plan = savedPlans.value.find(p => p.id === planId)
        if (!plan) {
            ElMessage.error('规划不存在')
            return
        }

        const dataStr = JSON.stringify(plan, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = `${plan.name}_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        ElMessage.success('规划导出成功')
    } catch (error) {
        ElMessage.error('导出规划失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
}

const deletePlan = async (planId: string) => {
    try {
        await ElMessageBox.confirm(
            '确定要删除这个规划吗？此操作不可恢复。',
            '确认删除',
            {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning',
                confirmButtonClass: 'el-button--danger'
            }
        )

        await storageService.deletePlan(planId)
        planStore.loadSavedPlans()
        ElMessage.success('规划删除成功')
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除规划失败: ' + (error instanceof Error ? error.message : '未知错误'))
        }
    }
}

const exportAllData = async () => {
    isExporting.value = true
    try {
        const dataStr = await storageService.exportData()
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = `travel_plans_backup_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        ElMessage.success('数据导出成功')
    } catch (error) {
        ElMessage.error('导出数据失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
        isExporting.value = false
    }
}

const handleFileChange = (file: UploadFile) => {
    importFile.value = file
}

const importData = async () => {
    if (!importFile.value) {
        ElMessage.error('请选择要导入的文件')
        return
    }

    try {
        await ElMessageBox.confirm(
            '导入数据将覆盖现有的所有规划，确定要继续吗？',
            '确认导入',
            {
                confirmButtonText: '导入',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        isImporting.value = true

        const fileContent = await readFileAsText(importFile.value.raw!)
        await storageService.importData(fileContent)
        planStore.loadSavedPlans()

        ElMessage.success('数据导入成功')
        showDataManagement.value = false
        importFile.value = null
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('导入数据失败: ' + (error instanceof Error ? error.message : '未知错误'))
        }
    } finally {
        isImporting.value = false
    }
}

const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = (e) => reject(e)
        reader.readAsText(file)
    })
}

const confirmClearAll = async () => {
    try {
        await ElMessageBox.confirm(
            '确定要清空所有数据吗？此操作不可恢复，建议先导出备份。',
            '确认清空',
            {
                confirmButtonText: '清空',
                cancelButtonText: '取消',
                type: 'error',
                confirmButtonClass: 'el-button--danger'
            }
        )

        isClearing.value = true
        await storageService.clearAllData()
        planStore.loadSavedPlans()
        planStore.clearCurrentPlan()

        ElMessage.success('所有数据已清空')
        showDataManagement.value = false
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('清空数据失败: ' + (error instanceof Error ? error.message : '未知错误'))
        }
    } finally {
        isClearing.value = false
    }
}

const clearCurrentPlan = () => {
    planStore.clearCurrentPlan()
    ElMessage.success('当前规划已清空')
}

// 工具函数
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date)
}

const getStorageColor = (percentage: number): string => {
    if (percentage < 50) return '#67c23a'
    if (percentage < 80) return '#e6a23c'
    return '#f56c6c'
}

// 生命周期
onMounted(() => {
    refreshPlans()
})
</script>

<style scoped lang="scss">
.saved-plans-view {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        h1 {
            margin: 0;
            color: #303133;
        }

        .header-actions {
            display: flex;
            gap: 10px;
        }
    }

    .storage-warning {
        margin-bottom: 20px;
    }

    .plans-container {
        .plans-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }

        .plan-card {
            border: 1px solid #dcdfe6;
            border-radius: 8px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: white;

            &:hover {
                border-color: #409eff;
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
            }

            .plan-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 15px;

                h3 {
                    margin: 0;
                    color: #303133;
                    font-size: 18px;
                    font-weight: 600;
                }
            }

            .plan-info {
                .description {
                    color: #606266;
                    margin-bottom: 15px;
                    line-height: 1.5;
                }

                .stats {
                    display: flex;
                    gap: 15px;
                    margin-bottom: 15px;
                    flex-wrap: wrap;

                    span {
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        color: #909399;
                        font-size: 14px;

                        .el-icon {
                            font-size: 16px;
                        }
                    }
                }

                .dates {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: #c0c4cc;

                    .created,
                    .updated {
                        display: block;
                    }
                }
            }
        }
    }
}

.storage-info {
    .storage-usage {
        margin-bottom: 20px;

        h4 {
            margin-bottom: 15px;
            color: #303133;
        }

        .storage-details {
            margin-top: 15px;

            p {
                margin: 5px 0;
                color: #606266;
            }
        }
    }

    .storage-tips {
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
}

.data-management {

    .export-section,
    .import-section,
    .cleanup-section {
        padding: 20px 0;

        p {
            margin-bottom: 15px;
            color: #606266;
            line-height: 1.5;
        }

        .file-info {
            margin-top: 10px;
            font-size: 14px;
            color: #909399;
        }
    }

    .cleanup-section {
        .cleanup-actions {
            margin-top: 20px;
            display: flex;
            gap: 10px;
        }
    }
}

@media (max-width: 768px) {
    .saved-plans-view {
        padding: 15px;

        .header {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;

            .header-actions {
                justify-content: center;
            }
        }

        .plans-container .plans-grid {
            grid-template-columns: 1fr;
        }

        .plan-card .plan-info .stats {
            flex-direction: column;
            gap: 8px;
        }
    }
}
</style>
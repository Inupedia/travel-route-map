<template>
    <div class="day-plan-panel">
        <div class="panel-header">
            <h3>多日行程规划</h3>
            <div class="header-actions">
                <el-button type="primary" size="small" @click="showDaySettingsDialog" :disabled="!hasCurrentPlan">
                    <el-icon>
                        <Setting />
                    </el-icon>
                    设置天数
                </el-button>
            </div>
        </div>

        <div v-if="!hasCurrentPlan" class="empty-state">
            <el-empty description="请先创建一个旅游规划" />
        </div>

        <div v-else class="panel-content">
            <!-- 天数概览 -->
            <div class="days-overview">
                <div class="overview-header">
                    <span class="overview-title">行程概览</span>
                    <span class="total-days">共 {{ currentPlan.totalDays }} 天</span>
                </div>

                <div class="days-grid">
                    <div v-for="day in currentPlan.totalDays" :key="day" class="day-card" :class="{
                        'active': selectedDay === day,
                        'has-locations': getDayLocations(day).length > 0
                    }" @click="selectDay(day)">
                        <div class="day-header">
                            <span class="day-number">第{{ day }}天</span>
                            <el-tag :color="getDayColor(day)" size="small" class="day-tag">
                                {{ getDayLocations(day).length }}个地点
                            </el-tag>
                        </div>

                        <div class="day-locations">
                            <div v-for="location in getDayLocations(day).slice(0, 3)" :key="location.id"
                                class="location-item">
                                <el-tag :type="getLocationTypeTagType(location.type)" size="small"
                                    class="location-type">
                                    {{ getLocationTypeLabel(location.type) }}
                                </el-tag>
                                <span class="location-name">{{ location.name }}</span>
                            </div>

                            <div v-if="getDayLocations(day).length > 3" class="more-locations">
                                +{{ getDayLocations(day).length - 3 }}个地点
                            </div>

                            <div v-if="getDayLocations(day).length === 0" class="no-locations">
                                暂无地点安排
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 当前天详情 -->
            <div class="current-day-details">
                <div class="details-header">
                    <div class="day-info">
                        <h4>第{{ selectedDay }}天安排</h4>
                        <el-tag :color="getDayColor(selectedDay)" size="small">
                            {{ getDayLocations(selectedDay).length }}个地点
                        </el-tag>
                    </div>

                    <div class="day-actions">
                        <el-button type="primary" size="small" @click="showAssignLocationDialog"
                            :disabled="unassignedLocations.length === 0">
                            <el-icon>
                                <Plus />
                            </el-icon>
                            分配地点
                        </el-button>
                    </div>
                </div>

                <!-- 当天地点列表 -->
                <div class="day-locations-list">
                    <div v-if="getDayLocations(selectedDay).length === 0" class="empty-day">
                        <el-empty description="该天暂无地点安排">
                            <el-button type="primary" @click="showAssignLocationDialog"
                                :disabled="unassignedLocations.length === 0">
                                分配地点
                            </el-button>
                        </el-empty>
                    </div>

                    <draggable v-else v-model="currentDayLocations" group="locations" item-key="id"
                        @change="handleLocationReorder" class="draggable-list">
                        <template #item="{ element: location, index }">
                            <div class="location-card" :style="{ borderLeftColor: getDayColor(selectedDay) }">
                                <div class="location-header">
                                    <div class="location-info">
                                        <el-tag :type="getLocationTypeTagType(location.type)" size="small"
                                            class="location-type">
                                            {{ getLocationTypeLabel(location.type) }}
                                        </el-tag>
                                        <span class="location-name">{{ location.name }}</span>
                                        <span class="location-order">{{ index + 1 }}</span>
                                    </div>

                                    <div class="location-actions">
                                        <el-button type="primary" size="small" text @click="editLocationDay(location)">
                                            <el-icon>
                                                <Edit />
                                            </el-icon>
                                        </el-button>
                                        <el-button type="danger" size="small" text
                                            @click="handleRemoveLocationFromDay(location)">
                                            <el-icon>
                                                <Close />
                                            </el-icon>
                                        </el-button>
                                    </div>
                                </div>

                                <div class="location-details">
                                    <div v-if="location.address" class="location-address">
                                        <el-icon>
                                            <MapLocation />
                                        </el-icon>
                                        {{ location.address }}
                                    </div>

                                    <div v-if="location.visitDuration" class="location-duration">
                                        <el-icon>
                                            <Clock />
                                        </el-icon>
                                        预计游览 {{ location.visitDuration }} 分钟
                                    </div>

                                    <div class="location-coordinates">
                                        <el-icon>
                                            <Location />
                                        </el-icon>
                                        {{ formatCoordinates(location.coordinates) }}
                                    </div>
                                </div>

                                <div v-if="location.description" class="location-description">
                                    {{ location.description }}
                                </div>
                            </div>
                        </template>
                    </draggable>
                </div>

                <!-- 当天统计信息 -->
                <div v-if="getDayLocations(selectedDay).length > 0" class="day-stats">
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-label">总地点</div>
                            <div class="stat-value">{{ getDayLocations(selectedDay).length }}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">预计游览时间</div>
                            <div class="stat-value">{{ getTotalVisitDuration(selectedDay) }}分钟</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">路线距离</div>
                            <div class="stat-value">{{ getDayRouteDistance(selectedDay) }}km</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 天数设置对话框 -->
        <el-dialog v-model="showDaySettings" title="设置旅游天数" width="400px" :close-on-click-modal="false">
            <el-form :model="daySettingsForm" label-width="80px">
                <el-form-item label="总天数">
                    <el-input-number v-model="daySettingsForm.totalDays" :min="1" :max="30" controls-position="right"
                        style="width: 100%" />
                </el-form-item>
                <el-form-item>
                    <el-alert v-if="daySettingsForm.totalDays < currentPlan?.totalDays" title="注意：减少天数可能会影响已分配的地点"
                        type="warning" :closable="false" show-icon />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="showDaySettings = false">取消</el-button>
                <el-button type="primary" @click="handleUpdateTotalDays">确定</el-button>
            </template>
        </el-dialog>

        <!-- 分配地点对话框 -->
        <el-dialog v-model="showAssignLocation" title="分配地点到天数" width="500px" :close-on-click-modal="false">
            <div class="assign-location-content">
                <div class="target-day">
                    <span>分配到：</span>
                    <el-select v-model="assignForm.targetDay" placeholder="选择天数" style="width: 120px">
                        <el-option v-for="day in currentPlan?.totalDays" :key="day" :label="`第${day}天`" :value="day" />
                    </el-select>
                </div>

                <div class="locations-to-assign">
                    <div class="section-title">选择要分配的地点：</div>
                    <el-checkbox-group v-model="assignForm.selectedLocationIds">
                        <div v-for="location in unassignedLocations" :key="location.id" class="location-checkbox">
                            <el-checkbox :value="location.id">
                                <div class="checkbox-content">
                                    <el-tag :type="getLocationTypeTagType(location.type)" size="small">
                                        {{ getLocationTypeLabel(location.type) }}
                                    </el-tag>
                                    <span class="location-name">{{ location.name }}</span>
                                </div>
                            </el-checkbox>
                        </div>
                    </el-checkbox-group>

                    <div v-if="unassignedLocations.length === 0" class="no-unassigned">
                        所有地点都已分配到具体天数
                    </div>
                </div>
            </div>

            <template #footer>
                <el-button @click="showAssignLocation = false">取消</el-button>
                <el-button type="primary" @click="assignLocationsToDay"
                    :disabled="assignForm.selectedLocationIds.length === 0">
                    分配
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    Setting,
    Plus,
    Edit,
    Close,
    MapLocation,
    Clock,
    Location
} from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { usePlanStore } from '@/stores/planStore'
import { useUIStore } from '@/stores/uiStore'
import { useDayPlanManagement } from '@/composables/useDayPlanManagement'
import type { Location as LocationType, LocationType as LocationTypeEnum } from '@/types'

const planStore = usePlanStore()
const uiStore = useUIStore()
const {
    getDayColor,
    getDayLocations,
    getUnassignedLocations,
    getDayStats,
    assignMultipleLocationsToDay,
    removeLocationFromDay,
    updateTotalDays,
    getLocationTypeLabel,
    getLocationTypeTagType,
    formatCoordinates,
    selectDay,
    updateRouteDayNumbers
} = useDayPlanManagement()

// Local state
const showDaySettings = ref(false)
const showAssignLocation = ref(false)
const daySettingsForm = ref({
    totalDays: 1
})
const assignForm = ref({
    targetDay: 1,
    selectedLocationIds: [] as string[]
})

// Computed
const hasCurrentPlan = computed(() => planStore.hasCurrentPlan)
const currentPlan = computed(() => planStore.currentPlan)
const selectedDay = computed(() => uiStore.selectedDay)
const locations = computed(() => planStore.currentLocations)

// 获取未分配天数的地点
const unassignedLocations = computed(() => getUnassignedLocations())

// 获取当前天的地点（可拖拽排序）
const currentDayLocations = computed({
    get: () => getDayLocations(selectedDay.value),
    set: (newLocations: LocationType[]) => {
        // 更新地点顺序（这里可以根据需要实现具体的排序逻辑）
        newLocations.forEach((location, index) => {
            planStore.updateLocation(location.id, {
                dayNumber: selectedDay.value,
                // 可以添加一个 order 字段来记录顺序
            })
        })
    }
})

// Methods

const getTotalVisitDuration = (day: number): number => {
    return getDayLocations(day).reduce((total, location) => {
        return total + (location.visitDuration || 0)
    }, 0)
}

const getDayRouteDistance = (day: number): string => {
    const dayRoutes = planStore.currentRoutes.filter(route => route.dayNumber === day)
    const totalDistance = dayRoutes.reduce((total, route) => total + route.distance, 0)
    return totalDistance.toFixed(1)
}

const showDaySettingsDialog = () => {
    if (currentPlan.value) {
        daySettingsForm.value.totalDays = currentPlan.value.totalDays
    }
    showDaySettings.value = true
}

const handleUpdateTotalDays = async () => {
    if (!currentPlan.value) return

    const newTotalDays = daySettingsForm.value.totalDays
    const currentTotalDays = currentPlan.value.totalDays

    // 如果减少天数，需要处理超出天数的地点
    if (newTotalDays < currentTotalDays) {
        const affectedLocations = locations.value.filter(
            location => location.dayNumber && location.dayNumber > newTotalDays
        )

        if (affectedLocations.length > 0) {
            try {
                await ElMessageBox.confirm(
                    `有 ${affectedLocations.length} 个地点分配在第${newTotalDays + 1}天及以后，这些地点将被移除天数分配。是否继续？`,
                    '确认修改',
                    {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning'
                    }
                )
            } catch {
                return // 用户取消
            }
        }
    }

    const success = await updateTotalDays(newTotalDays)
    if (success) {
        showDaySettings.value = false
        ElMessage.success('天数设置已更新')
    } else {
        ElMessage.error('天数设置失败')
    }
}

const showAssignLocationDialog = () => {
    assignForm.value.targetDay = selectedDay.value
    assignForm.value.selectedLocationIds = []
    showAssignLocation.value = true
}

const assignLocationsToDay = async () => {
    const { targetDay, selectedLocationIds } = assignForm.value

    const success = await assignMultipleLocationsToDay(selectedLocationIds, targetDay)
    if (success) {
        showAssignLocation.value = false
        ElMessage.success(`已将 ${selectedLocationIds.length} 个地点分配到第${targetDay}天`)
    } else {
        ElMessage.error('分配地点失败')
    }
}

const editLocationDay = async (location: LocationType) => {
    if (!currentPlan.value) return

    try {
        const { value: newDay } = await ElMessageBox.prompt(
            `请输入新的天数 (1-${currentPlan.value.totalDays})`,
            `修改"${location.name}"的天数安排`,
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                inputPattern: new RegExp(`^[1-${currentPlan.value.totalDays}]$`),
                inputErrorMessage: `请输入1到${currentPlan.value.totalDays}之间的数字`
            }
        )

        const dayNumber = parseInt(newDay)
        planStore.updateLocation(location.id, { dayNumber })
        updateRouteDayNumbers()

        ElMessage.success('天数安排已更新')
    } catch {
        // 用户取消
    }
}

const handleRemoveLocationFromDay = async (location: LocationType) => {
    try {
        await ElMessageBox.confirm(
            `确定要将"${location.name}"从第${location.dayNumber}天的安排中移除吗？`,
            '确认移除',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        const success = await removeLocationFromDay(location.id)
        if (success) {
            ElMessage.success('地点已从天数安排中移除')
        } else {
            ElMessage.error('移除地点失败')
        }
    } catch {
        // 用户取消
    }
}

const handleLocationReorder = async () => {
    // 处理拖拽排序后的逻辑
    await updateRouteDayNumbers()
}



// Watch for plan changes
watch(() => currentPlan.value?.totalDays, (newTotalDays) => {
    if (newTotalDays && selectedDay.value > newTotalDays) {
        uiStore.setSelectedDay(1)
    }
})
</script>

<style scoped lang="scss">
.day-plan-panel {
    height: 100%;
    display: flex;
    flex-direction: column;

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid var(--el-border-color-light);

        h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }

        .header-actions {
            display: flex;
            gap: 8px;
        }
    }

    .empty-state {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .panel-content {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .days-overview {
        .overview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .overview-title {
                font-weight: 600;
                font-size: 14px;
            }

            .total-days {
                color: var(--el-text-color-secondary);
                font-size: 12px;
            }
        }

        .days-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 12px;

            .day-card {
                border: 1px solid var(--el-border-color-light);
                border-radius: 8px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.2s;

                &:hover {
                    border-color: var(--el-color-primary);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                &.active {
                    border-color: var(--el-color-primary);
                    background-color: var(--el-color-primary-light-9);
                }

                &.has-locations {
                    border-left-width: 4px;
                }

                .day-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;

                    .day-number {
                        font-weight: 600;
                        font-size: 14px;
                    }

                    .day-tag {
                        font-size: 11px;
                    }
                }

                .day-locations {
                    .location-item {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        margin-bottom: 4px;
                        font-size: 12px;

                        .location-type {
                            flex-shrink: 0;
                        }

                        .location-name {
                            flex: 1;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }
                    }

                    .more-locations,
                    .no-locations {
                        font-size: 11px;
                        color: var(--el-text-color-secondary);
                        text-align: center;
                        padding: 4px 0;
                    }
                }
            }
        }
    }

    .current-day-details {
        .details-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;

            .day-info {
                display: flex;
                align-items: center;
                gap: 8px;

                h4 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                }
            }
        }

        .day-locations-list {
            margin-bottom: 16px;

            .empty-day {
                text-align: center;
                padding: 20px 0;
            }

            .draggable-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .location-card {
                border: 1px solid var(--el-border-color-light);
                border-left-width: 4px;
                border-radius: 6px;
                padding: 12px;
                background: var(--el-bg-color);
                transition: all 0.2s;

                &:hover {
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .location-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;

                    .location-info {
                        display: flex;
                        align-items: center;
                        gap: 8px;

                        .location-name {
                            font-weight: 500;
                            font-size: 14px;
                        }

                        .location-order {
                            background: var(--el-color-primary);
                            color: white;
                            border-radius: 50%;
                            width: 20px;
                            height: 20px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 11px;
                            font-weight: 600;
                        }
                    }

                    .location-actions {
                        display: flex;
                        gap: 4px;
                    }
                }

                .location-details {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 8px;
                    font-size: 12px;
                    color: var(--el-text-color-secondary);

                    >div {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                }

                .location-description {
                    font-size: 12px;
                    color: var(--el-text-color-regular);
                    line-height: 1.4;
                }
            }
        }

        .day-stats {
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;

                .stat-item {
                    text-align: center;
                    padding: 12px;
                    background: var(--el-bg-color-page);
                    border-radius: 6px;

                    .stat-label {
                        font-size: 12px;
                        color: var(--el-text-color-secondary);
                        margin-bottom: 4px;
                    }

                    .stat-value {
                        font-size: 16px;
                        font-weight: 600;
                        color: var(--el-color-primary);
                    }
                }
            }
        }
    }

    .assign-location-content {
        .target-day {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
            font-size: 14px;
        }

        .locations-to-assign {
            .section-title {
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 12px;
            }

            .location-checkbox {
                margin-bottom: 8px;

                .checkbox-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;

                    .location-name {
                        font-size: 14px;
                    }
                }
            }

            .no-unassigned {
                text-align: center;
                color: var(--el-text-color-secondary);
                font-size: 14px;
                padding: 20px 0;
            }
        }
    }
}
</style>
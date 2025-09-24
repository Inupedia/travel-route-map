<template>
  <div class="location-panel">
    <div class="panel-header">
      <h3>地点管理</h3>
      <el-button
        type="primary"
        size="small"
        @click="openAddLocationForm"
        :disabled="!hasCurrentPlan"
      >
        <el-icon><Plus /></el-icon>
        添加地点
      </el-button>
    </div>

    <div v-if="!hasCurrentPlan" class="empty-state">
      <el-empty description="请先创建一个旅游规划" />
    </div>

    <div v-else class="panel-content">
      <!-- 统计信息 -->
      <div class="location-stats">
        <el-row :gutter="12">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ stats.total }}</div>
              <div class="stat-label">总地点</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ stats.start }}</div>
              <div class="stat-label">出发点</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ stats.waypoint }}</div>
              <div class="stat-label">途经点</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ stats.end }}</div>
              <div class="stat-label">终点</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 筛选和搜索 -->
      <div class="location-filters">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-input
              v-model="searchQuery"
              placeholder="搜索地点名称"
              clearable
              size="small"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="12">
            <el-select
              v-model="filterType"
              placeholder="筛选类型"
              clearable
              size="small"
              style="width: 100%"
            >
              <el-option label="全部" value="" />
              <el-option label="出发点" value="start" />
              <el-option label="途经点" value="waypoint" />
              <el-option label="终点" value="end" />
            </el-select>
          </el-col>
        </el-row>
      </div>

      <!-- 地点列表 -->
      <div class="location-list">
        <div v-if="filteredLocations.length === 0" class="empty-locations">
          <el-empty description="暂无地点" />
        </div>

        <div
          v-for="location in filteredLocations"
          :key="location.id"
          class="location-item"
          :class="{ 'selected': selectedLocation?.id === location.id }"
          @click="selectLocation(location)"
        >
          <div class="location-header">
            <div class="location-title">
              <el-tag
                :type="getLocationTypeTagType(location.type)"
                size="small"
                class="location-type-tag"
              >
                {{ getLocationTypeLabel(location.type) }}
              </el-tag>
              <span class="location-name">{{ location.name }}</span>
            </div>
            <div class="location-actions">
              <el-button
                type="primary"
                size="small"
                text
                @click.stop="editLocation(location)"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button
                type="danger"
                size="small"
                text
                @click.stop="confirmDeleteLocation(location)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <div class="location-details">
            <div class="location-coordinates">
              <el-icon><Location /></el-icon>
              {{ formatCoordinates(location.coordinates) }}
            </div>
            
            <div v-if="location.address" class="location-address">
              <el-icon><MapLocation /></el-icon>
              {{ location.address }}
            </div>

            <div v-if="location.dayNumber" class="location-day">
              <el-icon><Calendar /></el-icon>
              第{{ location.dayNumber }}天
            </div>

            <div v-if="location.visitDuration" class="location-duration">
              <el-icon><Clock /></el-icon>
              {{ location.visitDuration }}分钟
            </div>
          </div>

          <div v-if="location.description" class="location-description">
            {{ location.description }}
          </div>

          <div v-if="location.tags && location.tags.length > 0" class="location-tags">
            <el-tag
              v-for="tag in location.tags"
              :key="tag"
              size="small"
              class="location-tag"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 地点表单对话框 -->
    <el-dialog
      v-model="showLocationForm"
      :title="selectedLocation ? '编辑地点' : '添加地点'"
      width="600px"
      :close-on-click-modal="false"
    >
      <LocationForm
        :location="selectedLocation"
        @submit="handleLocationSubmit"
        @cancel="handleLocationCancel"
        @delete="handleLocationDelete"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, Delete, Location, MapLocation, Calendar, Clock } from '@element-plus/icons-vue'
import { usePlanStore } from '@/stores/planStore'
import { useLocationManagement } from '@/composables/useLocationManagement'
import LocationForm from '@/components/Forms/LocationForm.vue'
import type { Location as LocationType, LocationType as LocationTypeEnum } from '@/types'

const planStore = usePlanStore()
const {
  isLoading,
  selectedLocation,
  showLocationForm,
  locations,
  openAddLocationForm,
  closeLocationForm,
  selectLocation,
  editLocation,
  getLocationTypeLabel,
  formatCoordinates,
  handleLocationSubmit,
  handleLocationCancel,
  handleLocationDelete,
  getLocationStats
} = useLocationManagement()

// Local state
const searchQuery = ref('')
const filterType = ref('')

// Computed
const hasCurrentPlan = computed(() => planStore.hasCurrentPlan)
const stats = computed(() => getLocationStats())

const filteredLocations = computed(() => {
  let filtered = locations.value

  // 按搜索查询筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(location =>
      location.name.toLowerCase().includes(query) ||
      location.address?.toLowerCase().includes(query) ||
      location.description?.toLowerCase().includes(query) ||
      location.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // 按类型筛选
  if (filterType.value) {
    filtered = filtered.filter(location => location.type === filterType.value)
  }

  return filtered
})

// Methods
const getLocationTypeTagType = (type: LocationTypeEnum) => {
  switch (type) {
    case 'start':
      return 'success'
    case 'end':
      return 'danger'
    case 'waypoint':
      return 'info'
    default:
      return 'info'
  }
}

const confirmDeleteLocation = async (location: LocationType) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除地点"${location.name}"吗？删除后将无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const success = await handleLocationDelete(location.id)
    if (success) {
      ElMessage.success('地点删除成功')
    }
  } catch {
    // User cancelled
  }
}
</script>

<style scoped lang="scss">
.location-panel {
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
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .location-stats {
    margin-bottom: 16px;

    .stat-item {
      text-align: center;
      padding: 12px;
      background: var(--el-bg-color-page);
      border-radius: 6px;

      .stat-number {
        font-size: 20px;
        font-weight: 600;
        color: var(--el-color-primary);
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .location-filters {
    margin-bottom: 16px;
  }

  .location-list {
    flex: 1;
    overflow-y: auto;

    .empty-locations {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
    }

    .location-item {
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: var(--el-color-primary);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      &.selected {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
      }

      .location-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .location-title {
          display: flex;
          align-items: center;
          gap: 8px;

          .location-type-tag {
            flex-shrink: 0;
          }

          .location-name {
            font-weight: 500;
            font-size: 14px;
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

        > div {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      .location-description {
        font-size: 12px;
        color: var(--el-text-color-regular);
        margin-bottom: 8px;
        line-height: 1.4;
      }

      .location-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;

        .location-tag {
          font-size: 11px;
        }
      }
    }
  }
}
</style>
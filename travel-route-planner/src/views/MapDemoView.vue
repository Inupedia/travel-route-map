<template>
  <div class="map-demo">
    <div class="demo-header">
      <h1>地图组件演示</h1>
      <p>点击地图添加地点，体验旅游路线规划功能</p>
    </div>

    <div class="demo-content">
      <!-- 地图容器 -->
      <div class="map-section" ref="mapElementRef">
        <MapContainer height="600px" width="100%" :center="defaultCenter" :zoom="12" @map-ready="handleMapReady"
          @location-click="handleLocationClick" @location-add="handleLocationAdd" @error="handleMapError" />
      </div>

      <!-- 信息面板 -->
      <div class="info-panel">
        <el-card header="地点列表">
          <div v-if="locations.length === 0" class="empty-state">
            <el-empty description="暂无地点，点击地图添加地点" />
          </div>

          <div v-else class="location-list">
            <div v-for="location in locations" :key="location.id" class="location-item"
              :class="{ active: selectedLocationId === location.id }" @click="selectLocation(location.id)">
              <div class="location-info">
                <div class="location-header">
                  <span class="location-name">{{ location.name }}</span>
                  <el-tag :type="getLocationTypeTag(location.type)" size="small">
                    {{ getLocationTypeText(location.type) }}
                  </el-tag>
                </div>

                <div class="location-coordinates">
                  {{ location.coordinates.lat.toFixed(6) }}, {{ location.coordinates.lng.toFixed(6) }}
                </div>

                <div v-if="location.description" class="location-description">
                  {{ location.description }}
                </div>
              </div>

              <div class="location-actions">
                <el-button type="primary" :icon="Edit" size="small" circle @click.stop="editLocation(location)" />
                <el-button type="danger" :icon="Delete" size="small" circle @click.stop="deleteLocation(location.id)" />
              </div>
            </div>
          </div>
        </el-card>

        <el-card header="路线信息" style="margin-top: 16px;">
          <div v-if="routes.length === 0" class="empty-state">
            <p>添加多个地点后将自动生成路线</p>
          </div>

          <div v-else class="route-list">
            <div v-for="route in routes" :key="route.id" class="route-item">
              <div class="route-info">
                <div class="route-header">
                  <span class="route-name">
                    {{ getLocationName(route.fromLocationId) }} → {{ getLocationName(route.toLocationId) }}
                  </span>
                </div>

                <div class="route-details">
                  <span class="distance">
                    <el-icon>
                      <Odometer />
                    </el-icon>
                    {{ formatDistance(route.distance) }}
                  </span>

                  <span class="duration">
                    <el-icon>
                      <Clock />
                    </el-icon>
                    {{ formatDuration(route.duration) }}
                  </span>

                  <span class="transport">
                    <el-icon>
                      <component :is="getTransportIcon(route.transportMode)" />
                    </el-icon>
                    {{ getTransportText(route.transportMode) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 导出功能面板 -->
        <el-card header="导出规划" style="margin-top: 16px;" v-if="locations.length > 0">
          <ExportPanel :map-element="mapElementRef" />
        </el-card>
      </div>
    </div>

    <!-- 编辑地点对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑地点" width="500px">
      <el-form v-if="editingLocation" :model="editingLocation" label-width="80px">
        <el-form-item label="地点名称">
          <el-input v-model="editingLocation.name" />
        </el-form-item>

        <el-form-item label="地点类型">
          <el-select v-model="editingLocation.type">
            <el-option label="出发点" :value="LocationTypeEnum.START" />
            <el-option label="途经点" :value="LocationTypeEnum.WAYPOINT" />
            <el-option label="终点" :value="LocationTypeEnum.END" />
          </el-select>
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="editingLocation.description" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item label="停留时间">
          <el-input-number v-model="editingLocation.visitDuration" :min="0" :step="15" />
          <span style="margin-left: 8px;">分钟</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveLocation">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ElCard,
  ElEmpty,
  ElTag,
  ElButton,
  ElIcon,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElInputNumber,
  ElMessage,
  ElMessageBox
} from 'element-plus'
import {
  Edit,
  Delete,
  Odometer,
  Clock,
  User,
  Position,
  Location
} from '@element-plus/icons-vue'
import { MapContainer } from '@/components/Map'
import ExportPanel from '@/components/Panels/ExportPanel.vue'
import { usePlanStore } from '@/stores/planStore'
import { useMapStore } from '@/stores/mapStore'
import type { Coordinates, LocationType, TransportMode } from '@/types'
import type { Location as TravelLocation } from '@/types'
import { LocationType as LocationTypeEnum, TransportMode as TransportModeEnum } from '@/types'

// Stores
const planStore = usePlanStore()
const mapStore = useMapStore()

// Refs
const showEditDialog = ref(false)
const editingLocation = ref<TravelLocation | null>(null)
const mapElementRef = ref<HTMLElement>()

// 默认地图中心（北京）
const defaultCenter: Coordinates = { lat: 39.9042, lng: 116.4074 }

// Computed
const locations = computed(() => planStore.currentLocations)
const routes = computed(() => planStore.currentRoutes)
const selectedLocationId = computed(() => mapStore.selectedLocationId)

// Methods
const handleMapReady = (mapInstance: any) => {
  console.log('地图初始化完成:', mapInstance)
  ElMessage.success('地图加载完成')
}

const handleLocationClick = (coordinates: Coordinates) => {
  console.log('地图点击:', coordinates)
}

const handleLocationAdd = (location: TravelLocation) => {
  console.log('地点添加:', location)
  ElMessage.success(`地点 "${location.name}" 添加成功`)
}

const handleMapError = (error: string) => {
  console.error('地图错误:', error)
  ElMessage.error(`地图错误: ${error}`)
}

const selectLocation = (locationId: string) => {
  mapStore.selectLocation(locationId)
}

const editLocation = (location: TravelLocation) => {
  editingLocation.value = { ...location }
  showEditDialog.value = true
}

const saveLocation = async () => {
  if (!editingLocation.value) return

  try {
    await planStore.updateLocation(editingLocation.value.id, editingLocation.value)
    showEditDialog.value = false
    editingLocation.value = null
    ElMessage.success('地点更新成功')
  } catch (error) {
    ElMessage.error('地点更新失败')
    console.error('更新地点失败:', error)
  }
}

const deleteLocation = async (locationId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个地点吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await planStore.removeLocation(locationId)
    ElMessage.success('地点删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('地点删除失败')
      console.error('删除地点失败:', error)
    }
  }
}

const getLocationName = (locationId: string): string => {
  const location = locations.value.find((loc: TravelLocation) => loc.id === locationId)
  return location?.name || '未知地点'
}

const getLocationTypeText = (type: LocationType): string => {
  const typeMap = {
    [LocationTypeEnum.START]: '出发点',
    [LocationTypeEnum.WAYPOINT]: '途经点',
    [LocationTypeEnum.END]: '终点'
  }
  return typeMap[type] || '地点'
}

const getLocationTypeTag = (type: LocationType): 'success' | 'info' | 'danger' => {
  const tagMap = {
    [LocationTypeEnum.START]: 'success' as const,
    [LocationTypeEnum.WAYPOINT]: 'info' as const,
    [LocationTypeEnum.END]: 'danger' as const
  }
  return tagMap[type] || 'info'
}

const getTransportIcon = (mode: TransportMode) => {
  const iconMap = {
    [TransportModeEnum.WALKING]: User,
    [TransportModeEnum.DRIVING]: Position,
    [TransportModeEnum.TRANSIT]: Location
  }
  return iconMap[mode] || User
}

const getTransportText = (mode: TransportMode): string => {
  const textMap = {
    [TransportModeEnum.WALKING]: '步行',
    [TransportModeEnum.DRIVING]: '驾车',
    [TransportModeEnum.TRANSIT]: '公交'
  }
  return textMap[mode] || '步行'
}

const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}米`
  }
  return `${distance.toFixed(1)}公里`
}

const formatDuration = (duration: number): string => {
  if (duration < 60) {
    return `${duration}分钟`
  }

  const hours = Math.floor(duration / 60)
  const minutes = duration % 60

  if (minutes === 0) {
    return `${hours}小时`
  }

  return `${hours}小时${minutes}分钟`
}
</script>

<style scoped lang="scss">
.map-demo {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;

  .demo-header {
    text-align: center;
    margin-bottom: 32px;

    h1 {
      color: var(--el-text-color-primary);
      margin-bottom: 8px;
    }

    p {
      color: var(--el-text-color-regular);
      font-size: 16px;
    }
  }

  .demo-content {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 24px;

    .map-section {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }

    .info-panel {
      .empty-state {
        text-align: center;
        padding: 20px;
        color: var(--el-text-color-secondary);
      }

      .location-list {
        .location-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border: 1px solid var(--el-border-color-light);
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            border-color: var(--el-color-primary);
            background: var(--el-color-primary-light-9);
          }

          &.active {
            border-color: var(--el-color-primary);
            background: var(--el-color-primary-light-8);
          }

          .location-info {
            flex: 1;

            .location-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;

              .location-name {
                font-weight: 600;
                color: var(--el-text-color-primary);
              }
            }

            .location-coordinates {
              font-size: 12px;
              color: var(--el-text-color-secondary);
              font-family: 'Courier New', monospace;
              margin-bottom: 4px;
            }

            .location-description {
              font-size: 12px;
              color: var(--el-text-color-regular);
              line-height: 1.4;
            }
          }

          .location-actions {
            display: flex;
            gap: 8px;
            margin-left: 12px;
          }
        }
      }

      .route-list {
        .route-item {
          padding: 12px;
          border: 1px solid var(--el-border-color-light);
          border-radius: 6px;
          margin-bottom: 8px;

          .route-info {
            .route-header {
              margin-bottom: 8px;

              .route-name {
                font-weight: 600;
                color: var(--el-text-color-primary);
              }
            }

            .route-details {
              display: flex;
              gap: 16px;
              font-size: 12px;
              color: var(--el-text-color-regular);

              .distance,
              .duration,
              .transport {
                display: flex;
                align-items: center;
                gap: 4px;

                .el-icon {
                  color: var(--el-color-primary);
                }
              }
            }
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .map-demo {
    .demo-content {
      grid-template-columns: 1fr;

      .info-panel {
        order: -1;
      }
    }
  }
}

@media (max-width: 768px) {
  .map-demo {
    padding: 16px;

    .demo-content {
      gap: 16px;

      .info-panel {
        .location-item {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;

          .location-actions {
            margin-left: 0;
            align-self: flex-end;
          }
        }
      }
    }
  }
}
</style>
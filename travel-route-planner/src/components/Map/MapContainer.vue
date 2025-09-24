<template>
  <div class="map-container">
    <div
      ref="mapRef"
      class="map-wrapper"
      :class="{
        'adding-location': isAddingLocation,
        'edit-mode': isEditMode
      }"
    />
    
    <!-- 地图控制按钮 -->
    <div class="map-controls">
      <el-button-group>
        <el-button
          :type="isAddingLocation ? 'primary' : 'default'"
          :icon="Plus"
          size="small"
          @click="toggleAddLocationMode"
        >
          {{ isAddingLocation ? '取消添加' : '添加地点' }}
        </el-button>
        
        <el-button
          :icon="Refresh"
          size="small"
          @click="resetView"
        >
          重置视图
        </el-button>
        
        <el-button
          :icon="FullScreen"
          size="small"
          @click="toggleFullscreen"
        >
          全屏
        </el-button>
      </el-button-group>
    </div>

    <!-- 缩放控制 -->
    <div class="zoom-controls">
      <el-button
        :icon="Plus"
        size="small"
        circle
        @click="zoomIn"
      />
      <el-button
        :icon="Minus"
        size="small"
        circle
        @click="zoomOut"
      />
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="map-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>地图加载中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="map-error">
      <el-icon><Warning /></el-icon>
      <span>{{ error }}</span>
      <el-button size="small" @click="retryInitialization">重试</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElButton, ElButtonGroup, ElIcon, ElMessage } from 'element-plus'
import { Plus, Minus, Refresh, FullScreen, Warning, Loading } from '@element-plus/icons-vue'
import { useMapStore } from '@/stores/mapStore'
import { usePlanStore } from '@/stores/planStore'
import { mapService } from '@/services/mapService'
import type { Coordinates, Location } from '@/types'
import { LocationType, MapMode } from '@/types'

// Props
interface Props {
  height?: string
  width?: string
  center?: Coordinates
  zoom?: number
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '100%',
  width: '100%',
  center: () => ({ lat: 39.9042, lng: 116.4074 }),
  zoom: 10,
  showControls: true
})

// Emits
const emit = defineEmits<{
  mapReady: [mapInstance: any]
  locationClick: [coordinates: Coordinates]
  locationAdd: [location: Location]
  error: [error: string]
}>()

// Stores
const mapStore = useMapStore()
const planStore = usePlanStore()

// Refs
const mapRef = ref<HTMLElement>()
const isLoading = ref(true)
const error = ref<string>('')
const isFullscreen = ref(false)

// Computed - 使用computed来访问store的响应式属性
const isAddingLocation = computed(() => mapStore.isAddingLocation)
const isEditMode = computed(() => mapStore.mapMode === MapMode.EDIT)
const center = computed(() => mapStore.center)
const zoom = computed(() => mapStore.zoom)
const selectedLocationId = computed(() => mapStore.selectedLocationId)

// Methods
const initializeMap = async () => {
  if (!mapRef.value) return

  try {
    isLoading.value = true
    error.value = ''

    await mapService.initializeMap({
      container: mapRef.value,
      center: props.center,
      zoom: props.zoom,
      style: 'normal',
      controls: {
        zoom: false, // 使用自定义缩放控件
        scale: true,
        fullscreen: false
      }
    })

    // 绑定地图事件
    bindMapEvents()

    // 渲染现有的地点和路线
    await renderExistingData()

    // 更新store状态
    mapStore.initializeMap(mapRef.value, {
      center: props.center,
      zoom: props.zoom
    })

    emit('mapReady', mapService.getMapInstance())
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '地图初始化失败'
    error.value = errorMessage
    emit('error', errorMessage)
    console.error('地图初始化失败:', err)
  } finally {
    isLoading.value = false
  }
}

const bindMapEvents = () => {
  // 地图点击事件
  mapService.addEventListener('click', handleMapClick)
  
  // 地图缩放事件
  mapService.addEventListener('zoom', (newZoom: number) => {
    mapStore.setZoom(newZoom)
  })
  
  // 地图移动事件
  mapService.addEventListener('move', (newCenter: Coordinates) => {
    mapStore.setCenter(newCenter)
  })
}

const handleMapClick = (coordinates: Coordinates) => {
  emit('locationClick', coordinates)
  
  if (isAddingLocation.value) {
    addLocationAtCoordinates(coordinates)
  }
}

const addLocationAtCoordinates = async (coordinates: Coordinates) => {
  try {
    // 验证坐标有效性
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      throw new Error('无效的坐标信息')
    }

    // 确保有当前规划
    if (!planStore.hasCurrentPlan) {
      // 创建默认规划
      planStore.createPlan('我的旅行规划', 7)
    }

    // 创建新地点
    planStore.addLocation({
      name: `地点 ${planStore.currentLocations.length + 1}`,
      type: planStore.currentLocations.length === 0 ? LocationType.START : LocationType.WAYPOINT,
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng
      },
      description: '',
      tags: [],
      dayNumber: 1,
      visitDuration: 60
    })

    // 检查是否有错误
    if (planStore.error) {
      throw new Error(planStore.error)
    }

    // 获取最新添加的地点
    const newLocation = planStore.currentLocations[planStore.currentLocations.length - 1]
    
    if (!newLocation) {
      throw new Error('地点添加失败')
    }

    // 验证新地点的坐标
    if (!newLocation.coordinates) {
      throw new Error('地点坐标信息缺失')
    }
    
    // 添加地图标记
    addLocationMarker(newLocation)
    
    // 关闭添加模式
    mapStore.setAddingLocation(false)
    
    emit('locationAdd', newLocation)
    ElMessage.success('地点添加成功')
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '添加地点失败'
    ElMessage.error(errorMessage)
    console.error('添加地点失败:', err)
    
    // 清除store中的错误状态
    planStore.clearError()
  }
}

const addLocationMarker = (location: Location) => {
  // 验证地点和坐标信息
  if (!location) {
    console.error('地点信息为空')
    return
  }

  if (!location.coordinates) {
    console.error('地点坐标信息缺失:', location)
    return
  }

  if (typeof location.coordinates.lat !== 'number' || typeof location.coordinates.lng !== 'number') {
    console.error('地点坐标格式错误:', location.coordinates)
    return
  }

  try {
    const markerOptions = {
      position: location.coordinates,
      title: location.name,
      draggable: isEditMode.value,
      onClick: () => handleMarkerClick(location),
      onDragEnd: (position: Coordinates) => handleMarkerDragEnd(location.id, position)
    }

    mapService.addMarker(location.id, markerOptions)
  } catch (err) {
    console.error('添加地图标记失败:', err)
    ElMessage.error('添加地图标记失败')
  }
}

const handleMarkerClick = (location: Location) => {
  mapStore.selectLocation(location.id)
}

const handleMarkerDragEnd = async (locationId: string, newPosition: Coordinates) => {
  try {
    await planStore.updateLocation(locationId, {
      coordinates: newPosition
    })
    ElMessage.success('地点位置已更新')
  } catch (err) {
    ElMessage.error('更新地点位置失败')
    console.error('更新地点位置失败:', err)
  }
}

const renderExistingData = async () => {
  try {
    // 渲染现有地点
    planStore.currentLocations.forEach((location: Location) => {
      if (location && location.coordinates) {
        addLocationMarker(location)
      } else {
        console.warn('跳过无效地点:', location)
      }
    })

    // 渲染现有路线
    planStore.currentRoutes.forEach((route: any) => {
      if (route && route.path && route.path.length > 0) {
        drawRoute(route)
      } else {
        console.warn('跳过无效路线:', route)
      }
    })

    // 如果有地点，调整视图以显示所有地点
    if (planStore.currentLocations.length > 0) {
      const validCoordinates = planStore.currentLocations
        .filter((loc: Location) => loc && loc.coordinates && 
          typeof loc.coordinates.lat === 'number' && 
          typeof loc.coordinates.lng === 'number')
        .map((loc: Location) => loc.coordinates)
      
      if (validCoordinates.length > 0) {
        mapService.fitBounds(validCoordinates)
      }
    }
  } catch (err) {
    console.error('渲染现有数据失败:', err)
  }
}

const drawRoute = (route: any) => {
  if (!route.path || route.path.length === 0) return

  const routeOptions = {
    path: route.path,
    color: getRouteColor(route.dayNumber),
    width: 4,
    opacity: 0.8
  }

  mapService.drawRoute(route.id, routeOptions)
}

const getRouteColor = (dayNumber: number): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ]
  return colors[(dayNumber - 1) % colors.length]
}

const toggleAddLocationMode = () => {
  mapStore.toggleAddLocationMode()
}

const resetView = () => {
  mapStore.resetView()
  mapService.setCenter(props.center)
  mapService.setZoom(props.zoom)
}

const zoomIn = () => {
  mapStore.zoomIn()
}

const zoomOut = () => {
  mapStore.zoomOut()
}

const toggleFullscreen = () => {
  if (!mapRef.value) return

  if (!isFullscreen.value) {
    if (mapRef.value.requestFullscreen) {
      mapRef.value.requestFullscreen()
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }
}

const retryInitialization = () => {
  initializeMap()
}

// 监听地点变化，更新地图标记
watch(() => planStore.currentLocations, (newLocations, oldLocations) => {
  try {
    // 移除已删除的标记
    if (oldLocations) {
      const removedIds = oldLocations
        .filter((old: Location) => old && old.id && !newLocations.find((loc: Location) => loc && loc.id === old.id))
        .map((loc: Location) => loc.id)
      
      removedIds.forEach((id: string) => {
        if (id) {
          mapService.removeMarker(id)
        }
      })
    }

    // 添加新的标记
    const newIds = newLocations
      .filter((loc: Location) => loc && loc.id && !oldLocations?.find((old: Location) => old && old.id === loc.id))
      .map((loc: Location) => loc.id)
    
    newIds.forEach((id: string) => {
      if (id) {
        const location = newLocations.find((loc: Location) => loc && loc.id === id)
        if (location && location.coordinates) {
          addLocationMarker(location)
        }
      }
    })
  } catch (err) {
    console.error('更新地图标记失败:', err)
  }
}, { deep: true })

// 监听路线变化，更新地图路线
watch(() => planStore.currentRoutes, (newRoutes, oldRoutes) => {
  // 移除已删除的路线
  if (oldRoutes) {
    const removedIds = oldRoutes
      .filter((old: any) => !newRoutes.find((route: any) => route.id === old.id))
      .map((route: any) => route.id)
    
    removedIds.forEach((id: string) => {
      mapService.removeRoute(id)
    })
  }

  // 添加新的路线
  const newIds = newRoutes
    .filter((route: any) => !oldRoutes?.find((old: any) => old.id === route.id))
    .map((route: any) => route.id)
  
  newIds.forEach((id: string) => {
    const route = newRoutes.find((r: any) => r.id === id)
    if (route) {
      drawRoute(route)
    }
  })
}, { deep: true })

// 监听选中地点变化，高亮显示
watch(() => selectedLocationId.value, (newId, oldId) => {
  if (oldId) {
    // 取消之前选中地点的高亮
    mapService.updateMarker(oldId, { 
      // 这里可以添加取消高亮的样式更新
    })
  }
  
  if (newId) {
    // 高亮当前选中的地点
    mapService.updateMarker(newId, {
      // 这里可以添加高亮样式更新
    })
    
    // 将地图中心移动到选中地点
    const location = planStore.currentLocations.find((loc: Location) => loc.id === newId)
    if (location) {
      mapService.setCenter(location.coordinates)
    }
  }
})

// 生命周期
onMounted(async () => {
  await nextTick()
  await initializeMap()
})

onUnmounted(() => {
  mapService.destroyMap()
})

// 监听全屏状态变化
document.addEventListener('fullscreenchange', () => {
  isFullscreen.value = !!document.fullscreenElement
})
</script>

<style scoped lang="scss">
.map-container {
  position: relative;
  width: v-bind(width);
  height: v-bind(height);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  .map-wrapper {
    width: 100%;
    height: 100%;
    position: relative;

    &.adding-location {
      cursor: crosshair;
    }

    &.edit-mode {
      border: 2px solid var(--el-color-primary);
    }
  }

  .map-controls {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    border-radius: 6px;
    padding: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .zoom-controls {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .el-button {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      &:hover {
        background: rgba(255, 255, 255, 1);
      }
    }
  }

  .map-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 24px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    span {
      color: var(--el-text-color-regular);
      font-size: 14px;
    }
  }

  .map-error {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2000;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 24px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    text-align: center;

    .el-icon {
      font-size: 32px;
      color: var(--el-color-warning);
    }

    span {
      color: var(--el-text-color-regular);
      font-size: 14px;
      max-width: 200px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .map-container {
    .map-controls {
      top: 8px;
      left: 8px;
      padding: 4px;

      .el-button-group .el-button {
        padding: 8px 12px;
        font-size: 12px;
      }
    }

    .zoom-controls {
      top: 8px;
      right: 8px;

      .el-button {
        width: 32px;
        height: 32px;
      }
    }
  }
}
</style>
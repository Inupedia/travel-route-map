<template>
  <div class="map-controls">
    <!-- 主要控制按钮 -->
    <div class="control-group primary-controls">
      <el-tooltip content="添加地点" placement="left">
        <el-button
          :type="isAddingLocation ? 'primary' : 'default'"
          :icon="Plus"
          circle
          @click="toggleAddLocationMode"
        />
      </el-tooltip>
      
      <el-tooltip content="编辑模式" placement="left">
        <el-button
          :type="isEditMode ? 'primary' : 'default'"
          :icon="Edit"
          circle
          @click="toggleEditMode"
        />
      </el-tooltip>
      
      <el-tooltip content="清除所有" placement="left">
        <el-button
          type="danger"
          :icon="Delete"
          circle
          @click="handleClearAll"
        />
      </el-tooltip>
    </div>

    <!-- 视图控制 -->
    <div class="control-group view-controls">
      <el-tooltip content="放大" placement="left">
        <el-button
          :icon="Plus"
          circle
          size="small"
          @click="zoomIn"
        />
      </el-tooltip>
      
      <el-tooltip content="缩小" placement="left">
        <el-button
          :icon="Minus"
          circle
          size="small"
          @click="zoomOut"
        />
      </el-tooltip>
      
      <el-tooltip content="适应视图" placement="left">
        <el-button
          :icon="Aim"
          circle
          size="small"
          @click="fitView"
        />
      </el-tooltip>
      
      <el-tooltip content="重置视图" placement="left">
        <el-button
          :icon="Refresh"
          circle
          size="small"
          @click="resetView"
        />
      </el-tooltip>
    </div>

    <!-- 图层控制 -->
    <div class="control-group layer-controls">
      <el-tooltip content="显示/隐藏路线" placement="left">
        <el-button
          :type="showRoutes ? 'primary' : 'default'"
          :icon="Connection"
          circle
          size="small"
          @click="toggleRoutes"
        />
      </el-tooltip>
      
      <el-tooltip content="显示/隐藏标签" placement="left">
        <el-button
          :type="showLabels ? 'primary' : 'default'"
          :icon="PriceTag"
          circle
          size="small"
          @click="toggleLabels"
        />
      </el-tooltip>
      
      <el-tooltip content="显示/隐藏距离" placement="left">
        <el-button
          :type="showDistances ? 'primary' : 'default'"
          :icon="Odometer"
          circle
          size="small"
          @click="toggleDistances"
        />
      </el-tooltip>
    </div>

    <!-- 地图样式切换 -->
    <div class="control-group style-controls">
      <el-dropdown @command="handleStyleChange">
        <el-button :icon="Picture" circle size="small" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item 
              command="normal"
              :class="{ active: mapStyle === 'normal' }"
            >
              标准地图
            </el-dropdown-item>
            <el-dropdown-item 
              command="satellite"
              :class="{ active: mapStyle === 'satellite' }"
            >
              卫星地图
            </el-dropdown-item>
            <el-dropdown-item 
              command="terrain"
              :class="{ active: mapStyle === 'terrain' }"
            >
              地形地图
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 测量工具 -->
    <div class="control-group measure-controls">
      <el-tooltip content="测量距离" placement="left">
        <el-button
          :type="isMeasuring ? 'primary' : 'default'"
          :icon="Compass"
          circle
          size="small"
          @click="toggleMeasure"
        />
      </el-tooltip>
    </div>

    <!-- 全屏控制 -->
    <div class="control-group fullscreen-controls">
      <el-tooltip :content="isFullscreen ? '退出全屏' : '全屏'" placement="left">
        <el-button
          :icon="isFullscreen ? 'FullScreen' : 'FullScreen'"
          circle
          size="small"
          @click="toggleFullscreen"
        />
      </el-tooltip>
    </div>

    <!-- 位置信息显示 -->
    <div v-if="showCoordinates" class="coordinates-display">
      <div class="coordinate-item">
        <span class="label">经度:</span>
        <span class="value">{{ currentCoordinates.lng.toFixed(6) }}</span>
      </div>
      <div class="coordinate-item">
        <span class="label">纬度:</span>
        <span class="value">{{ currentCoordinates.lat.toFixed(6) }}</span>
      </div>
      <div class="coordinate-item">
        <span class="label">缩放:</span>
        <span class="value">{{ currentZoom }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  ElButton, 
  ElTooltip, 
  ElDropdown, 
  ElDropdownMenu, 
  ElDropdownItem,
  ElMessageBox,
  ElMessage
} from 'element-plus'
import {
  Plus,
  Minus,
  Edit,
  Delete,
  Refresh,
  Aim,
  Connection,
  PriceTag,
  Odometer,
  Picture,
  Compass,
  FullScreen
} from '@element-plus/icons-vue'
import { useMapStore } from '@/stores/mapStore'
import { usePlanStore } from '@/stores/planStore'
import { mapService } from '@/services/mapService'
import type { Coordinates } from '@/types'
import { MapMode } from '@/types'

// Props
interface Props {
  showCoordinates?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCoordinates: false,
  compact: false
})

// Emits
const emit = defineEmits<{
  addLocation: []
  editModeToggle: [enabled: boolean]
  clearAll: []
  styleChange: [style: string]
  measureToggle: [enabled: boolean]
  fullscreenToggle: [enabled: boolean]
}>()

// Stores
const mapStore = useMapStore()
const planStore = usePlanStore()

// Refs
const showRoutes = ref(true)
const showLabels = ref(true)
const showDistances = ref(true)
const mapStyle = ref('normal')
const isMeasuring = ref(false)
const isFullscreen = ref(false)

// Computed
const isAddingLocation = computed(() => mapStore.isAddingLocation)
const isEditMode = computed(() => mapStore.isEditMode)
const center = computed(() => mapStore.center)
const zoom = computed(() => mapStore.zoom)

const currentCoordinates = computed(() => center.value)
const currentZoom = computed(() => zoom.value)

// Methods
const toggleAddLocationMode = () => {
  mapStore.toggleAddLocationMode()
  emit('addLocation')
}

const toggleEditMode = () => {
  const newEditMode = !isEditMode.value
  mapStore.setMapMode(newEditMode ? MapMode.EDIT : MapMode.VIEW)
  emit('editModeToggle', newEditMode)
}

const handleClearAll = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有地点和路线吗？此操作不可撤销。',
      '确认清除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 清除所有数据
    planStore.clearCurrentPlan()
    mapService.clearMarkers()
    mapService.clearRoutes()
    
    emit('clearAll')
    ElMessage.success('已清除所有数据')
    
  } catch {
    // 用户取消操作
  }
}

const zoomIn = () => {
  mapStore.zoomIn()
}

const zoomOut = () => {
  mapStore.zoomOut()
}

const fitView = () => {
  if (planStore.currentLocations.length > 0) {
    const validCoordinates = planStore.currentLocations
      .filter((loc: any) => loc && loc.coordinates && 
        typeof loc.coordinates.lat === 'number' && 
        typeof loc.coordinates.lng === 'number')
      .map((loc: any) => loc.coordinates)
    
    if (validCoordinates.length > 0) {
      mapService.fitBounds(validCoordinates)
    } else {
      ElMessage.warning('没有有效的地点坐标')
    }
  } else {
    ElMessage.info('没有地点可以适应视图')
  }
}

const resetView = () => {
  mapStore.resetView()
}

const toggleRoutes = () => {
  showRoutes.value = !showRoutes.value
  
  if (showRoutes.value) {
    // 显示所有路线
    planStore.currentRoutes.forEach((route: any) => {
      // 重新绘制路线的逻辑
    })
  } else {
    // 隐藏所有路线
    mapService.clearRoutes()
  }
}

const toggleLabels = () => {
  showLabels.value = !showLabels.value
  // 更新标记显示状态的逻辑
}

const toggleDistances = () => {
  showDistances.value = !showDistances.value
  // 更新距离显示状态的逻辑
}

const handleStyleChange = (style: string) => {
  mapStyle.value = style
  // 这里需要调用地图服务来改变地图样式
  // mapService.setMapStyle(style)
  emit('styleChange', style)
}

const toggleMeasure = () => {
  isMeasuring.value = !isMeasuring.value
  emit('measureToggle', isMeasuring.value)
  
  if (isMeasuring.value) {
    ElMessage.info('点击地图开始测量距离')
  }
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  emit('fullscreenToggle', isFullscreen.value)
}

// 监听键盘快捷键
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'a':
        event.preventDefault()
        toggleAddLocationMode()
        break
      case 'e':
        event.preventDefault()
        toggleEditMode()
        break
      case 'r':
        event.preventDefault()
        resetView()
        break
      case 'f':
        event.preventDefault()
        toggleFullscreen()
        break
    }
  }
  
  // ESC键退出当前模式
  if (event.key === 'Escape') {
    if (isAddingLocation.value) {
      mapStore.setAddingLocation(false)
    }
    if (isMeasuring.value) {
      isMeasuring.value = false
    }
  }
})
</script>

<style scoped lang="scss">
.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    padding: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(0, 0, 0, 0.05);

    .el-button {
      border: none;
      background: transparent;
      
      &:hover {
        background: var(--el-color-primary-light-9);
      }

      &.el-button--primary {
        background: var(--el-color-primary);
        color: white;

        &:hover {
          background: var(--el-color-primary-dark-2);
        }
      }

      &.el-button--danger {
        &:hover {
          background: var(--el-color-danger-light-9);
          color: var(--el-color-danger);
        }
      }
    }
  }

  .primary-controls {
    .el-button {
      width: 40px;
      height: 40px;
    }
  }

  .view-controls,
  .layer-controls,
  .style-controls,
  .measure-controls,
  .fullscreen-controls {
    .el-button {
      width: 32px;
      height: 32px;
    }
  }

  .coordinates-display {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 6px;
    padding: 8px 12px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    min-width: 140px;

    .coordinate-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        opacity: 0.8;
      }

      .value {
        font-weight: bold;
      }
    }
  }
}

// 紧凑模式
.map-controls.compact {
  .control-group {
    padding: 4px;
    gap: 4px;

    .el-button {
      width: 28px;
      height: 28px;
    }
  }

  .primary-controls .el-button {
    width: 32px;
    height: 32px;
  }
}

// 下拉菜单样式
:deep(.el-dropdown-menu) {
  .el-dropdown-menu__item {
    &.active {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .map-controls {
    top: 8px;
    right: 8px;
    gap: 8px;

    .control-group {
      padding: 6px;
      gap: 6px;

      .el-button {
        width: 36px;
        height: 36px;
      }
    }

    .primary-controls .el-button {
      width: 40px;
      height: 40px;
    }

    .coordinates-display {
      padding: 6px 8px;
      font-size: 11px;
      min-width: 120px;
    }
  }
}

// 动画效果
.control-group {
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
}

.el-button {
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.95);
  }
}
</style>
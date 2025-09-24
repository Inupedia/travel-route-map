<template>
  <div class="map-route" :style="routeStyle">
    <!-- 路线路径 -->
    <svg
      v-if="pathData"
      class="route-path"
      :viewBox="viewBox"
      :width="svgWidth"
      :height="svgHeight"
    >
      <!-- 路线主体 -->
      <path
        :d="pathData"
        :stroke="routeColor"
        :stroke-width="strokeWidth"
        :stroke-opacity="opacity"
        :stroke-dasharray="dashArray"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      
      <!-- 路线方向箭头 -->
      <g v-if="showDirection">
        <defs>
          <marker
            :id="`arrow-${route.id}`"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon
              points="0,0 0,6 9,3"
              :fill="routeColor"
              :opacity="opacity"
            />
          </marker>
        </defs>
        
        <path
          :d="pathData"
          :stroke="routeColor"
          :stroke-width="strokeWidth"
          :stroke-opacity="0"
          fill="none"
          :marker-end="`url(#arrow-${route.id})`"
        />
      </g>
    </svg>

    <!-- 路线信息标签 -->
    <div
      v-if="showInfo && routeInfo"
      class="route-info"
      :style="infoPosition"
    >
      <div class="info-content">
        <div class="distance">
          <el-icon><Odometer /></el-icon>
          <span>{{ formatDistance(route.distance) }}</span>
        </div>
        
        <div class="duration">
          <el-icon><Clock /></el-icon>
          <span>{{ formatDuration(route.duration) }}</span>
        </div>
        
        <div class="transport-mode">
          <el-icon>
            <component :is="transportIcon" />
          </el-icon>
          <span>{{ transportModeText }}</span>
        </div>
      </div>
    </div>

    <!-- 路线控制点 -->
    <div
      v-if="showControls && isSelected"
      v-for="(point, index) in controlPoints"
      :key="`control-${index}`"
      class="control-point"
      :style="{
        left: `${point.x}px`,
        top: `${point.y}px`
      }"
      @click="handleControlPointClick(index)"
    >
      <div class="control-dot"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElIcon } from 'element-plus'
import { 
  Odometer, 
  Clock, 
  User, 
  Position, 
  Location 
} from '@element-plus/icons-vue'
import type { Route, TransportMode, Coordinates } from '@/types'

// Props
interface Props {
  route: Route
  isSelected?: boolean
  isHighlighted?: boolean
  showDirection?: boolean
  showInfo?: boolean
  showControls?: boolean
  opacity?: number
  animated?: boolean
  dayColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isHighlighted: false,
  showDirection: true,
  showInfo: true,
  showControls: false,
  opacity: 0.8,
  animated: false
})

// Emits
const emit = defineEmits<{
  click: [route: Route]
  controlPointClick: [route: Route, pointIndex: number]
  pathUpdate: [route: Route, newPath: Coordinates[]]
}>()

// Refs
const pathData = ref<string>('')
const viewBox = ref<string>('0 0 100 100')
const svgWidth = ref<number>(100)
const svgHeight = ref<number>(100)
const controlPoints = ref<Array<{ x: number; y: number }>>([])
const routeInfo = ref<{ x: number; y: number } | null>(null)

// Computed
const routeColor = computed(() => {
  if (props.dayColor) {
    return props.dayColor
  }
  
  // 根据天数生成颜色
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ]
  return colors[(props.route.dayNumber - 1) % colors.length]
})

const strokeWidth = computed(() => {
  if (props.isSelected) return 6
  if (props.isHighlighted) return 5
  return 4
})

const dashArray = computed(() => {
  if (props.route.transportMode === 'walking') {
    return '5,5'
  }
  return undefined
})

const transportIcon = computed(() => {
  const iconMap = {
    walking: User,
    driving: Position,
    transit: Location
  }
  return iconMap[props.route.transportMode] || User
})

const transportModeText = computed(() => {
  const textMap = {
    walking: '步行',
    driving: '驾车',
    transit: '公交'
  }
  return textMap[props.route.transportMode] || '步行'
})

const routeStyle = computed(() => ({
  zIndex: props.isSelected ? 1000 : 500,
  pointerEvents: props.showControls ? 'auto' : 'none'
} as any))

const infoPosition = computed(() => {
  if (!routeInfo.value) return {}
  
  return {
    left: `${routeInfo.value.x}px`,
    top: `${routeInfo.value.y}px`,
    transform: 'translate(-50%, -50%)'
  }
})

// Methods
const generatePathData = () => {
  if (!props.route.path || props.route.path.length < 2) {
    pathData.value = ''
    return
  }

  // 简化的路径生成逻辑
  // 实际实现中需要根据地图坐标系统进行转换
  const path = props.route.path
  let d = `M ${path[0].lng} ${path[0].lat}`
  
  for (let i = 1; i < path.length; i++) {
    d += ` L ${path[i].lng} ${path[i].lat}`
  }
  
  pathData.value = d
  
  // 计算SVG视图框
  const lngs = path.map(p => p.lng)
  const lats = path.map(p => p.lat)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  
  const padding = 0.001
  viewBox.value = `${minLng - padding} ${minLat - padding} ${maxLng - minLng + 2 * padding} ${maxLat - minLat + 2 * padding}`
  
  // 生成控制点
  generateControlPoints()
  
  // 计算信息标签位置
  calculateInfoPosition()
}

const generateControlPoints = () => {
  if (!props.route.path || props.route.path.length < 2) {
    controlPoints.value = []
    return
  }

  const points: Array<{ x: number; y: number }> = []
  const path = props.route.path
  
  // 在路径中点添加控制点
  for (let i = 0; i < path.length - 1; i++) {
    const start = path[i]
    const end = path[i + 1]
    const midPoint = {
      x: (start.lng + end.lng) / 2,
      y: (start.lat + end.lat) / 2
    }
    points.push(midPoint)
  }
  
  controlPoints.value = points
}

const calculateInfoPosition = () => {
  if (!props.route.path || props.route.path.length < 2) {
    routeInfo.value = null
    return
  }

  // 计算路径中点作为信息标签位置
  const path = props.route.path
  const midIndex = Math.floor(path.length / 2)
  const midPoint = path[midIndex]
  
  routeInfo.value = {
    x: midPoint.lng,
    y: midPoint.lat
  }
}

const handleControlPointClick = (index: number) => {
  emit('controlPointClick', props.route, index)
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

// 监听路线变化
watch(() => props.route, () => {
  generatePathData()
}, { deep: true, immediate: true })

// 监听选中状态变化
watch(() => props.isSelected, (newValue) => {
  if (newValue) {
    // 选中时可以添加特殊效果
  }
})

onMounted(() => {
  generatePathData()
})
</script>

<style scoped lang="scss">
.map-route {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  .route-path {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;

    path {
      transition: all 0.3s ease;
      
      &:hover {
        stroke-width: 6;
      }
    }
  }

  .route-info {
    position: absolute;
    pointer-events: auto;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    padding: 8px 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(0, 0, 0, 0.1);
    z-index: 1000;

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 120px;

      .distance,
      .duration,
      .transport-mode {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--el-text-color-regular);

        .el-icon {
          font-size: 14px;
          color: var(--el-color-primary);
        }
      }

      .distance {
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }
  }

  .control-point {
    position: absolute;
    pointer-events: auto;
    cursor: pointer;
    z-index: 1001;

    .control-dot {
      width: 12px;
      height: 12px;
      background: white;
      border: 2px solid var(--el-color-primary);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.2s ease;

      &:hover {
        transform: translate(-50%, -50%) scale(1.2);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
    }
  }

  // 选中状态样式
  &.route-selected {
    .route-path path {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }

    .route-info {
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  // 高亮状态样式
  &.route-highlighted {
    .route-path path {
      animation: routePulse 2s infinite;
    }
  }

  // 动画路线样式
  &.route-animated {
    .route-path path {
      stroke-dasharray: 20;
      animation: routeFlow 3s linear infinite;
    }
  }
}

// 动画效果
@keyframes routePulse {
  0%, 100% {
    stroke-opacity: 0.8;
  }
  50% {
    stroke-opacity: 1;
  }
}

@keyframes routeFlow {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -40;
  }
}

// 不同交通方式的样式
.transport-walking {
  .route-path path {
    stroke-dasharray: 5, 5;
  }
}

.transport-driving {
  .route-path path {
    stroke-dasharray: none;
  }
}

.transport-transit {
  .route-path path {
    stroke-dasharray: 10, 5, 2, 5;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .map-route {
    .route-info {
      padding: 6px 8px;
      
      .info-content {
        min-width: 100px;
        
        .distance,
        .duration,
        .transport-mode {
          font-size: 11px;
          
          .el-icon {
            font-size: 12px;
          }
        }
      }
    }

    .control-point .control-dot {
      width: 16px;
      height: 16px;
      border-width: 3px;
    }
  }
}
</style>
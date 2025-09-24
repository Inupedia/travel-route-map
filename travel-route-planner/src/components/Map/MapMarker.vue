<template>
  <div
    class="map-marker"
    :class="[
      `marker-${location.type}`,
      { 
        'marker-selected': isSelected,
        'marker-dragging': isDragging,
        'marker-highlighted': isHighlighted
      }
    ]"
    :style="markerStyle"
    @click="handleClick"
    @mousedown="handleMouseDown"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 标记图标 -->
    <div class="marker-icon">
      <el-icon :size="iconSize">
        <component :is="markerIcon" />
      </el-icon>
    </div>

    <!-- 标记标签 -->
    <div v-if="showLabel" class="marker-label">
      {{ location.name }}
    </div>

    <!-- 天数标识 -->
    <div v-if="location.dayNumber && showDayNumber" class="day-badge">
      {{ location.dayNumber }}
    </div>

    <!-- 悬浮信息卡片 -->
    <transition name="fade">
      <div v-if="showTooltip && isHovered" class="marker-tooltip">
        <div class="tooltip-header">
          <h4>{{ location.name }}</h4>
          <span class="location-type">{{ locationTypeText }}</span>
        </div>
        
        <div v-if="location.address" class="tooltip-address">
          <el-icon><Location /></el-icon>
          <span>{{ location.address }}</span>
        </div>
        
        <div v-if="location.description" class="tooltip-description">
          {{ location.description }}
        </div>
        
        <div class="tooltip-meta">
          <div v-if="location.visitDuration" class="duration">
            <el-icon><Clock /></el-icon>
            <span>{{ formatDuration(location.visitDuration) }}</span>
          </div>
          
          <div v-if="location.dayNumber" class="day">
            <el-icon><Calendar /></el-icon>
            <span>第{{ location.dayNumber }}天</span>
          </div>
        </div>
        
        <div v-if="location.tags && location.tags.length > 0" class="tooltip-tags">
          <el-tag
            v-for="tag in location.tags"
            :key="tag"
            size="small"
            type="info"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElIcon, ElTag } from 'element-plus'
import { 
  LocationFilled, 
  Flag, 
  Position,
  Location,
  Clock,
  Calendar
} from '@element-plus/icons-vue'
import type { Location as LocationType, LocationType as LocationTypeEnum } from '@/types'

// Props
interface Props {
  location: LocationType
  isSelected?: boolean
  isHighlighted?: boolean
  showLabel?: boolean
  showTooltip?: boolean
  showDayNumber?: boolean
  draggable?: boolean
  size?: 'small' | 'medium' | 'large'
  zIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isHighlighted: false,
  showLabel: true,
  showTooltip: true,
  showDayNumber: true,
  draggable: false,
  size: 'medium',
  zIndex: 1000
})

// Emits
const emit = defineEmits<{
  click: [location: LocationType]
  dragStart: [location: LocationType]
  dragEnd: [location: LocationType, newPosition: { lat: number; lng: number }]
  mouseEnter: [location: LocationType]
  mouseLeave: [location: LocationType]
}>()

// Refs
const isHovered = ref(false)
const isDragging = ref(false)
const dragStartPosition = ref<{ x: number; y: number } | null>(null)

// Computed
const markerIcon = computed(() => {
  switch (props.location.type) {
    case 'start':
      return Flag
    case 'end':
      return LocationFilled
    case 'waypoint':
    default:
      return Position
  }
})

const locationTypeText = computed(() => {
  const typeMap = {
    start: '出发点',
    waypoint: '途经点',
    end: '终点'
  }
  return typeMap[props.location.type] || '地点'
})

const iconSize = computed(() => {
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 24
  }
  return sizeMap[props.size]
})

const markerStyle = computed(() => {
  const baseStyle = {
    zIndex: props.zIndex + (props.isSelected ? 100 : 0)
  }

  // 根据地点类型设置颜色
  const colorMap = {
    start: '#67C23A',
    waypoint: '#409EFF', 
    end: '#F56C6C'
  }

  return {
    ...baseStyle,
    '--marker-color': colorMap[props.location.type] || '#909399'
  }
})

// Methods
const handleClick = (event: MouseEvent) => {
  event.stopPropagation()
  emit('click', props.location)
}

const handleMouseDown = (event: MouseEvent) => {
  if (!props.draggable) return

  isDragging.value = true
  dragStartPosition.value = { x: event.clientX, y: event.clientY }
  
  emit('dragStart', props.location)

  // 添加全局鼠标事件监听
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  
  // 阻止默认行为
  event.preventDefault()
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || !dragStartPosition.value) return

  // 这里可以添加拖拽过程中的视觉反馈
  // 实际的位置更新会在 mouseup 时处理
}

const handleMouseUp = (event: MouseEvent) => {
  if (!isDragging.value || !dragStartPosition.value) return

  const deltaX = event.clientX - dragStartPosition.value.x
  const deltaY = event.clientY - dragStartPosition.value.y

  // 如果移动距离足够大，触发拖拽结束事件
  if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
    // 这里需要将像素坐标转换为地理坐标
    // 实际实现中需要使用地图服务的坐标转换方法
    const newPosition = {
      lat: props.location.coordinates.lat + deltaY * 0.0001, // 简化的坐标转换
      lng: props.location.coordinates.lng + deltaX * 0.0001
    }
    
    emit('dragEnd', props.location, newPosition)
  }

  // 清理状态
  isDragging.value = false
  dragStartPosition.value = null

  // 移除全局事件监听
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

const handleMouseEnter = () => {
  isHovered.value = true
  emit('mouseEnter', props.location)
}

const handleMouseLeave = () => {
  isHovered.value = false
  emit('mouseLeave', props.location)
}

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return `${hours}小时`
  }
  
  return `${hours}小时${remainingMinutes}分钟`
}

// 监听选中状态变化，添加动画效果
watch(() => props.isSelected, (newValue) => {
  if (newValue) {
    // 可以添加选中时的动画效果
  }
})
</script>

<style scoped lang="scss">
.map-marker {
  position: absolute;
  transform: translate(-50%, -100%);
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-50%, -100%) scale(1.1);
  }

  &.marker-selected {
    transform: translate(-50%, -100%) scale(1.2);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }

  &.marker-dragging {
    cursor: grabbing;
    opacity: 0.8;
    transform: translate(-50%, -100%) scale(1.1);
  }

  &.marker-highlighted {
    animation: pulse 2s infinite;
  }

  .marker-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--marker-color);
    border: 2px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

    .el-icon {
      transform: rotate(45deg);
      color: white;
    }
  }

  .marker-label {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 4px;
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    font-size: 12px;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
  }

  .day-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    background: var(--el-color-primary);
    color: white;
    border: 2px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .marker-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
    width: 280px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: 16px;
    pointer-events: none;
    z-index: 10000;

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 8px solid transparent;
      border-top-color: white;
    }

    .tooltip-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;

      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .location-type {
        padding: 2px 8px;
        background: var(--marker-color);
        color: white;
        font-size: 12px;
        border-radius: 12px;
      }
    }

    .tooltip-address {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      color: var(--el-text-color-regular);
      font-size: 14px;

      .el-icon {
        color: var(--el-color-info);
      }
    }

    .tooltip-description {
      color: var(--el-text-color-regular);
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .tooltip-meta {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;

      .duration,
      .day {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--el-text-color-regular);
        font-size: 12px;

        .el-icon {
          color: var(--el-color-info);
        }
      }
    }

    .tooltip-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
  }

  // 不同类型的标记样式
  &.marker-start {
    .marker-icon {
      background: #67C23A;
    }
  }

  &.marker-waypoint {
    .marker-icon {
      background: #409EFF;
    }
  }

  &.marker-end {
    .marker-icon {
      background: #F56C6C;
    }
  }

  // 不同尺寸的标记
  &.size-small {
    .marker-icon {
      width: 24px;
      height: 24px;
    }
  }

  &.size-large {
    .marker-icon {
      width: 40px;
      height: 40px;
    }
  }
}

// 动画效果
@keyframes pulse {
  0% {
    transform: translate(-50%, -100%) scale(1);
  }
  50% {
    transform: translate(-50%, -100%) scale(1.15);
  }
  100% {
    transform: translate(-50%, -100%) scale(1);
  }
}

// 淡入淡出动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .map-marker {
    .marker-tooltip {
      width: 240px;
      padding: 12px;

      .tooltip-header h4 {
        font-size: 14px;
      }

      .tooltip-address,
      .tooltip-description {
        font-size: 12px;
      }
    }
  }
}
</style>
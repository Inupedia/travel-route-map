/**
 * 工具函数
 * Utility helper functions
 */

import { LocationType, TransportMode, type Coordinates, type Location } from '@/types'
import { VALIDATION_RULES, MAP_CONFIG, TRANSPORT_CONFIG } from './constants'

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 格式化日期
 */
export function formatDate(date: Date, format: 'date' | 'datetime' | 'time' = 'datetime'): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }

  if (format === 'datetime' || format === 'time') {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }

  if (format === 'time') {
    delete options.year
    delete options.month
    delete options.day
  }

  return new Intl.DateTimeFormat('zh-CN', options).format(date)
}

/**
 * 计算两点间距离（使用Haversine公式）
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371 // 地球半径（公里）
  const dLat = toRadians(point2.lat - point1.lat)
  const dLng = toRadians(point2.lng - point1.lng)
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 角度转弧度
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * 估算行程时间（分钟）
 */
export function estimateTravelTime(distance: number, mode: TransportMode): number {
  const config = TRANSPORT_CONFIG[mode]
  const timeInHours = distance / config.avgSpeed
  return Math.round(timeInHours * 60)
}

/**
 * 格式化距离显示
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}米`
  }
  return `${distance.toFixed(1)}公里`
}

/**
 * 格式化时间显示
 */
export function formatDuration(minutes: number): string {
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

/**
 * 获取地点类型显示名称
 */
export function getLocationTypeName(type: LocationType): string {
  const typeNames = {
    [LocationType.START]: '出发点',
    [LocationType.WAYPOINT]: '途经点',
    [LocationType.END]: '终点'
  }
  return typeNames[type]
}

/**
 * 获取交通方式显示名称
 */
export function getTransportModeName(mode: TransportMode): string {
  return TRANSPORT_CONFIG[mode].name
}

/**
 * 获取天数对应的颜色
 */
export function getDayColor(dayNumber: number): string {
  const colors = MAP_CONFIG.DAY_COLORS
  return colors[(dayNumber - 1) % colors.length]
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  
  return obj
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func.apply(null, args)
    }, wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastTime >= wait) {
      lastTime = now
      func.apply(null, args)
    }
  }
}

/**
 * 检查是否为有效坐标
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  const { lat, lng } = coords
  const { LAT_MIN, LAT_MAX, LNG_MIN, LNG_MAX } = VALIDATION_RULES.COORDINATES
  
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= LAT_MIN &&
    lat <= LAT_MAX &&
    lng >= LNG_MIN &&
    lng <= LNG_MAX &&
    !isNaN(lat) &&
    !isNaN(lng)
  )
}

/**
 * 检查地点列表中是否已存在指定类型的地点
 */
export function hasLocationOfType(locations: Location[], type: LocationType): boolean {
  return locations.some(location => location.type === type)
}

/**
 * 获取指定类型的地点
 */
export function getLocationsByType(locations: Location[], type: LocationType): Location[] {
  return locations.filter(location => location.type === type)
}

/**
 * 按天数分组地点
 */
export function groupLocationsByDay(locations: Location[]): Record<number, Location[]> {
  return locations.reduce((groups, location) => {
    const day = location.dayNumber || 1
    if (!groups[day]) {
      groups[day] = []
    }
    groups[day].push(location)
    return groups
  }, {} as Record<number, Location[]>)
}

/**
 * 计算总行程距离
 */
export function calculateTotalDistance(routes: Array<{ distance: number }>): number {
  return routes.reduce((total, route) => total + route.distance, 0)
}

/**
 * 计算总行程时间
 */
export function calculateTotalDuration(routes: Array<{ duration: number }>): number {
  return routes.reduce((total, route) => total + route.duration, 0)
}

/**
 * 安全的JSON解析
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString)
  } catch {
    return defaultValue
  }
}

/**
 * 安全的JSON字符串化
 */
export function safeJsonStringify(obj: any): string {
  try {
    return JSON.stringify(obj)
  } catch {
    return '{}'
  }
}

/**
 * 检查浏览器是否支持某个功能
 */
export function checkBrowserSupport() {
  return {
    localStorage: typeof Storage !== 'undefined',
    canvas: !!document.createElement('canvas').getContext,
    geolocation: 'geolocation' in navigator,
    fileReader: typeof FileReader !== 'undefined'
  }
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

/**
 * 检查是否为图片文件
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const extension = getFileExtension(filename).toLowerCase()
  return imageExtensions.includes(extension)
}
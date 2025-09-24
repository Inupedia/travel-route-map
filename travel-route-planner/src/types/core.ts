/**
 * 核心类型定义
 * Core type definitions for the travel route planner
 */

// 地点类型枚举
export enum LocationType {
  START = 'start',
  WAYPOINT = 'waypoint', 
  END = 'end'
}

// 交通方式枚举
export enum TransportMode {
  WALKING = 'walking',
  DRIVING = 'driving',
  TRANSIT = 'transit'
}

// 主题类型
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}

// 地图模式
export enum MapMode {
  VIEW = 'view',
  EDIT = 'edit'
}

// 活动面板类型
export enum ActivePanel {
  LOCATION = 'location',
  ROUTE = 'route', 
  DAY_PLAN = 'day-plan',
  EXPORT = 'export'
}

// 坐标接口
export interface Coordinates {
  lat: number
  lng: number
}

// 地点接口
export interface Location {
  id: string
  name: string
  type: LocationType
  coordinates: Coordinates
  address?: string
  description?: string
  images?: string[]
  tags?: string[]
  dayNumber?: number
  visitDuration?: number // 分钟
  createdAt: Date
  updatedAt: Date
}

// 路线接口
export interface Route {
  id: string
  fromLocationId: string
  toLocationId: string
  distance: number // 公里
  duration: number // 分钟
  transportMode: TransportMode
  path?: Coordinates[]
  dayNumber: number
}

// 规划设置接口
export interface PlanSettings {
  mapCenter: Coordinates
  mapZoom: number
  theme: Theme
  showDistances: boolean
  showDurations: boolean
}

// 旅游规划接口
export interface TravelPlan {
  id: string
  name: string
  description?: string
  totalDays: number
  locations: Location[]
  routes: Route[]
  settings: PlanSettings
  createdAt: Date
  updatedAt: Date
}
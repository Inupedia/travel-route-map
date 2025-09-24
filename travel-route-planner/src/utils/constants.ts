/**
 * 应用常量定义
 * Application constants
 */

import { TransportMode, Theme } from '@/types'

// 应用配置常量
export const APP_CONFIG = {
  NAME: '旅游路线规划器',
  VERSION: '1.0.0',
  DESCRIPTION: '可视化旅游路线规划工具',
  MAX_LOCATIONS: 50,
  MAX_DAYS: 30,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_PLAN_NAME_LENGTH: 100
} as const

// 地图配置常量
export const MAP_CONFIG = {
  DEFAULT_CENTER: {
    lat: 39.9042,
    lng: 116.4074 // 北京天安门
  },
  DEFAULT_ZOOM: 10,
  MIN_ZOOM: 3,
  MAX_ZOOM: 18,
  MARKER_COLORS: {
    start: '#67C23A',    // 绿色
    waypoint: '#409EFF', // 蓝色
    end: '#F56C6C'       // 红色
  },
  DAY_COLORS: [
    '#409EFF', // 蓝色 - 第1天
    '#67C23A', // 绿色 - 第2天
    '#E6A23C', // 橙色 - 第3天
    '#F56C6C', // 红色 - 第4天
    '#909399', // 灰色 - 第5天
    '#9C27B0', // 紫色 - 第6天
    '#FF9800', // 深橙 - 第7天
    '#795548', // 棕色 - 第8天
    '#607D8B', // 蓝灰 - 第9天
    '#4CAF50'  // 深绿 - 第10天
  ]
} as const

// 存储配置常量
export const STORAGE_CONFIG = {
  KEYS: {
    TRAVEL_PLANS: 'travel_plans',
    CURRENT_PLAN: 'current_plan',
    USER_SETTINGS: 'user_settings',
    APP_VERSION: 'app_version'
  },
  MAX_STORAGE_SIZE: 10 * 1024 * 1024, // 10MB
  BACKUP_PREFIX: 'backup_',
  EXPORT_PREFIX: 'export_'
} as const

// 交通方式配置
export const TRANSPORT_CONFIG = {
  [TransportMode.WALKING]: {
    name: '步行',
    icon: 'Walk',
    color: '#67C23A',
    avgSpeed: 5 // km/h
  },
  [TransportMode.DRIVING]: {
    name: '驾车',
    icon: 'Car',
    color: '#409EFF',
    avgSpeed: 60 // km/h
  },
  [TransportMode.TRANSIT]: {
    name: '公交',
    icon: 'Bus',
    color: '#E6A23C',
    avgSpeed: 30 // km/h
  }
} as const

// 主题配置
export const THEME_CONFIG = {
  [Theme.LIGHT]: {
    name: '浅色主题',
    primary: '#409EFF',
    background: '#FFFFFF',
    surface: '#F5F7FA'
  },
  [Theme.DARK]: {
    name: '深色主题',
    primary: '#409EFF',
    background: '#1D1E1F',
    surface: '#2B2C2D'
  }
} as const

// 导出配置
export const EXPORT_CONFIG = {
  FORMATS: {
    PNG: 'image/png',
    JPG: 'image/jpeg'
  },
  DEFAULT_FORMAT: 'PNG',
  QUALITY: 0.9,
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,
  DPI: 300
} as const

// 验证规则常量
export const VALIDATION_RULES = {
  LOCATION_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[\u4e00-\u9fa5a-zA-Z0-9\s\-_()（）]+$/
  },
  PLAN_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: APP_CONFIG.MAX_PLAN_NAME_LENGTH,
    PATTERN: /^[\u4e00-\u9fa5a-zA-Z0-9\s\-_()（）]+$/
  },
  COORDINATES: {
    LAT_MIN: -90,
    LAT_MAX: 90,
    LNG_MIN: -180,
    LNG_MAX: 180
  },
  DAY_NUMBER: {
    MIN: 1,
    MAX: APP_CONFIG.MAX_DAYS
  },
  VISIT_DURATION: {
    MIN: 15, // 最少15分钟
    MAX: 1440 // 最多24小时
  }
} as const

// API配置常量
export const API_CONFIG = {
  TIMEOUT: 10000, // 10秒
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1秒
  ENDPOINTS: {
    GEOCODING: '/api/geocoding',
    ROUTING: '/api/routing',
    PLACES: '/api/places'
  }
} as const

// 动画配置
export const ANIMATION_CONFIG = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500
  },
  EASING: {
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
} as const

// 默认值常量
export const DEFAULT_VALUES = {
  PLAN_SETTINGS: {
    mapCenter: MAP_CONFIG.DEFAULT_CENTER,
    mapZoom: MAP_CONFIG.DEFAULT_ZOOM,
    theme: Theme.LIGHT,
    showDistances: true,
    showDurations: true
  },
  LOCATION: {
    visitDuration: 60, // 1小时
    dayNumber: 1
  },
  ROUTE: {
    transportMode: TransportMode.DRIVING
  }
} as const
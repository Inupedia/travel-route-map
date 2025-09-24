/**
 * 错误类型定义
 * Error type definitions
 */

// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR', 
  STORAGE_ERROR = 'STORAGE_ERROR',
  MAP_ERROR = 'MAP_ERROR',
  EXPORT_ERROR = 'EXPORT_ERROR',
  ROUTE_CALCULATION_ERROR = 'ROUTE_CALCULATION_ERROR',
  LOCATION_ERROR = 'LOCATION_ERROR'
}

// 应用错误接口
export interface AppError {
  type: ErrorType
  message: string
  details?: any
  timestamp: Date
  code?: string
}

// 验证错误接口
export interface ValidationError {
  field: string
  message: string
  value?: any
}

// 错误响应接口
export interface ErrorResponse {
  success: false
  error: AppError
}

// 成功响应接口
export interface SuccessResponse<T = any> {
  success: true
  data: T
}

// 通用响应类型
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse

// 预定义错误消息
export const ERROR_MESSAGES = {
  // 网络错误
  NETWORK_TIMEOUT: '网络请求超时，请检查网络连接',
  NETWORK_UNAVAILABLE: '网络不可用，请检查网络设置',
  
  // 验证错误
  REQUIRED_FIELD: '此字段为必填项',
  INVALID_COORDINATES: '无效的坐标信息',
  INVALID_LOCATION_TYPE: '无效的地点类型',
  DUPLICATE_START_POINT: '只能有一个出发点',
  DUPLICATE_END_POINT: '只能有一个终点',
  INVALID_DAY_NUMBER: '无效的天数设置',
  
  // 存储错误
  STORAGE_QUOTA_EXCEEDED: '存储空间不足，请清理数据',
  STORAGE_ACCESS_DENIED: '无法访问本地存储',
  DATA_CORRUPTION: '数据已损坏，无法读取',
  
  // 地图错误
  MAP_LOAD_FAILED: '地图加载失败',
  MAP_API_ERROR: '地图服务异常',
  GEOCODING_FAILED: '地址解析失败',
  
  // 导出错误
  EXPORT_FAILED: '导出失败，请重试',
  EXPORT_FORMAT_UNSUPPORTED: '不支持的导出格式',
  
  // 路线计算错误
  ROUTE_CALCULATION_FAILED: '路线计算失败',
  NO_ROUTE_FOUND: '未找到可用路线',
  INVALID_ROUTE_POINTS: '路线点无效',
  
  // 地点错误
  LOCATION_NOT_FOUND: '地点不存在',
  LOCATION_SAVE_FAILED: '地点保存失败',
  LOCATION_DELETE_FAILED: '地点删除失败'
} as const

// 错误代码
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'E0000',
  
  // 网络错误 (E1xxx)
  NETWORK_TIMEOUT: 'E1001',
  NETWORK_UNAVAILABLE: 'E1002',
  
  // 验证错误 (E2xxx)
  VALIDATION_FAILED: 'E2001',
  REQUIRED_FIELD_MISSING: 'E2002',
  INVALID_FORMAT: 'E2003',
  DUPLICATE_ENTRY: 'E2004',
  
  // 存储错误 (E3xxx)
  STORAGE_QUOTA_EXCEEDED: 'E3001',
  STORAGE_ACCESS_DENIED: 'E3002',
  DATA_CORRUPTION: 'E3003',
  
  // 地图错误 (E4xxx)
  MAP_LOAD_FAILED: 'E4001',
  MAP_API_ERROR: 'E4002',
  GEOCODING_FAILED: 'E4003',
  
  // 导出错误 (E5xxx)
  EXPORT_FAILED: 'E5001',
  EXPORT_FORMAT_UNSUPPORTED: 'E5002',
  
  // 路线错误 (E6xxx)
  ROUTE_CALCULATION_FAILED: 'E6001',
  NO_ROUTE_FOUND: 'E6002',
  
  // 地点错误 (E7xxx)
  LOCATION_NOT_FOUND: 'E7001',
  LOCATION_SAVE_FAILED: 'E7002'
} as const
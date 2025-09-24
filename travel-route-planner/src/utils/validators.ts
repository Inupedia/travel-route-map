/**
 * 验证器函数
 * Validation functions
 */

import { LocationType, type Location, type Coordinates, type TravelPlan, type Route } from '@/types'
import { type ValidationError, ERROR_MESSAGES } from '@/types/errors'
import { VALIDATION_RULES, APP_CONFIG } from './constants'
import { isValidCoordinates, hasLocationOfType } from './helpers'

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * 创建验证错误
 */
function createValidationError(field: string, message: string, value?: any): ValidationError {
  return { field, message, value }
}

/**
 * 验证地点名称
 */
export function validateLocationName(name: string): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!name || name.trim().length === 0) {
    errors.push(createValidationError('name', ERROR_MESSAGES.REQUIRED_FIELD, name))
  } else {
    const trimmedName = name.trim()
    const { MIN_LENGTH, MAX_LENGTH, PATTERN } = VALIDATION_RULES.LOCATION_NAME
    
    if (trimmedName.length < MIN_LENGTH) {
      errors.push(createValidationError('name', `地点名称至少需要${MIN_LENGTH}个字符`, name))
    }
    
    if (trimmedName.length > MAX_LENGTH) {
      errors.push(createValidationError('name', `地点名称不能超过${MAX_LENGTH}个字符`, name))
    }
    
    if (!PATTERN.test(trimmedName)) {
      errors.push(createValidationError('name', '地点名称包含无效字符', name))
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证坐标
 */
export function validateCoordinates(coordinates: Coordinates): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!coordinates) {
    errors.push(createValidationError('coordinates', ERROR_MESSAGES.REQUIRED_FIELD))
  } else if (!isValidCoordinates(coordinates)) {
    errors.push(createValidationError('coordinates', ERROR_MESSAGES.INVALID_COORDINATES, coordinates))
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证地点类型
 */
export function validateLocationType(type: LocationType): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!type) {
    errors.push(createValidationError('type', ERROR_MESSAGES.REQUIRED_FIELD))
  } else if (!Object.values(LocationType).includes(type)) {
    errors.push(createValidationError('type', ERROR_MESSAGES.INVALID_LOCATION_TYPE, type))
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证天数
 */
export function validateDayNumber(dayNumber: number, totalDays: number): ValidationResult {
  const errors: ValidationError[] = []
  
  if (typeof dayNumber !== 'number' || isNaN(dayNumber)) {
    errors.push(createValidationError('dayNumber', '天数必须是数字', dayNumber))
  } else {
    const { MIN, MAX } = VALIDATION_RULES.DAY_NUMBER
    
    if (dayNumber < MIN) {
      errors.push(createValidationError('dayNumber', `天数不能小于${MIN}`, dayNumber))
    }
    
    if (dayNumber > MAX) {
      errors.push(createValidationError('dayNumber', `天数不能大于${MAX}`, dayNumber))
    }
    
    if (dayNumber > totalDays) {
      errors.push(createValidationError('dayNumber', `天数不能超过总天数${totalDays}`, dayNumber))
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证访问时长
 */
export function validateVisitDuration(duration: number): ValidationResult {
  const errors: ValidationError[] = []
  
  if (typeof duration !== 'number' || isNaN(duration)) {
    errors.push(createValidationError('visitDuration', '访问时长必须是数字', duration))
  } else {
    const { MIN, MAX } = VALIDATION_RULES.VISIT_DURATION
    
    if (duration < MIN) {
      errors.push(createValidationError('visitDuration', `访问时长不能少于${MIN}分钟`, duration))
    }
    
    if (duration > MAX) {
      errors.push(createValidationError('visitDuration', `访问时长不能超过${MAX}分钟`, duration))
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证地点描述
 */
export function validateLocationDescription(description: string): ValidationResult {
  const errors: ValidationError[] = []
  
  if (description && description.length > APP_CONFIG.MAX_DESCRIPTION_LENGTH) {
    errors.push(createValidationError(
      'description', 
      `描述不能超过${APP_CONFIG.MAX_DESCRIPTION_LENGTH}个字符`, 
      description
    ))
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证地点标签
 */
export function validateLocationTags(tags: string[]): ValidationResult {
  const errors: ValidationError[] = []
  
  if (tags && tags.length > 0) {
    tags.forEach((tag, index) => {
      if (!tag || tag.trim().length === 0) {
        errors.push(createValidationError(`tags[${index}]`, '标签不能为空', tag))
      } else if (tag.trim().length > 20) {
        errors.push(createValidationError(`tags[${index}]`, '标签不能超过20个字符', tag))
      }
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证完整地点信息
 */
export function validateLocation(location: Partial<Location>, existingLocations: Location[] = []): ValidationResult {
  const allErrors: ValidationError[] = []
  
  // 验证名称
  if (location.name !== undefined) {
    const nameResult = validateLocationName(location.name)
    allErrors.push(...nameResult.errors)
  }
  
  // 验证坐标
  if (location.coordinates !== undefined) {
    const coordsResult = validateCoordinates(location.coordinates)
    allErrors.push(...coordsResult.errors)
  }
  
  // 验证类型
  if (location.type !== undefined) {
    const typeResult = validateLocationType(location.type)
    allErrors.push(...typeResult.errors)
    
    // 检查是否违反唯一性约束
    if (typeResult.isValid && (location.type === LocationType.START || location.type === LocationType.END)) {
      const hasExisting = hasLocationOfType(existingLocations, location.type)
      if (hasExisting) {
        const message = location.type === LocationType.START 
          ? ERROR_MESSAGES.DUPLICATE_START_POINT 
          : ERROR_MESSAGES.DUPLICATE_END_POINT
        allErrors.push(createValidationError('type', message, location.type))
      }
    }
  }
  
  // 验证天数
  if (location.dayNumber !== undefined && location.dayNumber !== null) {
    // 这里假设最大天数为30，实际应该从规划中获取
    const dayResult = validateDayNumber(location.dayNumber, 30)
    allErrors.push(...dayResult.errors)
  }
  
  // 验证访问时长
  if (location.visitDuration !== undefined && location.visitDuration !== null) {
    const durationResult = validateVisitDuration(location.visitDuration)
    allErrors.push(...durationResult.errors)
  }
  
  // 验证描述
  if (location.description !== undefined) {
    const descResult = validateLocationDescription(location.description)
    allErrors.push(...descResult.errors)
  }
  
  // 验证标签
  if (location.tags !== undefined) {
    const tagsResult = validateLocationTags(location.tags)
    allErrors.push(...tagsResult.errors)
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  }
}

/**
 * 验证规划名称
 */
export function validatePlanName(name: string): ValidationResult {
  const errors: ValidationError[] = []
  
  if (!name || name.trim().length === 0) {
    errors.push(createValidationError('name', ERROR_MESSAGES.REQUIRED_FIELD, name))
  } else {
    const trimmedName = name.trim()
    const { MIN_LENGTH, MAX_LENGTH, PATTERN } = VALIDATION_RULES.PLAN_NAME
    
    if (trimmedName.length < MIN_LENGTH) {
      errors.push(createValidationError('name', `规划名称至少需要${MIN_LENGTH}个字符`, name))
    }
    
    if (trimmedName.length > MAX_LENGTH) {
      errors.push(createValidationError('name', `规划名称不能超过${MAX_LENGTH}个字符`, name))
    }
    
    if (!PATTERN.test(trimmedName)) {
      errors.push(createValidationError('name', '规划名称包含无效字符', name))
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证总天数
 */
export function validateTotalDays(totalDays: number): ValidationResult {
  const errors: ValidationError[] = []
  
  if (typeof totalDays !== 'number' || isNaN(totalDays)) {
    errors.push(createValidationError('totalDays', '总天数必须是数字', totalDays))
  } else {
    if (totalDays < 1) {
      errors.push(createValidationError('totalDays', '总天数不能少于1天', totalDays))
    }
    
    if (totalDays > APP_CONFIG.MAX_DAYS) {
      errors.push(createValidationError('totalDays', `总天数不能超过${APP_CONFIG.MAX_DAYS}天`, totalDays))
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证路线
 */
export function validateRoute(route: Partial<Route>, locations: Location[]): ValidationResult {
  const errors: ValidationError[] = []
  
  // 验证起点和终点ID
  if (!route.fromLocationId) {
    errors.push(createValidationError('fromLocationId', '起点ID不能为空'))
  } else if (!locations.find(loc => loc.id === route.fromLocationId)) {
    errors.push(createValidationError('fromLocationId', '起点不存在', route.fromLocationId))
  }
  
  if (!route.toLocationId) {
    errors.push(createValidationError('toLocationId', '终点ID不能为空'))
  } else if (!locations.find(loc => loc.id === route.toLocationId)) {
    errors.push(createValidationError('toLocationId', '终点不存在', route.toLocationId))
  }
  
  // 验证距离
  if (route.distance !== undefined) {
    if (typeof route.distance !== 'number' || isNaN(route.distance) || route.distance < 0) {
      errors.push(createValidationError('distance', '距离必须是非负数', route.distance))
    }
  }
  
  // 验证时长
  if (route.duration !== undefined) {
    if (typeof route.duration !== 'number' || isNaN(route.duration) || route.duration < 0) {
      errors.push(createValidationError('duration', '时长必须是非负数', route.duration))
    }
  }
  
  // 验证天数
  if (route.dayNumber !== undefined) {
    const dayResult = validateDayNumber(route.dayNumber, 30)
    errors.push(...dayResult.errors)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证完整的旅游规划
 */
export function validateTravelPlan(plan: Partial<TravelPlan>): ValidationResult {
  const allErrors: ValidationError[] = []
  
  // 验证规划名称
  if (plan.name !== undefined) {
    const nameResult = validatePlanName(plan.name)
    allErrors.push(...nameResult.errors)
  }
  
  // 验证总天数
  if (plan.totalDays !== undefined) {
    const daysResult = validateTotalDays(plan.totalDays)
    allErrors.push(...daysResult.errors)
  }
  
  // 验证地点列表
  if (plan.locations && plan.locations.length > 0) {
    if (plan.locations.length > APP_CONFIG.MAX_LOCATIONS) {
      allErrors.push(createValidationError(
        'locations', 
        `地点数量不能超过${APP_CONFIG.MAX_LOCATIONS}个`, 
        plan.locations.length
      ))
    }
    
    // 验证每个地点
    plan.locations.forEach((location, index) => {
      const locationResult = validateLocation(location, plan.locations!)
      locationResult.errors.forEach(error => {
        allErrors.push({
          ...error,
          field: `locations[${index}].${error.field}`
        })
      })
    })
    
    // 检查是否有出发点和终点
    const hasStart = hasLocationOfType(plan.locations, LocationType.START)
    const hasEnd = hasLocationOfType(plan.locations, LocationType.END)
    
    if (plan.locations.length > 1 && !hasStart) {
      allErrors.push(createValidationError('locations', '必须设置一个出发点'))
    }
    
    if (plan.locations.length > 1 && !hasEnd) {
      allErrors.push(createValidationError('locations', '必须设置一个终点'))
    }
  }
  
  // 验证路线列表
  if (plan.routes && plan.routes.length > 0 && plan.locations) {
    plan.routes.forEach((route, index) => {
      const routeResult = validateRoute(route, plan.locations!)
      routeResult.errors.forEach(error => {
        allErrors.push({
          ...error,
          field: `routes[${index}].${error.field}`
        })
      })
    })
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  }
}

/**
 * 验证图片文件
 */
export function validateImageFile(file: File): ValidationResult {
  const errors: ValidationError[] = []
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    errors.push(createValidationError('file', '只能上传图片文件', file.type))
  }
  
  // 检查文件大小
  if (file.size > APP_CONFIG.MAX_IMAGE_SIZE) {
    const maxSizeMB = APP_CONFIG.MAX_IMAGE_SIZE / (1024 * 1024)
    errors.push(createValidationError('file', `图片大小不能超过${maxSizeMB}MB`, file.size))
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
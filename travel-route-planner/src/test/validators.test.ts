/**
 * 验证器测试
 * Validators tests
 */

import { describe, it, expect } from 'vitest'
import {
  validateLocationName,
  validateCoordinates,
  validateLocationType,
  validateDayNumber,
  validateVisitDuration,
  validateLocation,
  validatePlanName,
  validateTotalDays
} from '@/utils/validators'
import { LocationType } from '@/types'

describe('Validators', () => {
  describe('validateLocationName', () => {
    it('should validate correct location name', () => {
      const result = validateLocationName('北京天安门')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty name', () => {
      const result = validateLocationName('')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('name')
    })

    it('should reject name that is too long', () => {
      const longName = 'a'.repeat(100)
      const result = validateLocationName(longName)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('不能超过')
    })
  })

  describe('validateCoordinates', () => {
    it('should validate correct coordinates', () => {
      const result = validateCoordinates({ lat: 39.9042, lng: 116.4074 })
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid latitude', () => {
      const result = validateCoordinates({ lat: 100, lng: 116.4074 })
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('无效的坐标')
    })

    it('should reject invalid longitude', () => {
      const result = validateCoordinates({ lat: 39.9042, lng: 200 })
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('无效的坐标')
    })
  })

  describe('validateLocationType', () => {
    it('should validate correct location type', () => {
      const result = validateLocationType(LocationType.START)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid location type', () => {
      const result = validateLocationType('invalid' as LocationType)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('无效的地点类型')
    })
  })

  describe('validateDayNumber', () => {
    it('should validate correct day number', () => {
      const result = validateDayNumber(3, 7)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject day number less than 1', () => {
      const result = validateDayNumber(0, 7)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('不能小于')
    })

    it('should reject day number greater than total days', () => {
      const result = validateDayNumber(10, 7)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('不能超过总天数')
    })
  })

  describe('validateVisitDuration', () => {
    it('should validate correct visit duration', () => {
      const result = validateVisitDuration(60)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject duration less than minimum', () => {
      const result = validateVisitDuration(10)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('不能少于')
    })

    it('should reject duration greater than maximum', () => {
      const result = validateVisitDuration(2000)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('不能超过')
    })
  })

  describe('validateLocation', () => {
    it('should validate complete location', () => {
      const location = {
        name: '北京天安门',
        type: LocationType.START,
        coordinates: { lat: 39.9042, lng: 116.4074 },
        dayNumber: 1,
        visitDuration: 60,
        description: '天安门广场',
        tags: ['历史', '文化']
      }

      const result = validateLocation(location)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect duplicate start points', () => {
      const existingLocations = [{
        id: 'existing',
        name: '已存在的出发点',
        type: LocationType.START,
        coordinates: { lat: 39.9042, lng: 116.4074 },
        createdAt: new Date(),
        updatedAt: new Date()
      }]

      const newLocation = {
        name: '新的出发点',
        type: LocationType.START,
        coordinates: { lat: 40.0042, lng: 116.5074 }
      }

      const result = validateLocation(newLocation, existingLocations)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.message.includes('只能有一个出发点'))).toBe(true)
    })
  })

  describe('validatePlanName', () => {
    it('should validate correct plan name', () => {
      const result = validatePlanName('北京三日游')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty plan name', () => {
      const result = validatePlanName('')
      expect(result.isValid).toBe(false)
      expect(result.errors[0].field).toBe('name')
    })
  })

  describe('validateTotalDays', () => {
    it('should validate correct total days', () => {
      const result = validateTotalDays(7)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject zero days', () => {
      const result = validateTotalDays(0)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('不能少于1天')
    })

    it('should reject too many days', () => {
      const result = validateTotalDays(50)
      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('不能超过')
    })
  })
})
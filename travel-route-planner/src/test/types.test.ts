/**
 * 类型定义测试
 * Type definitions tests
 */

import { describe, it, expect } from 'vitest'
import {
  LocationType,
  TransportMode,
  Theme,
  MapMode,
  ActivePanel,
  type Location,
  type Route,
  type TravelPlan,
  type Coordinates
} from '@/types'

describe('Core Types', () => {
  it('should have correct LocationType enum values', () => {
    expect(LocationType.START).toBe('start')
    expect(LocationType.WAYPOINT).toBe('waypoint')
    expect(LocationType.END).toBe('end')
  })

  it('should have correct TransportMode enum values', () => {
    expect(TransportMode.WALKING).toBe('walking')
    expect(TransportMode.DRIVING).toBe('driving')
    expect(TransportMode.TRANSIT).toBe('transit')
  })

  it('should have correct Theme enum values', () => {
    expect(Theme.LIGHT).toBe('light')
    expect(Theme.DARK).toBe('dark')
  })

  it('should create valid Location object', () => {
    const location: Location = {
      id: 'test-id',
      name: '测试地点',
      type: LocationType.START,
      coordinates: { lat: 39.9042, lng: 116.4074 },
      address: '北京市东城区',
      description: '测试描述',
      images: ['image1.jpg'],
      tags: ['标签1', '标签2'],
      dayNumber: 1,
      visitDuration: 60,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    expect(location.name).toBe('测试地点')
    expect(location.type).toBe(LocationType.START)
    expect(location.coordinates.lat).toBe(39.9042)
    expect(location.coordinates.lng).toBe(116.4074)
  })

  it('should create valid Route object', () => {
    const route: Route = {
      id: 'route-id',
      fromLocationId: 'from-id',
      toLocationId: 'to-id',
      distance: 10.5,
      duration: 30,
      transportMode: TransportMode.DRIVING,
      path: [
        { lat: 39.9042, lng: 116.4074 },
        { lat: 39.9142, lng: 116.4174 }
      ],
      dayNumber: 1
    }

    expect(route.distance).toBe(10.5)
    expect(route.duration).toBe(30)
    expect(route.transportMode).toBe(TransportMode.DRIVING)
    expect(route.path).toHaveLength(2)
  })

  it('should create valid TravelPlan object', () => {
    const plan: TravelPlan = {
      id: 'plan-id',
      name: '北京三日游',
      description: '北京旅游规划',
      totalDays: 3,
      locations: [],
      routes: [],
      settings: {
        mapCenter: { lat: 39.9042, lng: 116.4074 },
        mapZoom: 10,
        theme: Theme.LIGHT,
        showDistances: true,
        showDurations: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    expect(plan.name).toBe('北京三日游')
    expect(plan.totalDays).toBe(3)
    expect(plan.settings.theme).toBe(Theme.LIGHT)
  })
})
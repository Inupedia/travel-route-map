/**
 * 服务层入口文件
 * 统一导出所有服务
 */

export { StorageService, storageService } from './storageService'
export { RouteCalculator, routeCalculator } from './routeCalculator'
export {
    MapService,
    AMapService,
    MapServiceFactory,
    mapService,
    type MapOptions,
    type MarkerOptions,
    type RouteOptions,
    type MapEvents
} from './mapService'

export type { TransportMode, RouteCalculationResult } from './routeCalculator'
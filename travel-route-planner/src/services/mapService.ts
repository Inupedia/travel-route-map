import type { Location, Route } from '@/types'

/**
 * 地图配置选项
 */
export interface MapOptions {
    container: HTMLElement | string
    center: { lat: number; lng: number }
    zoom: number
    style?: 'normal' | 'satellite' | 'terrain'
    controls?: {
        zoom?: boolean
        scale?: boolean
        fullscreen?: boolean
    }
}

/**
 * 标记点选项
 */
export interface MarkerOptions {
    position: { lat: number; lng: number }
    title?: string
    icon?: string
    draggable?: boolean
    onClick?: () => void
    onDragEnd?: (position: { lat: number; lng: number }) => void
}

/**
 * 路线绘制选项
 */
export interface RouteOptions {
    path: Array<{ lat: number; lng: number }>
    color?: string
    width?: number
    opacity?: number
    dashArray?: number[]
}

/**
 * 地图事件类型
 */
export interface MapEvents {
    click: (event: { lat: number; lng: number }) => void
    zoom: (zoom: number) => void
    move: (center: { lat: number; lng: number }) => void
}

/**
 * 地图服务抽象接口
 * 定义了地图操作的标准接口，可以适配不同的地图提供商
 */
export abstract class MapService {
    protected mapInstance: any = null
    protected markers: Map<string, any> = new Map()
    protected routes: Map<string, any> = new Map()
    protected eventListeners: Map<keyof MapEvents, Function[]> = new Map()

    /**
     * 初始化地图
     */
    abstract initializeMap(options: MapOptions): Promise<void>

    /**
     * 销毁地图实例
     */
    abstract destroyMap(): void

    /**
     * 设置地图中心点
     */
    abstract setCenter(center: { lat: number; lng: number }): void

    /**
     * 获取地图中心点
     */
    abstract getCenter(): { lat: number; lng: number }

    /**
     * 设置地图缩放级别
     */
    abstract setZoom(zoom: number): void

    /**
     * 获取地图缩放级别
     */
    abstract getZoom(): number

    /**
     * 添加标记点
     */
    abstract addMarker(id: string, options: MarkerOptions): void

    /**
     * 移除标记点
     */
    abstract removeMarker(id: string): void

    /**
     * 更新标记点
     */
    abstract updateMarker(id: string, options: Partial<MarkerOptions>): void

    /**
     * 绘制路线
     */
    abstract drawRoute(id: string, options: RouteOptions): void

    /**
     * 移除路线
     */
    abstract removeRoute(id: string): void

    /**
     * 清除所有标记点
     */
    abstract clearMarkers(): void

    /**
     * 清除所有路线
     */
    abstract clearRoutes(): void

    /**
     * 适应视图以显示所有标记点
     */
    abstract fitBounds(locations: Array<{ lat: number; lng: number }>): void

    /**
     * 添加事件监听器
     */
    abstract addEventListener<K extends keyof MapEvents>(
        event: K,
        callback: MapEvents[K]
    ): void

    /**
     * 移除事件监听器
     */
    abstract removeEventListener<K extends keyof MapEvents>(
        event: K,
        callback: MapEvents[K]
    ): void

    /**
     * 获取地图实例
     */
    getMapInstance(): any {
        return this.mapInstance
    }

    /**
     * 检查地图是否已初始化
     */
    isInitialized(): boolean {
        return this.mapInstance !== null
    }
}

/**
 * 高德地图服务实现
 */
export class AMapService extends MapService {
    private AMap: any = null

    async initializeMap(options: MapOptions): Promise<void> {
        try {
            // 动态加载高德地图API
            if (!window.AMap) {
                await this.loadAMapScript()
            }

            this.AMap = window.AMap

            const container = typeof options.container === 'string'
                ? document.getElementById(options.container)
                : options.container

            if (!container) {
                throw new Error('地图容器不存在')
            }

            this.mapInstance = new this.AMap.Map(container, {
                center: [options.center.lng, options.center.lat],
                zoom: options.zoom,
                mapStyle: this.getAMapStyle(options.style),
                features: ['bg', 'road', 'building', 'point'],
                viewMode: '2D'
            })

            // 添加控件
            if (options.controls?.zoom !== false) {
                this.mapInstance.addControl(new this.AMap.ToolBar())
            }

            if (options.controls?.scale !== false) {
                this.mapInstance.addControl(new this.AMap.Scale())
            }

            // 绑定事件
            this.bindMapEvents()

        } catch (error) {
            throw new Error(`地图初始化失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    private async loadAMapScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            // 检查是否已经加载过
            if (window.AMap) {
                resolve()
                return
            }

            const script = document.createElement('script')
            const apiKey = import.meta.env.VITE_AMAP_KEY || 'your-amap-key'
            script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.ToolBar,AMap.Scale,AMap.Driving,AMap.Walking,AMap.Transfer`
            script.onload = () => {
                // 等待AMap完全加载
                if (window.AMap) {
                    resolve()
                } else {
                    reject(new Error('高德地图API加载失败'))
                }
            }
            script.onerror = () => reject(new Error('高德地图API加载失败'))
            document.head.appendChild(script)
        })
    }

    private getAMapStyle(style?: string): string {
        const styleMap = {
            normal: 'amap://styles/normal',
            satellite: 'amap://styles/satellite',
            terrain: 'amap://styles/terrain'
        }
        return styleMap[style as keyof typeof styleMap] || styleMap.normal
    }

    private bindMapEvents(): void {
        if (!this.mapInstance) return

        this.mapInstance.on('click', (e: any) => {
            const callbacks = this.eventListeners.get('click') || []
            callbacks.forEach(callback => {
                callback({ lat: e.lnglat.lat, lng: e.lnglat.lng })
            })
        })

        this.mapInstance.on('zoomend', () => {
            const callbacks = this.eventListeners.get('zoom') || []
            const zoom = this.mapInstance.getZoom()
            callbacks.forEach(callback => callback(zoom))
        })

        this.mapInstance.on('moveend', () => {
            const callbacks = this.eventListeners.get('move') || []
            const center = this.mapInstance.getCenter()
            callbacks.forEach(callback => {
                callback({ lat: center.lat, lng: center.lng })
            })
        })
    }

    destroyMap(): void {
        if (this.mapInstance) {
            this.mapInstance.destroy()
            this.mapInstance = null
            this.markers.clear()
            this.routes.clear()
            this.eventListeners.clear()
        }
    }

    setCenter(center: { lat: number; lng: number }): void {
        if (this.mapInstance) {
            this.mapInstance.setCenter([center.lng, center.lat])
        }
    }

    getCenter(): { lat: number; lng: number } {
        if (!this.mapInstance) return { lat: 0, lng: 0 }

        const center = this.mapInstance.getCenter()
        return { lat: center.lat, lng: center.lng }
    }

    setZoom(zoom: number): void {
        if (this.mapInstance) {
            this.mapInstance.setZoom(zoom)
        }
    }

    getZoom(): number {
        return this.mapInstance ? this.mapInstance.getZoom() : 10
    }

    addMarker(id: string, options: MarkerOptions): void {
        if (!this.mapInstance || !this.AMap) return

        const marker = new this.AMap.Marker({
            position: [options.position.lng, options.position.lat],
            title: options.title,
            draggable: options.draggable || false
        })

        if (options.onClick) {
            marker.on('click', options.onClick)
        }

        if (options.onDragEnd) {
            marker.on('dragend', (e: any) => {
                const position = e.target.getPosition()
                options.onDragEnd!({ lat: position.lat, lng: position.lng })
            })
        }

        marker.setMap(this.mapInstance)
        this.markers.set(id, marker)
    }

    removeMarker(id: string): void {
        const marker = this.markers.get(id)
        if (marker) {
            marker.setMap(null)
            this.markers.delete(id)
        }
    }

    updateMarker(id: string, options: Partial<MarkerOptions>): void {
        const marker = this.markers.get(id)
        if (!marker) return

        if (options.position) {
            marker.setPosition([options.position.lng, options.position.lat])
        }

        if (options.title) {
            marker.setTitle(options.title)
        }
    }

    drawRoute(id: string, options: RouteOptions): void {
        if (!this.mapInstance || !this.AMap) return

        const path = options.path.map(point => [point.lng, point.lat])

        const polyline = new this.AMap.Polyline({
            path,
            strokeColor: options.color || '#3366FF',
            strokeWeight: options.width || 4,
            strokeOpacity: options.opacity || 0.8,
            strokeStyle: options.dashArray ? 'dashed' : 'solid'
        })

        polyline.setMap(this.mapInstance)
        this.routes.set(id, polyline)
    }

    removeRoute(id: string): void {
        const route = this.routes.get(id)
        if (route) {
            route.setMap(null)
            this.routes.delete(id)
        }
    }

    clearMarkers(): void {
        this.markers.forEach(marker => marker.setMap(null))
        this.markers.clear()
    }

    clearRoutes(): void {
        this.routes.forEach(route => route.setMap(null))
        this.routes.clear()
    }

    fitBounds(locations: Array<{ lat: number; lng: number }>): void {
        if (!this.mapInstance || locations.length === 0) return

        const bounds = locations.map(loc => [loc.lng, loc.lat])
        this.mapInstance.setFitView(bounds)
    }

    addEventListener<K extends keyof MapEvents>(
        event: K,
        callback: MapEvents[K]
    ): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, [])
        }
        this.eventListeners.get(event)!.push(callback)
    }

    removeEventListener<K extends keyof MapEvents>(
        event: K,
        callback: MapEvents[K]
    ): void {
        const callbacks = this.eventListeners.get(event)
        if (callbacks) {
            const index = callbacks.indexOf(callback)
            if (index > -1) {
                callbacks.splice(index, 1)
            }
        }
    }
}

/**
 * 地图服务工厂
 */
export class MapServiceFactory {
    static createMapService(provider: 'amap' | 'baidu' = 'amap'): MapService {
        switch (provider) {
            case 'amap':
                return new AMapService()
            case 'baidu':
                // TODO: 实现百度地图服务
                throw new Error('百度地图服务尚未实现')
            default:
                throw new Error(`不支持的地图提供商: ${provider}`)
        }
    }
}

// 创建默认地图服务实例
export const mapService = MapServiceFactory.createMapService('amap')

// 扩展Window接口以支持地图API
declare global {
    interface Window {
        AMap: any
        BMap: any
    }
}
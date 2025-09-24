import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AMapService, MapServiceFactory } from '@/services/mapService'
import type { MapOptions, MarkerOptions, RouteOptions } from '@/services/mapService'

// Mock AMap API
const mockAMap = {
    Map: vi.fn().mockImplementation(() => ({
        addControl: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn(),
        setCenter: vi.fn(),
        getCenter: vi.fn().mockReturnValue({ lat: 39.9042, lng: 116.4074 }),
        setZoom: vi.fn(),
        getZoom: vi.fn().mockReturnValue(10),
        setFitView: vi.fn()
    })),
    Marker: vi.fn().mockImplementation(() => ({
        on: vi.fn(),
        setMap: vi.fn(),
        setPosition: vi.fn(),
        setTitle: vi.fn(),
        getPosition: vi.fn().mockReturnValue({ lat: 39.9042, lng: 116.4074 })
    })),
    Polyline: vi.fn().mockImplementation(() => ({
        setMap: vi.fn()
    })),
    ToolBar: vi.fn(),
    Scale: vi.fn()
}

// Mock global window.AMap
Object.defineProperty(window, 'AMap', {
    value: mockAMap,
    writable: true
})

// Mock import.meta.env
vi.mock('import.meta.env', () => ({
    VITE_AMAP_KEY: 'test-amap-key'
}))

describe('MapService', () => {
    describe('AMapService', () => {
        let mapService: AMapService
        let mockContainer: HTMLElement

        beforeEach(() => {
            mapService = new AMapService()
            mockContainer = document.createElement('div')
            mockContainer.id = 'map-container'
            document.body.appendChild(mockContainer)

            vi.clearAllMocks()
        })

        afterEach(() => {
            document.body.removeChild(mockContainer)
        })

        describe('initializeMap', () => {
            it('应该成功初始化地图', async () => {
                const options: MapOptions = {
                    container: mockContainer,
                    center: { lat: 39.9042, lng: 116.4074 },
                    zoom: 10,
                    style: 'normal'
                }

                await mapService.initializeMap(options)

                expect(mockAMap.Map).toHaveBeenCalledWith(
                    mockContainer,
                    expect.objectContaining({
                        center: [116.4074, 39.9042],
                        zoom: 10,
                        mapStyle: 'amap://styles/normal'
                    })
                )
                expect(mapService.isInitialized()).toBe(true)
            })

            it('应该使用字符串容器ID初始化地图', async () => {
                const options: MapOptions = {
                    container: 'map-container',
                    center: { lat: 39.9042, lng: 116.4074 },
                    zoom: 10
                }

                await mapService.initializeMap(options)

                expect(mockAMap.Map).toHaveBeenCalledWith(
                    mockContainer,
                    expect.any(Object)
                )
            })

            it('应该在容器不存在时抛出错误', async () => {
                const options: MapOptions = {
                    container: 'non-existent-container',
                    center: { lat: 39.9042, lng: 116.4074 },
                    zoom: 10
                }

                await expect(mapService.initializeMap(options)).rejects.toThrow('地图容器不存在')
            })

            it('应该添加默认控件', async () => {
                const options: MapOptions = {
                    container: mockContainer,
                    center: { lat: 39.9042, lng: 116.4074 },
                    zoom: 10
                }

                await mapService.initializeMap(options)

                const mapInstance = mapService.getMapInstance()
                expect(mapInstance.addControl).toHaveBeenCalledTimes(2) // ToolBar and Scale
            })

            it('应该根据配置选择性添加控件', async () => {
                const options: MapOptions = {
                    container: mockContainer,
                    center: { lat: 39.9042, lng: 116.4074 },
                    zoom: 10,
                    controls: {
                        zoom: false,
                        scale: true
                    }
                }

                await mapService.initializeMap(options)

                const mapInstance = mapService.getMapInstance()
                expect(mapInstance.addControl).toHaveBeenCalledTimes(1) // Only Scale
            })
        })

        describe('destroyMap', () => {
            it('应该销毁地图实例并清理资源', async () => {
                const options: MapOptions = {
                    container: mockContainer,
                    center: { lat: 39.9042, lng: 116.4074 },
                    zoom: 10
                }

                await mapService.initializeMap(options)
                const mapInstance = mapService.getMapInstance()

                mapService.destroyMap()

                expect(mapInstance.destroy).toHaveBeenCalled()
                expect(mapService.isInitialized()).toBe(false)
            })
        })

        describe('地图操作方法', () => {
            beforeEach(async () => {
                const options: MapOptions = {
                    container: mockContainer,
                    center: { lat: 39.9042, lng: 116.4074 },
                    zoom: 10
                }
                await mapService.initializeMap(options)
            })

            describe('setCenter', () => {
                it('应该设置地图中心点', () => {
                    const center = { lat: 40.0000, lng: 116.0000 }

                    mapService.setCenter(center)

                    const mapInstance = mapService.getMapInstance()
                    expect(mapInstance.setCenter).toHaveBeenCalledWith([116.0000, 40.0000])
                })
            })

            describe('getCenter', () => {
                it('应该获取地图中心点', () => {
                    const center = mapService.getCenter()

                    expect(center).toEqual({ lat: 39.9042, lng: 116.4074 })
                })
            })

            describe('setZoom', () => {
                it('应该设置地图缩放级别', () => {
                    mapService.setZoom(15)

                    const mapInstance = mapService.getMapInstance()
                    expect(mapInstance.setZoom).toHaveBeenCalledWith(15)
                })
            })

            describe('getZoom', () => {
                it('应该获取地图缩放级别', () => {
                    const zoom = mapService.getZoom()

                    expect(zoom).toBe(10)
                })
            })
        })

        describe('标记点操作', () => {
            beforeEach(async () => {
                const options: MapOptions = {
                    container: mockContainer,
                    center: { lat: 39.9042, lng: 116.4074 },
                    zoom: 10
                }
                await mapService.initializeMap(options)
            })

            describe('addMarker', () => {
                it('应该添加标记点', () => {
                    const markerOptions: MarkerOptions = {
                        position: { lat: 39.9042, lng: 116.4074 },
                        title: '测试标记',
                        draggable: true
                    }

                    mapService.addMarker('marker-1', markerOptions)

                    expect(mockAMap.Marker).toHaveBeenCalledWith({
                        position: [116.4074, 39.9042],
                        title: '测试标记',
                        draggable: true
                    })
                })

                it('应该绑定点击事件', () => {
                    const onClick = vi.fn()
                    const markerOptions: MarkerOptions = {
                        position: { lat: 39.9042, lng: 116.4074 },
                        onClick
                    }

                    mapService.addMarker('marker-1', markerOptions)

                    const markerInstance = mockAMap.Marker.mock.results[0].value
                    expect(markerInstance.on).toHaveBeenCalledWith('click', onClick)
                })

                it('应该绑定拖拽结束事件', () => {
                    const onDragEnd = vi.fn()
                    const markerOptions: MarkerOptions = {
                        position: { lat: 39.9042, lng: 116.4074 },
                        onDragEnd
                    }

                    mapService.addMarker('marker-1', markerOptions)

                    const markerInstance = mockAMap.Marker.mock.results[0].value
                    expect(markerInstance.on).toHaveBeenCalledWith('dragend', expect.any(Function))
                })
            })

            describe('removeMarker', () => {
                it('应该移除标记点', () => {
                    const markerOptions: MarkerOptions = {
                        position: { lat: 39.9042, lng: 116.4074 }
                    }

                    mapService.addMarker('marker-1', markerOptions)
                    mapService.removeMarker('marker-1')

                    const markerInstance = mockAMap.Marker.mock.results[0].value
                    expect(markerInstance.setMap).toHaveBeenCalledWith(null)
                })
            })

            describe('updateMarker', () => {
                it('应该更新标记点位置', () => {
                    const markerOptions: MarkerOptions = {
                        position: { lat: 39.9042, lng: 116.4074 }
                    }

                    mapService.addMarker('marker-1', markerOptions)
                    mapService.updateMarker('marker-1', {
                        position: { lat: 40.0000, lng: 116.0000 }
                    })

                    const markerInstance = mockAMap.Marker.mock.results[0].value
                    expect(markerInstance.setPosition).toHaveBeenCalledWith([116.0000, 40.0000])
                })

                it('应该更新标记点标题', () => {
                    const markerOptions: MarkerOptions = {
                        position: { lat: 39.9042, lng: 116.4074 }
                    }

                    mapService.addMarker('marker-1', markerOptions)
                    mapService.updateMarker('marker-1', {
                        title: '新标题'
                    })

                    const markerInstance = mockAMap.Marker.mock.results[0].value
                    expect(markerInstance.setTitle).toHaveBeenCalledWith('新标题')
                })
            })

            describe('clearMarkers', () => {
                it('应该清除所有标记点', () => {
                    const markerOptions: MarkerOptions = {
                        position: { lat: 39.9042, lng: 116.4074 }
                    }

                    mapService.addMarker('marker-1', markerOptions)
                    mapService.addMarker('marker-2', markerOptions)
                    mapService.clearMarkers()

                    const markerInstances = mockAMap.Marker.mock.results.map(result => result.value)
                    markerInstances.forEach(marker => {
                        expect(marker.setMap).toHaveBeenCalledWith(null)
                    })
                })
            })
        })

        describe('路线操作', () => {
            beforeEach(async () => {
                const options: MapOptions = {
                    container: mockContainer,
                    center: { lat: 39.9042, lng: 116.4074 },
                    zoom: 10
                }
                await mapService.initializeMap(options)
            })

            describe('drawRoute', () => {
                it('应该绘制路线', () => {
                    const routeOptions: RouteOptions = {
                        path: [
                            { lat: 39.9042, lng: 116.4074 },
                            { lat: 39.9163, lng: 116.3972 }
                        ],
                        color: '#FF0000',
                        width: 5,
                        opacity: 0.8
                    }

                    mapService.drawRoute('route-1', routeOptions)

                    expect(mockAMap.Polyline).toHaveBeenCalledWith({
                        path: [[116.4074, 39.9042], [116.3972, 39.9163]],
                        strokeColor: '#FF0000',
                        strokeWeight: 5,
                        strokeOpacity: 0.8,
                        strokeStyle: 'solid'
                    })
                })

                it('应该使用默认样式绘制路线', () => {
                    const routeOptions: RouteOptions = {
                        path: [
                            { lat: 39.9042, lng: 116.4074 },
                            { lat: 39.9163, lng: 116.3972 }
                        ]
                    }

                    mapService.drawRoute('route-1', routeOptions)

                    expect(mockAMap.Polyline).toHaveBeenCalledWith({
                        path: [[116.4074, 39.9042], [116.3972, 39.9163]],
                        strokeColor: '#3366FF',
                        strokeWeight: 4,
                        strokeOpacity: 0.8,
                        strokeStyle: 'solid'
                    })
                })

                it('应该绘制虚线路线', () => {
                    const routeOptions: RouteOptions = {
                        path: [
                            { lat: 39.9042, lng: 116.4074 },
                            { lat: 39.9163, lng: 116.3972 }
                        ],
                        dashArray: [5, 5]
                    }

                    mapService.drawRoute('route-1', routeOptions)

                    expect(mockAMap.Polyline).toHaveBeenCalledWith(
                        expect.objectContaining({
                            strokeStyle: 'dashed'
                        })
                    )
                })
            })

            describe('removeRoute', () => {
                it('应该移除路线', () => {
                    const routeOptions: RouteOptions = {
                        path: [
                            { lat: 39.9042, lng: 116.4074 },
                            { lat: 39.9163, lng: 116.3972 }
                        ]
                    }

                    mapService.drawRoute('route-1', routeOptions)
                    mapService.removeRoute('route-1')

                    const routeInstance = mockAMap.Polyline.mock.results[0].value
                    expect(routeInstance.setMap).toHaveBeenCalledWith(null)
                })
            })

            describe('clearRoutes', () => {
                it('应该清除所有路线', () => {
                    const routeOptions: RouteOptions = {
                        path: [
                            { lat: 39.9042, lng: 116.4074 },
                            { lat: 39.9163, lng: 116.3972 }
                        ]
                    }

                    mapService.drawRoute('route-1', routeOptions)
                    mapService.drawRoute('route-2', routeOptions)
                    mapService.clearRoutes()

                    const routeInstances = mockAMap.Polyline.mock.results.map(result => result.value)
                    routeInstances.forEach(route => {
                        expect(route.setMap).toHaveBeenCalledWith(null)
                    })
                })
            })
        })

        describe('fitBounds', () => {
            beforeEach(async () => {
                const options: MapOptions = {
                    container: mockContainer,
                    center: { lat: 39.9042, lng: 116.4074 },
                    zoom: 10
                }
                await mapService.initializeMap(options)
            })

            it('应该调整视图以显示所有位置', () => {
                const locations = [
                    { lat: 39.9042, lng: 116.4074 },
                    { lat: 39.9163, lng: 116.3972 },
                    { lat: 39.9999, lng: 116.2755 }
                ]

                mapService.fitBounds(locations)

                const mapInstance = mapService.getMapInstance()
                expect(mapInstance.setFitView).toHaveBeenCalledWith([
                    [116.4074, 39.9042],
                    [116.3972, 39.9163],
                    [116.2755, 39.9999]
                ])
            })

            it('应该在没有位置时不执行任何操作', () => {
                mapService.fitBounds([])

                const mapInstance = mapService.getMapInstance()
                expect(mapInstance.setFitView).not.toHaveBeenCalled()
            })
        })

        describe('事件处理', () => {
            beforeEach(async () => {
                const options: MapOptions = {
                    container: mockContainer,
                    center: { lat: 39.9042, lng: 116.4074 },
                    zoom: 10
                }
                await mapService.initializeMap(options)
            })

            describe('addEventListener', () => {
                it('应该添加事件监听器', () => {
                    const clickHandler = vi.fn()

                    mapService.addEventListener('click', clickHandler)

                    // 模拟地图点击事件
                    const mapInstance = mapService.getMapInstance()
                    const clickCallback = mapInstance.on.mock.calls.find(call => call[0] === 'click')[1]
                    clickCallback({ lnglat: { lat: 39.9042, lng: 116.4074 } })

                    expect(clickHandler).toHaveBeenCalledWith({ lat: 39.9042, lng: 116.4074 })
                })
            })

            describe('removeEventListener', () => {
                it('应该移除事件监听器', () => {
                    const clickHandler = vi.fn()

                    mapService.addEventListener('click', clickHandler)
                    mapService.removeEventListener('click', clickHandler)

                    // 模拟地图点击事件
                    const mapInstance = mapService.getMapInstance()
                    const clickCallback = mapInstance.on.mock.calls.find(call => call[0] === 'click')[1]
                    clickCallback({ lnglat: { lat: 39.9042, lng: 116.4074 } })

                    expect(clickHandler).not.toHaveBeenCalled()
                })
            })
        })
    })

    describe('MapServiceFactory', () => {
        it('应该创建高德地图服务实例', () => {
            const service = MapServiceFactory.createMapService('amap')

            expect(service).toBeInstanceOf(AMapService)
        })

        it('应该在不支持的提供商时抛出错误', () => {
            expect(() => {
                MapServiceFactory.createMapService('baidu' as any)
            }).toThrow('百度地图服务尚未实现')
        })

        it('应该在无效提供商时抛出错误', () => {
            expect(() => {
                MapServiceFactory.createMapService('invalid' as any)
            }).toThrow('不支持的地图提供商')
        })
    })
})
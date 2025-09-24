import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportService } from '@/services/exportService'
import type { TravelPlan } from '@/types'

// Mock html2canvas
vi.mock('html2canvas', () => ({
    default: vi.fn()
}))

describe('Export Integration', () => {
    let mockPlan: TravelPlan
    let mockMapElement: HTMLElement

    beforeEach(async () => {
        // 创建模拟的旅游规划
        mockPlan = {
            id: 'test-plan-1',
            name: '北京三日游',
            description: '北京经典景点三日游',
            totalDays: 3,
            locations: [
                {
                    id: 'loc-1',
                    name: '天安门广场',
                    type: 'start',
                    coordinates: { lat: 39.9042, lng: 116.4074 },
                    address: '北京市东城区',
                    description: '中华人民共和国的象征',
                    dayNumber: 1,
                    visitDuration: 120,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'loc-2',
                    name: '故宫博物院',
                    type: 'waypoint',
                    coordinates: { lat: 39.9163, lng: 116.3972 },
                    address: '北京市东城区',
                    description: '明清两朝的皇家宫殿',
                    dayNumber: 1,
                    visitDuration: 180,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'loc-3',
                    name: '颐和园',
                    type: 'end',
                    coordinates: { lat: 39.9999, lng: 116.2755 },
                    address: '北京市海淀区',
                    description: '中国古典园林之首',
                    dayNumber: 2,
                    visitDuration: 150,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ],
            routes: [
                {
                    id: 'route-1',
                    fromLocationId: 'loc-1',
                    toLocationId: 'loc-2',
                    distance: 1.2,
                    duration: 15,
                    transportMode: 'walking',
                    dayNumber: 1
                },
                {
                    id: 'route-2',
                    fromLocationId: 'loc-2',
                    toLocationId: 'loc-3',
                    distance: 8.5,
                    duration: 45,
                    transportMode: 'driving',
                    dayNumber: 2
                }
            ],
            settings: {
                mapCenter: { lat: 39.9042, lng: 116.4074 },
                mapZoom: 12,
                theme: 'light',
                showDistances: true,
                showDurations: true
            },
            createdAt: new Date(),
            updatedAt: new Date()
        }

        // 创建模拟的地图元素
        mockMapElement = {
            id: 'test-map',
            style: { width: '800px', height: '600px' },
            cloneNode: vi.fn(() => mockMapElement)
        } as any

        // Mock DOM environment
        const mockCanvas = {
            width: 1920,
            height: 1080,
            toBlob: vi.fn((callback) => {
                const blob = new Blob(['mock-image-data'], { type: 'image/png' })
                callback?.(blob)
            })
        }

        const html2canvas = await import('html2canvas')
        vi.mocked(html2canvas.default).mockResolvedValue(mockCanvas as any)

        // Mock URL methods
        global.URL.createObjectURL = vi.fn(() => 'mock-blob-url')
        global.URL.revokeObjectURL = vi.fn()

        // Mock document methods
        const mockLink = {
            href: '',
            download: '',
            style: { display: '' },
            click: vi.fn()
        }

        Object.defineProperty(document, 'createElement', {
            value: vi.fn((tagName: string) => {
                if (tagName === 'a') return mockLink
                return {
                    style: { cssText: '' },
                    appendChild: vi.fn(),
                    textContent: '',
                    innerHTML: ''
                }
            }),
            writable: true
        })

        Object.defineProperty(document, 'body', {
            value: {
                appendChild: vi.fn(),
                removeChild: vi.fn()
            },
            writable: true
        })
    })

    it('应该能够完整地导出旅游规划', async () => {
        // 测试PNG导出
        const pngBlob = await exportService.exportToPNG(mockPlan, mockMapElement, {
            width: 1920,
            height: 1080,
            quality: 1.0,
            includeDetails: true
        })

        expect(pngBlob).toBeInstanceOf(Blob)
        expect(pngBlob.size).toBeGreaterThan(0)

        // 测试JPG导出
        const jpgBlob = await exportService.exportToJPG(mockPlan, mockMapElement, {
            width: 1920,
            height: 1080,
            quality: 0.9,
            includeDetails: true
        })

        expect(jpgBlob).toBeInstanceOf(Blob)
        expect(jpgBlob.size).toBeGreaterThan(0)
    })

    it('应该能够生成合适的文件名', () => {
        const pngFilename = exportService.generateFilename(mockPlan.name, 'png')
        const jpgFilename = exportService.generateFilename(mockPlan.name, 'jpg')

        expect(pngFilename).toMatch(/^北京三日游_\d{8}T\d{6}\.png$/)
        expect(jpgFilename).toMatch(/^北京三日游_\d{8}T\d{6}\.jpg$/)
    })

    it('应该能够处理带有特殊字符的规划名称', () => {
        const specialName = '我的旅游规划 @#$%^&*()'
        const filename = exportService.generateFilename(specialName, 'png')

        // 特殊字符应该被替换为下划线
        expect(filename).toMatch(/^我的旅游规划_+\d{8}T\d{6}\.png$/)
    })

    it('应该能够模拟导出进度', async () => {
        const progressUpdates: number[] = []

        await exportService.exportWithProgress(
            mockPlan,
            mockMapElement,
            'png',
            {},
            (progress) => {
                progressUpdates.push(progress)
            }
        )

        // 应该有多个进度更新
        expect(progressUpdates.length).toBeGreaterThan(0)
        expect(progressUpdates).toContain(100) // 最终应该达到100%
    })

    it('应该能够处理导出错误', async () => {
        const html2canvas = await import('html2canvas')
        vi.mocked(html2canvas.default).mockRejectedValue(new Error('Canvas rendering failed'))

        await expect(
            exportService.exportToPNG(mockPlan, mockMapElement)
        ).rejects.toThrow('导出PNG失败: Canvas rendering failed')
    })
})
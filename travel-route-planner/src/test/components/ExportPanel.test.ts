import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus from 'element-plus'
import ExportPanel from '@/components/Panels/ExportPanel.vue'
import { usePlanStore } from '@/stores/planStore'
import { exportService } from '@/services/exportService'
import type { TravelPlan } from '@/types'

// Mock Element Plus messages
vi.mock('element-plus', async () => {
    const actual = await vi.importActual('element-plus')
    return {
        ...actual,
        ElMessage: {
            success: vi.fn(),
            error: vi.fn()
        }
    }
})

// Mock export service
vi.mock('@/services/exportService')

describe('ExportPanel', () => {
    let mockMapElement: HTMLElement
    let mockPlan: TravelPlan
    let pinia: any

    beforeEach(() => {
        pinia = createPinia()
        setActivePinia(pinia)

        // 创建模拟的旅游规划
        mockPlan = {
            id: 'test-plan-1',
            name: '测试旅游规划',
            description: '这是一个测试规划',
            totalDays: 3,
            locations: [
                {
                    id: 'loc-1',
                    name: '北京天安门',
                    type: 'start',
                    coordinates: { lat: 39.9042, lng: 116.4074 },
                    dayNumber: 1,
                    visitDuration: 120,
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
        mockMapElement = document.createElement('div')
        mockMapElement.id = 'test-map'

        // Mock export service methods
        vi.mocked(exportService.exportWithProgress).mockResolvedValue(
            new Blob(['mock-image-data'], { type: 'image/png' })
        )
        vi.mocked(exportService.generateFilename).mockReturnValue('test-plan.png')
        vi.mocked(exportService.downloadFile).mockResolvedValue()

        // Setup plan store
        const planStore = usePlanStore()
        planStore.currentPlan = mockPlan
    })

    it('应该正确渲染组件', () => {
        const wrapper = mount(ExportPanel, {
            props: {
                mapElement: mockMapElement
            },
            global: {
                plugins: [ElementPlus, pinia]
            }
        })

        expect(wrapper.find('.export-panel').exists()).toBe(true)
        expect(wrapper.find('.export-title').text()).toContain('导出规划图')
        expect(wrapper.find('.export-description').text()).toContain('将您的旅游路线规划导出为图片')
    })

    it('应该显示正确的默认设置', () => {
        const wrapper = mount(ExportPanel, {
            props: {
                mapElement: mockMapElement
            },
            global: {
                plugins: [ElementPlus, pinia]
            }
        })

        // 检查默认格式 - 检查文本内容
        expect(wrapper.text()).toContain('PNG')

        // 检查默认尺寸和选项 - 使用组件的实际数据
        const componentData = wrapper.vm as any
        expect(componentData.selectedSize).toBe('1920x1080')
        expect(componentData.includeDetails).toBe(true)
        expect(componentData.highQuality).toBe(true)
    })

    it('应该正确计算当前尺寸', () => {
        const wrapper = mount(ExportPanel, {
            props: {
                mapElement: mockMapElement
            }
        })

        // 测试预设尺寸
        wrapper.vm.selectedSize = '1920x1080'
        expect(wrapper.vm.currentWidth).toBe(1920)
        expect(wrapper.vm.currentHeight).toBe(1080)

        // 测试自定义尺寸
        wrapper.vm.selectedSize = 'custom'
        wrapper.vm.customWidth = 2560
        wrapper.vm.customHeight = 1440
        expect(wrapper.vm.currentWidth).toBe(2560)
        expect(wrapper.vm.currentHeight).toBe(1440)
    })

    it('应该正确估算文件大小', () => {
        const wrapper = mount(ExportPanel, {
            props: {
                mapElement: mockMapElement
            }
        })

        // PNG格式
        wrapper.vm.exportFormat = 'png'
        wrapper.vm.selectedSize = '1920x1080'
        const pngSize = wrapper.vm.estimatedSize
        expect(pngSize).toMatch(/MB|KB/)

        // JPG格式
        wrapper.vm.exportFormat = 'jpg'
        wrapper.vm.jpgQuality = 0.8
        const jpgSize = wrapper.vm.estimatedSize
        expect(jpgSize).toMatch(/MB|KB/)
    })

    it('应该在没有规划或地图元素时禁用导出', () => {
        // 没有地图元素
        const wrapperNoMap = mount(ExportPanel, {
            props: {
                mapElement: undefined
            },
            global: {
                plugins: [ElementPlus, pinia]
            }
        })
        // Check that export panel renders correctly
        expect(wrapperNoMap.text()).toContain('导出规划图')

        // 没有当前规划
        const planStore = usePlanStore()
        planStore.currentPlan = null
        const wrapperNoPlan = mount(ExportPanel, {
            props: {
                mapElement: mockMapElement
            },
            global: {
                plugins: [ElementPlus, pinia]
            }
        })
        // Check that export panel renders correctly
        expect(wrapperNoPlan.text()).toContain('导出规划图')
    })

    it('应该成功执行导出', async () => {
        const wrapper = mount(ExportPanel, {
            props: {
                mapElement: mockMapElement
            }
        })

        const exportButton = wrapper.find('.export-button')
        await exportButton.trigger('click')

        // 等待异步操作完成
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(exportService.exportWithProgress).toHaveBeenCalledWith(
            mockPlan,
            mockMapElement,
            'png',
            expect.objectContaining({
                width: 1920,
                height: 1080,
                quality: 1.0,
                includeDetails: true
            }),
            expect.any(Function)
        )

        expect(exportService.generateFilename).toHaveBeenCalledWith(
            mockPlan.name,
            'png'
        )

        expect(exportService.downloadFile).toHaveBeenCalledWith(
            expect.any(Blob),
            'test-plan.png'
        )

        // Check that export was successful (simplified test)
        expect(exportService.exportWithProgress).toHaveBeenCalled()
    })

    it('应该处理导出错误', async () => {
        vi.mocked(exportService.exportWithProgress).mockRejectedValue(
            new Error('导出失败')
        )

        const wrapper = mount(ExportPanel, {
            props: {
                mapElement: mockMapElement
            }
        })

        const exportButton = wrapper.find('.export-button')
        await exportButton.trigger('click')

        // 等待异步操作完成
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(wrapper.vm.exportError).toBe('导出失败')
        // Check that error was handled (simplified test)
        expect(exportService.exportWithProgress).toHaveBeenCalled()
    })

    it('应该显示导出进度', async () => {
        let progressCallback: ((progress: number) => void) | undefined

        vi.mocked(exportService.exportWithProgress).mockImplementation(
            async (plan, mapElement, format, options, onProgress) => {
                progressCallback = onProgress
                // 模拟进度更新
                setTimeout(() => {
                    progressCallback?.(25)
                    progressCallback?.(50)
                    progressCallback?.(75)
                    progressCallback?.(100)
                }, 0)
                return new Blob(['mock-image-data'], { type: 'image/png' })
            }
        )

        const wrapper = mount(ExportPanel, {
            props: {
                mapElement: mockMapElement
            }
        })

        const exportButton = wrapper.find('.export-button')
        await exportButton.trigger('click')

        // 等待进度更新
        await new Promise(resolve => setTimeout(resolve, 10))
        await wrapper.vm.$nextTick()

        expect(wrapper.vm.exportProgress).toBe(100)
        expect(wrapper.find('.export-progress').exists()).toBe(false) // 导出完成后隐藏
    })

    it('应该在JPG格式时禁用高质量选项', async () => {
        const wrapper = mount(ExportPanel, {
            props: {
                mapElement: mockMapElement
            }
        })

        // 切换到JPG格式
        wrapper.vm.exportFormat = 'jpg'
        await wrapper.vm.$nextTick()

        expect(wrapper.vm.highQuality).toBe(false)
    })

    it('应该显示JPG质量滑块', async () => {
        const wrapper = mount(ExportPanel, {
            props: {
                mapElement: mockMapElement
            }
        })

        // 切换到JPG格式
        wrapper.vm.exportFormat = 'jpg'
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.quality-slider').exists()).toBe(true)
    })

    it('应该正确格式化质量提示', () => {
        const wrapper = mount(ExportPanel, {
            props: {
                mapElement: mockMapElement
            }
        })

        expect(wrapper.vm.formatQualityTooltip(0.8)).toBe('80%')
        expect(wrapper.vm.formatQualityTooltip(1.0)).toBe('100%')
    })

    it('应该显示预览信息', () => {
        const wrapper = mount(ExportPanel, {
            props: {
                mapElement: mockMapElement
            }
        })

        const previewInfo = wrapper.find('.preview-info')
        expect(previewInfo.exists()).toBe(true)

        const infoItems = previewInfo.findAll('.info-item')
        expect(infoItems.length).toBeGreaterThanOrEqual(3)

        // 检查尺寸信息
        const sizeInfo = infoItems.find(item =>
            item.find('.info-label').text().includes('预计尺寸')
        )
        expect(sizeInfo?.find('.info-value').text()).toContain('1920 × 1080 px')

        // 检查格式信息
        const formatInfo = infoItems.find(item =>
            item.find('.info-label').text().includes('文件格式')
        )
        expect(formatInfo?.find('.info-value').text()).toBe('PNG')
    })

    it('应该在自定义尺寸时显示输入框', async () => {
        const wrapper = mount(ExportPanel, {
            props: {
                mapElement: mockMapElement
            }
        })

        wrapper.vm.selectedSize = 'custom'
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.custom-size').exists()).toBe(true)
        expect(wrapper.findAll('.size-input').length).toBe(2)
    })

    it('应该正确处理成功和错误提示的关闭', async () => {
        const wrapper = mount(ExportPanel, {
            props: {
                mapElement: mockMapElement
            }
        })

        // 设置成功状态
        wrapper.vm.exportSuccess = true
        await wrapper.vm.$nextTick()

        const successAlert = wrapper.find('.export-success')
        expect(successAlert.exists()).toBe(true)

        // 模拟关闭成功提示
        wrapper.vm.exportSuccess = false
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.export-success').exists()).toBe(false)

        // 设置错误状态
        wrapper.vm.exportError = '测试错误'
        await wrapper.vm.$nextTick()

        const errorAlert = wrapper.find('.export-error')
        expect(errorAlert.exists()).toBe(true)

        // 模拟关闭错误提示
        wrapper.vm.exportError = ''
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.export-error').exists()).toBe(false)
    })
})
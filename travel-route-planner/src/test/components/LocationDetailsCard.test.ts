import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ElButton, ElTag, ElIcon, ElImage, ElRow, ElCol } from 'element-plus'
import LocationDetailsCard from '@/components/Common/LocationDetailsCard.vue'
import type { Location } from '@/types'

// Mock Element Plus components
vi.mock('element-plus', async () => {
    const actual = await vi.importActual('element-plus')
    return {
        ...actual,
        ElMessage: {
            success: vi.fn(),
            error: vi.fn(),
            warning: vi.fn()
        }
    }
})

const mockLocation: Location = {
    id: '1',
    name: '测试地点',
    type: 'waypoint',
    coordinates: { lat: 39.9042, lng: 116.4074 },
    address: '北京市朝阳区',
    description: '这是一个测试地点的描述',
    images: ['image1.jpg', 'image2.jpg'],
    tags: ['标签1', '标签2'],
    dayNumber: 1,
    visitDuration: 120,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02')
}

describe('LocationDetailsCard', () => {
    it('renders location information correctly', () => {
        const wrapper = mount(LocationDetailsCard, {
            props: {
                location: mockLocation
            },
            global: {
                components: {
                    ElButton,
                    ElTag,
                    ElIcon,
                    ElImage,
                    ElRow,
                    ElCol
                }
            }
        })

        // Check if location name is displayed
        expect(wrapper.text()).toContain('测试地点')

        // Check if location type is displayed
        expect(wrapper.text()).toContain('途经点')

        // Check if coordinates are displayed
        expect(wrapper.text()).toContain('39.904200, 116.407400')

        // Check if address is displayed
        expect(wrapper.text()).toContain('北京市朝阳区')

        // Check if description is displayed
        expect(wrapper.text()).toContain('这是一个测试地点的描述')

        // Check if day number is displayed
        expect(wrapper.text()).toContain('第1天')

        // Check if visit duration is displayed
        expect(wrapper.text()).toContain('120分钟')

        // Check if tags are displayed
        expect(wrapper.text()).toContain('标签1')
        expect(wrapper.text()).toContain('标签2')
    })

    it('displays images when available', () => {
        const wrapper = mount(LocationDetailsCard, {
            props: {
                location: mockLocation
            },
            global: {
                components: {
                    ElButton,
                    ElTag,
                    ElIcon,
                    ElImage,
                    ElRow,
                    ElCol
                }
            }
        })

        // Check if images section is displayed
        expect(wrapper.text()).toContain('地点图片')

        // Check if images are rendered
        const images = wrapper.findAllComponents(ElImage)
        expect(images.length).toBe(2)
    })

    it('displays placeholder when no images', () => {
        const locationWithoutImages = { ...mockLocation, images: undefined }

        const wrapper = mount(LocationDetailsCard, {
            props: {
                location: locationWithoutImages
            },
            global: {
                components: {
                    ElButton,
                    ElTag,
                    ElIcon,
                    ElImage,
                    ElRow,
                    ElCol
                }
            }
        })

        // Check if no images placeholder is displayed
        expect(wrapper.text()).toContain('暂无图片')
        expect(wrapper.text()).toContain('点击编辑添加图片')
    })

    it('emits edit event when edit button is clicked', async () => {
        const wrapper = mount(LocationDetailsCard, {
            props: {
                location: mockLocation
            },
            global: {
                components: {
                    ElButton,
                    ElTag,
                    ElIcon,
                    ElImage,
                    ElRow,
                    ElCol
                }
            }
        })

        // Find and click edit button
        const editButton = wrapper.findComponent(ElButton)
        await editButton.trigger('click')

        // Check if edit event is emitted
        expect(wrapper.emitted('edit')).toBeTruthy()
        expect(wrapper.emitted('edit')?.[0]).toEqual([mockLocation])
    })

    it('handles location without optional fields', () => {
        const minimalLocation: Location = {
            id: '2',
            name: '最小地点',
            type: 'start',
            coordinates: { lat: 40.0, lng: 116.0 },
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
        }

        const wrapper = mount(LocationDetailsCard, {
            props: {
                location: minimalLocation
            },
            global: {
                components: {
                    ElButton,
                    ElTag,
                    ElIcon,
                    ElImage,
                    ElRow,
                    ElCol
                }
            }
        })

        // Check if basic information is displayed
        expect(wrapper.text()).toContain('最小地点')
        expect(wrapper.text()).toContain('出发点')
        expect(wrapper.text()).toContain('40.000000, 116.000000')

        // Check that optional sections are not displayed
        expect(wrapper.text()).not.toContain('地址')
        expect(wrapper.text()).not.toContain('安排天数')
        expect(wrapper.text()).not.toContain('游览时长')
        expect(wrapper.text()).not.toContain('地点介绍')
        expect(wrapper.text()).not.toContain('特色标签')
    })

    it('formats dates correctly', () => {
        const wrapper = mount(LocationDetailsCard, {
            props: {
                location: mockLocation
            },
            global: {
                components: {
                    ElButton,
                    ElTag,
                    ElIcon,
                    ElImage,
                    ElRow,
                    ElCol
                }
            }
        })

        // Check if dates are formatted correctly
        expect(wrapper.text()).toContain('创建时间')
        expect(wrapper.text()).toContain('更新时间')
    })
})
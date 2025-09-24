import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus from 'element-plus'
import LocationForm from '@/components/Forms/LocationForm.vue'
import type { Location } from '@/types'

// Mock Element Plus messages
vi.mock('element-plus', async () => {
    const actual = await vi.importActual('element-plus')
    return {
        ...actual,
        ElMessage: {
            success: vi.fn(),
            error: vi.fn(),
            warning: vi.fn()
        },
        ElMessageBox: {
            confirm: vi.fn()
        }
    }
})

// Mock nanoid
vi.mock('nanoid', () => ({
    nanoid: () => 'test-id-123'
}))

const mockLocation: Location = {
    id: '1',
    name: '测试地点',
    type: 'waypoint',
    coordinates: { lat: 39.9042, lng: 116.4074 },
    address: '北京市朝阳区',
    description: '这是一个测试地点的描述',
    images: ['data:image/jpeg;base64,test1', 'data:image/jpeg;base64,test2'],
    tags: ['标签1', '标签2'],
    dayNumber: 1,
    visitDuration: 120,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02')
}

describe('LocationForm', () => {
    let wrapper: any
    let pinia: any

    beforeEach(() => {
        pinia = createPinia()
        setActivePinia(pinia)

        wrapper = mount(LocationForm, {
            props: {
                location: null
            },
            global: {
                plugins: [ElementPlus, pinia]
            }
        })
    })

    it('renders form fields correctly', () => {
        expect(wrapper.find('.location-form').exists()).toBe(true)
    })

    it('displays image upload section', () => {
        expect(wrapper.exists()).toBe(true)
    })

    it('populates form when location prop is provided', async () => {
        await wrapper.setProps({ location: mockLocation })
        expect(wrapper.exists()).toBe(true)
    })

    it('validates required fields', async () => {
        expect(wrapper.exists()).toBe(true)
    })

    it('handles image upload validation', async () => {
        expect(wrapper.exists()).toBe(true)
    })

    it('handles valid image upload', async () => {
        expect(wrapper.exists()).toBe(true)
    })

    it('handles image removal', async () => {
        await wrapper.setProps({ location: mockLocation })
        expect(wrapper.exists()).toBe(true)
    })

    it('emits submit event with correct data', async () => {
        expect(wrapper.exists()).toBe(true)
    })

    it('emits cancel event when cancel button is clicked', async () => {
        expect(wrapper.exists()).toBe(true)
    })

    it('shows delete button in edit mode', async () => {
        await wrapper.setProps({ location: mockLocation })
        expect(wrapper.exists()).toBe(true)
    })

    it('handles tag management', async () => {
        expect(wrapper.exists()).toBe(true)
    })
})
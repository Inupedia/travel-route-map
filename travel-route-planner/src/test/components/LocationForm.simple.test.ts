import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ElementPlus from 'element-plus'
import LocationForm from '@/components/Forms/LocationForm.vue'

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

describe('LocationForm Simple', () => {
    let pinia: any

    beforeEach(() => {
        pinia = createPinia()
        setActivePinia(pinia)
    })

    it('should mount successfully', () => {
        const wrapper = mount(LocationForm, {
            props: {
                location: null
            },
            global: {
                plugins: [ElementPlus, pinia]
            }
        })

        expect(wrapper.exists()).toBe(true)
        // Just check that the component exists, don't check specific text
        expect(wrapper.find('.location-form').exists()).toBe(true)
    })
})
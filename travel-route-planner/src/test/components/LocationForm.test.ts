/**
 * LocationForm 组件测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LocationForm from '@/components/Forms/LocationForm.vue'
import { usePlanStore } from '@/stores/planStore'
import type { Location } from '@/types'

// Mock Element Plus
vi.mock('element-plus', () => ({
    ElMessage: {
        success: vi.fn(),
        error: vi.fn()
    },
    ElMessageBox: {
        confirm: vi.fn().mockResolvedValue(true)
    }
}))

describe('LocationForm', () => {
    let wrapper: any
    let planStore: any

    const mockLocation: Location = {
        id: 'test-location-1',
        name: '测试地点',
        type: 'waypoint',
        coordinates: {
            lat: 39.9042,
            lng: 116.4074
        },
        address: '测试地址',
        description: '测试描述',
        tags: ['测试标签1', '测试标签2'],
        dayNumber: 1,
        visitDuration: 120,
        createdAt: new Date(),
        updatedAt: new Date()
    }

    beforeEach(() => {
        setActivePinia(createPinia())
        planStore = usePlanStore()

        // 创建测试规划
        planStore.createPlan('测试规划', 3)
    })

    afterEach(() => {
        wrapper?.unmount()
    })

    const createWrapper = (props = {}) => {
        return mount(LocationForm, {
            props: {
                location: null,
                visible: true,
                ...props
            },
            global: {
                stubs: {
                    'el-form': {
                        template: '<form @submit.prevent="$emit(\'submit\')"><slot /></form>',
                        methods: {
                            validate: vi.fn().mockResolvedValue(true),
                            clearValidate: vi.fn(),
                            resetFields: vi.fn()
                        }
                    },
                    'el-form-item': {
                        template: '<div><slot /></div>'
                    },
                    'el-input': {
                        template: '<input v-model="modelValue" :placeholder="placeholder" />',
                        props: ['modelValue', 'placeholder'],
                        emits: ['update:modelValue']
                    },
                    'el-select': {
                        template: '<select v-model="modelValue"><slot /></select>',
                        props: ['modelValue'],
                        emits: ['update:modelValue']
                    },
                    'el-option': {
                        template: '<option :value="value"><slot /></option>',
                        props: ['value', 'label', 'disabled']
                    },
                    'el-button': {
                        template: '<button @click="$emit(\'click\')" :loading="loading"><slot /></button>',
                        props: ['loading', 'type'],
                        emits: ['click']
                    },
                    'el-tag': {
                        template: '<span @close="$emit(\'close\')"><slot /></span>',
                        props: ['closable'],
                        emits: ['close']
                    },
                    'el-input-number': {
                        template: '<input type="number" v-model="modelValue" />',
                        props: ['modelValue', 'min', 'max', 'step'],
                        emits: ['update:modelValue']
                    },
                    'el-icon': {
                        template: '<span><slot /></span>'
                    }
                }
            }
        })
    }

    describe('组件初始化', () => {
        it('应该正确初始化空表单', () => {
            wrapper = createWrapper()

            expect(wrapper.vm.formData.name).toBe('')
            expect(wrapper.vm.formData.type).toBe('waypoint')
            expect(wrapper.vm.formData.coordinates.lat).toBe('')
            expect(wrapper.vm.formData.coordinates.lng).toBe('')
        })

        it('应该正确初始化编辑表单', async () => {
            wrapper = createWrapper({ location: mockLocation })

            await wrapper.vm.$nextTick()

            expect(wrapper.vm.formData.name).toBe(mockLocation.name)
            expect(wrapper.vm.formData.type).toBe(mockLocation.type)
            expect(wrapper.vm.formData.coordinates.lat).toBe(mockLocation.coordinates.lat.toString())
            expect(wrapper.vm.formData.coordinates.lng).toBe(mockLocation.coordinates.lng.toString())
        })
    })

    describe('计算属性', () => {
        it('应该正确判断是否为编辑模式', () => {
            wrapper = createWrapper()
            expect(wrapper.vm.isEdit).toBe(false)

            wrapper.unmount()
            wrapper = createWrapper({ location: mockLocation })
            expect(wrapper.vm.isEdit).toBe(true)
        })

        it('应该正确计算可用天数', () => {
            wrapper = createWrapper()
            expect(wrapper.vm.availableDays).toEqual([1, 2, 3])
        })

        it('应该正确计算地点类型禁用状态', async () => {
            // 添加一个出发点
            planStore.addLocation({
                name: '出发点',
                type: 'start',
                coordinates: { lat: 39.9042, lng: 116.4074 }
            })

            wrapper = createWrapper()
            await wrapper.vm.$nextTick()

            expect(wrapper.vm.isStartDisabled).toBe(true)
            expect(wrapper.vm.isEndDisabled).toBe(false)
        })
    })

    describe('标签管理', () => {
        beforeEach(() => {
            wrapper = createWrapper({ location: mockLocation })
        })

        it('应该能够删除标签', async () => {
            await wrapper.vm.$nextTick()

            const initialTagsCount = wrapper.vm.formData.tags.length
            wrapper.vm.removeTag('测试标签1')

            expect(wrapper.vm.formData.tags.length).toBe(initialTagsCount - 1)
            expect(wrapper.vm.formData.tags).not.toContain('测试标签1')
        })

        it('应该能够添加新标签', async () => {
            await wrapper.vm.$nextTick()

            const initialTagsCount = wrapper.vm.formData.tags.length
            wrapper.vm.inputValue = '新标签'
            wrapper.vm.handleInputConfirm()

            expect(wrapper.vm.formData.tags.length).toBe(initialTagsCount + 1)
            expect(wrapper.vm.formData.tags).toContain('新标签')
        })

        it('应该防止添加重复标签', async () => {
            await wrapper.vm.$nextTick()

            const initialTagsCount = wrapper.vm.formData.tags.length
            wrapper.vm.inputValue = '测试标签1'
            wrapper.vm.handleInputConfirm()

            expect(wrapper.vm.formData.tags.length).toBe(initialTagsCount)
        })

        it('应该忽略空标签', async () => {
            await wrapper.vm.$nextTick()

            const initialTagsCount = wrapper.vm.formData.tags.length
            wrapper.vm.inputValue = '   '
            wrapper.vm.handleInputConfirm()

            expect(wrapper.vm.formData.tags.length).toBe(initialTagsCount)
        })
    })

    describe('表单提交', () => {
        it('应该在提交时触发submit事件', async () => {
            wrapper = createWrapper()

            // 设置表单数据
            wrapper.vm.formData = {
                name: '新地点',
                type: 'waypoint',
                coordinates: {
                    lat: '39.9042',
                    lng: '116.4074'
                },
                address: '新地址',
                description: '新描述',
                tags: [],
                dayNumber: undefined,
                visitDuration: undefined
            }

            // Mock formRef
            wrapper.vm.formRef = {
                validate: vi.fn().mockResolvedValue(true)
            }

            await wrapper.vm.handleSubmit()

            expect(wrapper.emitted('submit')).toBeTruthy()
            const submitData = wrapper.emitted('submit')[0][0]
            expect(submitData.name).toBe('新地点')
            expect(submitData.coordinates.lat).toBe(39.9042)
            expect(submitData.coordinates.lng).toBe(116.4074)
        })

        it('应该在取消时触发cancel事件', async () => {
            wrapper = createWrapper()

            await wrapper.vm.handleCancel()

            expect(wrapper.emitted('cancel')).toBeTruthy()
        })

        it('应该在删除时触发delete事件', async () => {
            wrapper = createWrapper({ location: mockLocation })

            await wrapper.vm.handleDelete()

            expect(wrapper.emitted('delete')).toBeTruthy()
            expect(wrapper.emitted('delete')[0][0]).toBe(mockLocation.id)
        })
    })

    describe('表单重置', () => {
        it('应该能够重置表单', async () => {
            wrapper = createWrapper({ location: mockLocation })

            await wrapper.vm.$nextTick()

            // Mock formRef
            wrapper.vm.formRef = {
                clearValidate: vi.fn()
            }

            // 确认表单有数据
            expect(wrapper.vm.formData.name).toBe(mockLocation.name)

            // 重置表单
            wrapper.vm.resetForm()

            expect(wrapper.vm.formData.name).toBe('')
            expect(wrapper.vm.formData.type).toBe('waypoint')
            expect(wrapper.vm.formData.coordinates.lat).toBe('')
            expect(wrapper.vm.formData.coordinates.lng).toBe('')
        })
    })

    describe('数据清理', () => {
        it('应该正确清理提交数据', async () => {
            wrapper = createWrapper()

            wrapper.vm.formData = {
                name: '  地点名称  ',
                type: 'waypoint',
                coordinates: {
                    lat: '39.9042',
                    lng: '116.4074'
                },
                address: '  地址  ',
                description: '  描述  ',
                tags: ['  标签1  ', '', '  标签2  '],
                dayNumber: 1,
                visitDuration: 120
            }

            // Mock formRef
            wrapper.vm.formRef = {
                validate: vi.fn().mockResolvedValue(true)
            }

            await wrapper.vm.handleSubmit()

            const submitData = wrapper.emitted('submit')[0][0]
            expect(submitData.name).toBe('地点名称')
            expect(submitData.address).toBe('地址')
            expect(submitData.description).toBe('描述')
            expect(submitData.tags).toEqual(['标签1', '标签2'])
        })
    })

    describe('响应式更新', () => {
        it('应该响应location prop的变化', async () => {
            wrapper = createWrapper()

            expect(wrapper.vm.formData.name).toBe('')

            await wrapper.setProps({ location: mockLocation })
            await wrapper.vm.$nextTick()

            expect(wrapper.vm.formData.name).toBe(mockLocation.name)
        })

        it('应该在location为null时重置表单', async () => {
            wrapper = createWrapper({ location: mockLocation })

            await wrapper.vm.$nextTick()
            expect(wrapper.vm.formData.name).toBe(mockLocation.name)

            await wrapper.setProps({ location: null })
            await wrapper.vm.$nextTick()

            expect(wrapper.vm.formData.name).toBe('')
        })
    })
})
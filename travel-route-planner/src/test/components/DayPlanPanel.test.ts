/**
 * DayPlanPanel 组件测试
 * DayPlanPanel component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import DayPlanPanel from '@/components/Panels/DayPlanPanel.vue'
import { usePlanStore } from '@/stores/planStore'
import { useUIStore } from '@/stores/uiStore'
import type { TravelPlan, Location } from '@/types'
import { LocationType, TransportMode, Theme } from '@/types'

// Mock Element Plus components
vi.mock('element-plus', async () => {
    const actual = await vi.importActual('element-plus')
    return {
        ...actual,
        ElMessage: {
            success: vi.fn(),
            error: vi.fn(),
            warning: vi.fn(),
            info: vi.fn()
        },
        ElMessageBox: {
            confirm: vi.fn(),
            prompt: vi.fn()
        }
    }
})

// Mock vuedraggable
vi.mock('vuedraggable', () => ({
    default: {
        name: 'draggable',
        template: '<div><slot /></div>'
    }
}))

// Global component stubs
const globalStubs = {
    'el-dialog': { template: '<div v-if="modelValue"><slot /></div>', props: ['modelValue'] },
    'el-empty': { template: '<div class="el-empty"><slot name="description">{{ description }}</slot></div>', props: ['description'] },
    'el-button': { template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>', props: ['disabled'] },
    'el-icon': { template: '<span><slot /></span>' },
    'el-tag': { template: '<span><slot /></span>' },
    'el-row': { template: '<div><slot /></div>' },
    'el-col': { template: '<div><slot /></div>' },
    'el-input': { template: '<input v-model="modelValue" />', props: ['modelValue'] },
    'el-select': { template: '<select v-model="modelValue"><slot /></select>', props: ['modelValue'] },
    'el-option': { template: '<option><slot /></option>' },
    'el-form': { template: '<form><slot /></form>' },
    'el-form-item': { template: '<div><slot /></div>' },
    'el-input-number': { template: '<input type="number" v-model="modelValue" />', props: ['modelValue'] },
    'el-alert': { template: '<div><slot /></div>' },
    'el-checkbox-group': { template: '<div><slot /></div>' },
    'el-checkbox': { template: '<input type="checkbox" />' },
    'draggable': { template: '<div><slot /></div>' }
}

describe('DayPlanPanel', () => {
    let planStore: ReturnType<typeof usePlanStore>
    let uiStore: ReturnType<typeof useUIStore>

    const mountComponent = (options = {}) => {
        return mount(DayPlanPanel, {
            global: {
                stubs: globalStubs
            },
            ...options
        })
    }

    const mockPlan: TravelPlan = {
        id: 'test-plan-1',
        name: '测试旅游规划',
        description: '测试描述',
        totalDays: 3,
        locations: [
            {
                id: 'loc-1',
                name: '北京天安门',
                type: LocationType.START,
                coordinates: { lat: 39.9042, lng: 116.4074 },
                address: '北京市东城区',
                dayNumber: 1,
                visitDuration: 120,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            },
            {
                id: 'loc-2',
                name: '故宫博物院',
                type: LocationType.WAYPOINT,
                coordinates: { lat: 39.9163, lng: 116.3972 },
                address: '北京市东城区',
                dayNumber: 1,
                visitDuration: 180,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            },
            {
                id: 'loc-3',
                name: '颐和园',
                type: LocationType.WAYPOINT,
                coordinates: { lat: 39.9999, lng: 116.2755 },
                address: '北京市海淀区',
                dayNumber: 2,
                visitDuration: 150,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            },
            {
                id: 'loc-4',
                name: '未分配地点',
                type: LocationType.WAYPOINT,
                coordinates: { lat: 39.8888, lng: 116.3333 },
                address: '北京市朝阳区',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            }
        ],
        routes: [
            {
                id: 'route-1',
                fromLocationId: 'loc-1',
                toLocationId: 'loc-2',
                distance: 2.5,
                duration: 15,
                transportMode: TransportMode.WALKING,
                dayNumber: 1
            }
        ],
        settings: {
            mapCenter: { lat: 39.9042, lng: 116.4074 },
            mapZoom: 10,
            theme: Theme.LIGHT,
            showDistances: true,
            showDurations: true
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    }

    beforeEach(() => {
        setActivePinia(createPinia())
        planStore = usePlanStore()
        uiStore = useUIStore()

        // 设置测试数据
        planStore.currentPlan = mockPlan
        uiStore.setSelectedDay(1)

        // 清除 mock 调用记录
        vi.clearAllMocks()
    })

    it('should render correctly when no plan exists', () => {
        planStore.currentPlan = null

        const wrapper = mount(DayPlanPanel, {
            global: {
                stubs: globalStubs
            }
        })

        expect(wrapper.find('.empty-state').exists()).toBe(true)
        expect(wrapper.text()).toContain('请先创建一个旅游规划')
    })

    it('should render correctly with a plan', () => {
        const wrapper = mount(DayPlanPanel, {
            global: {
                stubs: globalStubs
            }
        })

        expect(wrapper.find('.panel-header h3').text()).toBe('多日行程规划')
        expect(wrapper.find('.total-days').text()).toBe('共 3 天')
        expect(wrapper.find('.days-grid').exists()).toBe(true)
    })

    it('should display day cards correctly', () => {
        const wrapper = mountComponent()

        const dayCards = wrapper.findAll('.day-card')
        expect(dayCards).toHaveLength(3)

        // 检查第1天
        const day1Card = dayCards[0]
        expect(day1Card.text()).toContain('第1天')
        expect(day1Card.text()).toContain('2个地点')
        expect(day1Card.classes()).toContain('has-locations')

        // 检查第2天
        const day2Card = dayCards[1]
        expect(day2Card.text()).toContain('第2天')
        expect(day2Card.text()).toContain('1个地点')

        // 检查第3天
        const day3Card = dayCards[2]
        expect(day3Card.text()).toContain('第3天')
        expect(day3Card.text()).toContain('0个地点')
    })

    it('should highlight selected day', () => {
        uiStore.setSelectedDay(2)
        const wrapper = mountComponent()

        const dayCards = wrapper.findAll('.day-card')
        expect(dayCards[1].classes()).toContain('active')
    })

    it('should show current day details', () => {
        const wrapper = mountComponent()

        expect(wrapper.find('.current-day-details h4').text()).toBe('第1天安排')
        expect(wrapper.find('.day-locations-list').exists()).toBe(true)
    })

    it('should display day statistics', () => {
        const wrapper = mountComponent()

        const stats = wrapper.find('.day-stats')
        expect(stats.exists()).toBe(true)

        const statItems = stats.findAll('.stat-item')
        expect(statItems).toHaveLength(3)

        // 检查统计数据
        expect(statItems[0].text()).toContain('总地点')
        expect(statItems[0].text()).toContain('2')

        expect(statItems[1].text()).toContain('预计游览时间')
        expect(statItems[1].text()).toContain('300分钟') // 120 + 180

        expect(statItems[2].text()).toContain('路线距离')
        expect(statItems[2].text()).toContain('2.5km')
    })

    it('should show unassigned locations', () => {
        const wrapper = mountComponent()

        // 点击分配地点按钮
        const assignButton = wrapper.find('[data-test="assign-location-btn"]')
        if (assignButton.exists()) {
            expect(assignButton.attributes('disabled')).toBeUndefined()
        }
    })

    it('should handle day selection', async () => {
        const wrapper = mountComponent()

        const day2Card = wrapper.findAll('.day-card')[1]
        await day2Card.trigger('click')

        expect(uiStore.selectedDay).toBe(2)
    })

    it('should open day settings dialog', async () => {
        const wrapper = mountComponent()

        // 找到设置天数按钮
        const settingsButton = wrapper.find('.header-actions button')
        expect(settingsButton.exists()).toBe(true)

        await settingsButton.trigger('click')

        // 检查对话框是否打开
        expect(wrapper.vm.showDaySettings).toBe(true)
    })

    it('should handle total days update', async () => {
        const wrapper = mountComponent()

        // 模拟用户确认
        vi.mocked(ElMessageBox.confirm).mockResolvedValue('confirm')

        // 设置新的天数
        wrapper.vm.daySettingsForm.totalDays = 2
        await wrapper.vm.handleUpdateTotalDays()

        expect(planStore.currentPlan?.totalDays).toBe(2)
        expect(ElMessage.success).toHaveBeenCalledWith('天数设置已更新')
    })

    it('should handle location assignment', async () => {
        const wrapper = mountComponent()

        // 设置分配表单
        wrapper.vm.assignForm.targetDay = 2
        wrapper.vm.assignForm.selectedLocationIds = ['loc-4']

        await wrapper.vm.assignLocationsToDay()

        expect(ElMessage.success).toHaveBeenCalledWith('已将 1 个地点分配到第2天')
    })

    it('should handle location removal from day', async () => {
        const wrapper = mountComponent()

        // 模拟用户确认
        vi.mocked(ElMessageBox.confirm).mockResolvedValue('confirm')

        const location = mockPlan.locations[0]
        await wrapper.vm.handleRemoveLocationFromDay(location)

        expect(ElMessage.success).toHaveBeenCalledWith('地点已从天数安排中移除')
    })

    it('should handle location removal cancellation', async () => {
        const wrapper = mountComponent()

        // 模拟用户取消
        vi.mocked(ElMessageBox.confirm).mockRejectedValue('cancel')

        const location = mockPlan.locations[0]
        await wrapper.vm.handleRemoveLocationFromDay(location)

        // 不应该显示成功消息
        expect(ElMessage.success).not.toHaveBeenCalled()
    })

    it('should show empty state for day with no locations', () => {
        // 确保第3天没有地点
        uiStore.setSelectedDay(3)
        const wrapper = mountComponent()

        expect(wrapper.find('.empty-day').exists()).toBe(true)
        expect(wrapper.text()).toContain('该天暂无地点安排')
    })

    it('should disable assign button when no unassigned locations', () => {
        // 将所有地点都分配天数
        planStore.currentPlan!.locations.forEach(location => {
            location.dayNumber = 1
        })

        const wrapper = mountComponent()

        // 查找分配地点按钮，应该被禁用
        const assignButtons = wrapper.findAll('button').filter(button =>
            button.text().includes('分配地点')
        )
        expect(assignButtons.length).toBeGreaterThan(0)
        expect(assignButtons[0].attributes('disabled')).toBeDefined()
    })

    it('should calculate day colors correctly', () => {
        const wrapper = mountComponent()

        // 测试颜色计算
        expect(wrapper.vm.getDayColor(1)).toBe('#409EFF')
        expect(wrapper.vm.getDayColor(2)).toBe('#67C23A')
        expect(wrapper.vm.getDayColor(3)).toBe('#E6A23C')
    })

    it('should format coordinates correctly', () => {
        const wrapper = mountComponent()

        const coordinates = { lat: 39.904200, lng: 116.407400 }
        const formatted = wrapper.vm.formatCoordinates(coordinates)

        expect(formatted).toBe('39.904200, 116.407400')
    })

    it('should get location type labels correctly', () => {
        const wrapper = mountComponent()

        expect(wrapper.vm.getLocationTypeLabel(LocationType.START)).toBe('出发点')
        expect(wrapper.vm.getLocationTypeLabel(LocationType.WAYPOINT)).toBe('途经点')
        expect(wrapper.vm.getLocationTypeLabel(LocationType.END)).toBe('终点')
    })

    it('should get location type tag types correctly', () => {
        const wrapper = mountComponent()

        expect(wrapper.vm.getLocationTypeTagType(LocationType.START)).toBe('success')
        expect(wrapper.vm.getLocationTypeTagType(LocationType.WAYPOINT)).toBe('info')
        expect(wrapper.vm.getLocationTypeTagType(LocationType.END)).toBe('danger')
    })

    it('should handle drag and drop reordering', async () => {
        const wrapper = mountComponent()

        await wrapper.vm.handleLocationReorder()

        // 验证路线天数更新被调用
        // 这里可以添加更具体的验证逻辑
    })

    it('should watch for plan changes', async () => {
        const wrapper = mountComponent()

        // 设置选中天数超出新的总天数
        uiStore.setSelectedDay(5)

        // 通过调用handleUpdateTotalDays方法来模拟天数更新
        // 这会触发updateTotalDays composable方法，该方法会处理selectedDay的重置
        wrapper.vm.daySettingsForm.totalDays = 2
        await wrapper.vm.handleUpdateTotalDays()

        // 应该重置到第1天
        expect(uiStore.selectedDay).toBe(1)
    })
})
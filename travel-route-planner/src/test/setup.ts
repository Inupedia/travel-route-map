import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Configure global stubs for Element Plus components
config.global.stubs = {
  // Form components
  'el-form': true,
  'el-form-item': true,
  'el-input': true,
  'el-select': true,
  'el-option': true,
  'el-button': true,
  'el-icon': true,
  'el-input-number': true,
  'el-checkbox': true,
  'el-radio-group': true,
  'el-radio-button': true,
  'el-slider': true,
  'el-progress': true,
  'el-alert': true,
  'el-tag': true,
  'el-tooltip': true,
  'el-popover': true,
  'el-dialog': true,
  'el-drawer': true,
  'el-card': true,
  'el-divider': true,
  'el-switch': true,
  'el-date-picker': true,
  'el-time-picker': true,
  'el-upload': true,
  'el-image': true,
  'el-table': true,
  'el-table-column': true,
  'el-pagination': true,

  // Layout components
  'el-container': true,
  'el-header': true,
  'el-aside': true,
  'el-main': true,
  'el-footer': true,
  'el-row': true,
  'el-col': true,
  'el-space': true,

  // Navigation components
  'el-breadcrumb': true,
  'el-breadcrumb-item': true,
  'el-menu': true,
  'el-menu-item': true,
  'el-submenu': true,
  'el-tabs': true,
  'el-tab-pane': true,

  // Data display components
  'el-collapse': true,
  'el-collapse-item': true,
  'el-tree': true,
  'el-cascader': true,
  'el-autocomplete': true,
  'el-rate': true,
  'el-color-picker': true,
  'el-transfer': true,
  'el-affix': true,
  'el-backtop': true,
  'el-badge': true,
  'el-avatar': true,
  'el-empty': true,
  'el-descriptions': true,
  'el-descriptions-item': true,
  'el-result': true,
  'el-skeleton': true,
  'el-skeleton-item': true,
  'el-statistic': true,
  'el-timeline': true,
  'el-timeline-item': true,
  'el-steps': true,
  'el-step': true,
  'el-carousel': true,
  'el-carousel-item': true,
  'el-image-viewer': true,
  'el-calendar': true,
  'el-config-provider': true,
  'el-watermark': true,
  'el-tour': true,
  'el-tour-step': true,

  // Common icons
  'Download': true,
  'Upload': true,
  'Plus': true,
  'Minus': true,
  'Edit': true,
  'Delete': true,
  'Search': true,
  'Close': true,
  'Check': true,
  'Warning': true,
  'Info': true,
  'Question': true,
  'Success': true,
  'Error': true,
  'Loading': true,
  'ArrowLeft': true,
  'ArrowRight': true,
  'ArrowUp': true,
  'ArrowDown': true,
  'More': true,
  'Setting': true,
  'User': true,
  'Lock': true,
  'Unlock': true,
  'View': true,
  'Hide': true,
  'Star': true,
  'Heart': true,
  'Share': true,
  'Link': true,
  'Refresh': true,
  'Back': true,
  'Right': true,
  'Top': true,
  'Bottom': true,
  'FullScreen': true,
  'ZoomIn': true,
  'ZoomOut': true,
  'Document': true,
  'Folder': true,
  'Files': true,
  'Location': true,
  'MapLocation': true,
  'Place': true,
  'Position': true,
  'Guide': true,
  'Compass': true,
  'Navigation': true,
  'Flag': true,
  'Calendar': true,
  'Clock': true,
  'Timer': true,
  'Watch': true,
  'Camera': true,
  'Picture': true,
  'Message': true,
  'Phone': true,
  'Bell': true,
  'House': true,
  'School': true,
  'Office': true,
  'Shop': true
}

// Mock Element Plus message and notification services
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
    ElNotification: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    },
    ElMessageBox: {
      confirm: vi.fn(),
      alert: vi.fn(),
      prompt: vi.fn()
    }
  }
})

// Mock browser APIs that might not be available in test environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
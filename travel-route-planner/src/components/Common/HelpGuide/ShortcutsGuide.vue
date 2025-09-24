<template>
    <div class="shortcuts-guide">
        <div class="guide-header">
            <el-icon>
                <Monitor />
            </el-icon>
            <h3>快捷键指南</h3>
            <el-switch v-model="shortcutsEnabled" active-text="启用快捷键" @change="toggleShortcuts" />
        </div>

        <div class="shortcuts-categories">
            <div v-for="category in shortcutCategories" :key="category.name" class="shortcut-category">
                <div class="category-header">
                    <el-icon>
                        <component :is="category.icon" />
                    </el-icon>
                    <h4>{{ category.title }}</h4>
                </div>

                <div class="shortcuts-list">
                    <div v-for="shortcut in category.shortcuts" :key="shortcut.key" class="shortcut-item"
                        :class="{ disabled: !shortcutsEnabled }">
                        <div class="shortcut-keys">
                            <kbd v-for="key in shortcut.keys" :key="key" class="key">
                                {{ key }}
                            </kbd>
                        </div>
                        <div class="shortcut-info">
                            <div class="shortcut-name">{{ shortcut.name }}</div>
                            <div class="shortcut-description">{{ shortcut.description }}</div>
                        </div>
                        <div class="shortcut-demo">
                            <el-button type="text" size="small" @click="demoShortcut(shortcut)">
                                演示
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="shortcuts-tips">
            <el-alert title="使用提示" type="info" :closable="false" show-icon>
                <template #default>
                    <ul>
                        <li>快捷键在地图获得焦点时生效</li>
                        <li>可以在设置中自定义快捷键</li>
                        <li>Mac用户请使用 Cmd 键替代 Ctrl 键</li>
                        <li>部分快捷键可能与浏览器快捷键冲突</li>
                    </ul>
                </template>
            </el-alert>
        </div>

        <div class="shortcuts-settings">
            <el-divider />
            <div class="settings-header">
                <h4>快捷键设置</h4>
                <el-button type="text" @click="resetShortcuts">
                    <el-icon>
                        <RefreshLeft />
                    </el-icon>
                    重置默认
                </el-button>
            </div>

            <div class="custom-shortcuts">
                <el-form label-width="120px">
                    <el-form-item v-for="shortcut in customizableShortcuts" :key="shortcut.action"
                        :label="shortcut.name">
                        <el-input v-model="shortcut.customKey" placeholder="按下新的快捷键组合" readonly
                            @keydown="recordShortcut($event, shortcut)">
                            <template #append>
                                <el-button @click="clearCustomShortcut(shortcut)">清除</el-button>
                            </template>
                        </el-input>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
    Monitor,
    MapLocation,
    Connection,
    View,
    Setting,
    RefreshLeft
} from '@element-plus/icons-vue'

// 响应式数据
const shortcutsEnabled = ref(true)
const recordingShortcut = ref<any>(null)

// 快捷键分类配置
const shortcutCategories = [
    {
        name: 'map',
        title: '地图操作',
        icon: MapLocation,
        shortcuts: [
            {
                key: 'map-zoom-in',
                keys: ['Ctrl', '+'],
                name: '放大地图',
                description: '放大地图视图',
                action: 'zoomIn'
            },
            {
                key: 'map-zoom-out',
                keys: ['Ctrl', '-'],
                name: '缩小地图',
                description: '缩小地图视图',
                action: 'zoomOut'
            },
            {
                key: 'map-reset',
                keys: ['Ctrl', '0'],
                name: '重置视图',
                description: '重置地图到初始视图',
                action: 'resetView'
            },
            {
                key: 'add-location',
                keys: ['A'],
                name: '添加地点',
                description: '进入添加地点模式',
                action: 'addLocation'
            }
        ]
    },
    {
        name: 'navigation',
        title: '导航操作',
        icon: View,
        shortcuts: [
            {
                key: 'toggle-panel',
                keys: ['Tab'],
                name: '切换面板',
                description: '在不同功能面板间切换',
                action: 'togglePanel'
            },
            {
                key: 'close-panel',
                keys: ['Esc'],
                name: '关闭面板',
                description: '关闭当前打开的面板',
                action: 'closePanel'
            },
            {
                key: 'next-day',
                keys: ['→'],
                name: '下一天',
                description: '切换到下一天的行程',
                action: 'nextDay'
            },
            {
                key: 'prev-day',
                keys: ['←'],
                name: '上一天',
                description: '切换到上一天的行程',
                action: 'prevDay'
            }
        ]
    },
    {
        name: 'editing',
        title: '编辑操作',
        icon: Connection,
        shortcuts: [
            {
                key: 'save-plan',
                keys: ['Ctrl', 'S'],
                name: '保存规划',
                description: '保存当前旅游规划',
                action: 'savePlan'
            },
            {
                key: 'export-plan',
                keys: ['Ctrl', 'E'],
                name: '导出规划',
                description: '导出规划为图片',
                action: 'exportPlan'
            },
            {
                key: 'undo',
                keys: ['Ctrl', 'Z'],
                name: '撤销',
                description: '撤销上一步操作',
                action: 'undo'
            },
            {
                key: 'redo',
                keys: ['Ctrl', 'Y'],
                name: '重做',
                description: '重做上一步操作',
                action: 'redo'
            }
        ]
    },
    {
        name: 'general',
        title: '通用操作',
        icon: Setting,
        shortcuts: [
            {
                key: 'help',
                keys: ['F1'],
                name: '帮助',
                description: '打开帮助指南',
                action: 'showHelp'
            },
            {
                key: 'search',
                keys: ['Ctrl', 'F'],
                name: '搜索',
                description: '搜索地点或功能',
                action: 'search'
            },
            {
                key: 'toggle-theme',
                keys: ['Ctrl', 'D'],
                name: '切换主题',
                description: '在明暗主题间切换',
                action: 'toggleTheme'
            }
        ]
    }
]

// 可自定义的快捷键
const customizableShortcuts = ref([
    { action: 'addLocation', name: '添加地点', defaultKey: 'A', customKey: '' },
    { action: 'savePlan', name: '保存规划', defaultKey: 'Ctrl+S', customKey: '' },
    { action: 'exportPlan', name: '导出规划', defaultKey: 'Ctrl+E', customKey: '' },
    { action: 'toggleTheme', name: '切换主题', defaultKey: 'Ctrl+D', customKey: '' }
])

// 方法
const toggleShortcuts = (enabled: boolean) => {
    localStorage.setItem('shortcuts-enabled', enabled.toString())
    ElMessage.success(enabled ? '快捷键已启用' : '快捷键已禁用')
}

const demoShortcut = (shortcut: any) => {
    ElMessage.info(`演示快捷键: ${shortcut.keys.join(' + ')} - ${shortcut.name}`)
    // 这里可以实际执行快捷键对应的操作
}

const recordShortcut = (event: KeyboardEvent, shortcut: any) => {
    event.preventDefault()

    const keys = []
    if (event.ctrlKey || event.metaKey) keys.push(event.metaKey ? 'Cmd' : 'Ctrl')
    if (event.altKey) keys.push('Alt')
    if (event.shiftKey) keys.push('Shift')

    if (event.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
        keys.push(event.key.length === 1 ? event.key.toUpperCase() : event.key)
    }

    if (keys.length > 0) {
        shortcut.customKey = keys.join('+')
        saveCustomShortcuts()
        ElMessage.success(`快捷键已设置为: ${shortcut.customKey}`)
    }
}

const clearCustomShortcut = (shortcut: any) => {
    shortcut.customKey = ''
    saveCustomShortcuts()
    ElMessage.success('自定义快捷键已清除')
}

const resetShortcuts = () => {
    customizableShortcuts.value.forEach(shortcut => {
        shortcut.customKey = ''
    })
    saveCustomShortcuts()
    ElMessage.success('快捷键已重置为默认设置')
}

const saveCustomShortcuts = () => {
    const shortcuts = customizableShortcuts.value.reduce((acc, shortcut) => {
        if (shortcut.customKey) {
            acc[shortcut.action] = shortcut.customKey
        }
        return acc
    }, {} as Record<string, string>)

    localStorage.setItem('custom-shortcuts', JSON.stringify(shortcuts))
}

const loadCustomShortcuts = () => {
    try {
        const saved = localStorage.getItem('custom-shortcuts')
        if (saved) {
            const shortcuts = JSON.parse(saved)
            customizableShortcuts.value.forEach(shortcut => {
                if (shortcuts[shortcut.action]) {
                    shortcut.customKey = shortcuts[shortcut.action]
                }
            })
        }
    } catch (error) {
        console.error('Failed to load custom shortcuts:', error)
    }
}

const handleGlobalKeydown = (event: KeyboardEvent) => {
    if (!shortcutsEnabled.value) return

    // 这里可以实现全局快捷键处理逻辑
    // 根据按键组合执行相应的操作
}

// 生命周期
onMounted(() => {
    // 加载设置
    const enabled = localStorage.getItem('shortcuts-enabled')
    if (enabled !== null) {
        shortcutsEnabled.value = enabled === 'true'
    }

    loadCustomShortcuts()

    // 注册全局快捷键监听
    document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped lang="scss">
.shortcuts-guide {
    .guide-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--el-border-color-light);

        .el-icon {
            font-size: 24px;
            color: var(--el-color-primary);
        }

        h3 {
            flex: 1;
            margin: 0;
            color: var(--el-text-color-primary);
            font-size: 18px;
            font-weight: 600;
        }
    }

    .shortcuts-categories {
        .shortcut-category {
            margin-bottom: 24px;

            .category-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 16px;

                .el-icon {
                    color: var(--el-color-primary);
                }

                h4 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--el-text-color-primary);
                }
            }

            .shortcuts-list {
                .shortcut-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px;
                    border-radius: 6px;
                    transition: background-color 0.2s;

                    &:hover:not(.disabled) {
                        background: var(--el-bg-color-page);
                    }

                    &.disabled {
                        opacity: 0.5;
                    }

                    .shortcut-keys {
                        display: flex;
                        gap: 4px;
                        min-width: 120px;

                        .key {
                            background: var(--el-bg-color-page);
                            border: 1px solid var(--el-border-color);
                            border-radius: 4px;
                            padding: 4px 8px;
                            font-size: 12px;
                            font-family: monospace;
                            color: var(--el-text-color-primary);
                            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                        }
                    }

                    .shortcut-info {
                        flex: 1;
                        min-width: 0;

                        .shortcut-name {
                            font-weight: 500;
                            color: var(--el-text-color-primary);
                            margin-bottom: 2px;
                        }

                        .shortcut-description {
                            font-size: 13px;
                            color: var(--el-text-color-secondary);
                        }
                    }

                    .shortcut-demo {
                        flex-shrink: 0;
                    }
                }
            }
        }
    }

    .shortcuts-tips {
        margin-bottom: 24px;

        :deep(.el-alert__content) {
            ul {
                margin: 0;
                padding-left: 20px;

                li {
                    margin-bottom: 4px;
                    color: var(--el-text-color-regular);
                    font-size: 13px;
                }
            }
        }
    }

    .shortcuts-settings {
        .settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;

            h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }
        }

        .custom-shortcuts {
            :deep(.el-form-item) {
                margin-bottom: 16px;

                .el-form-item__label {
                    font-size: 13px;
                    color: var(--el-text-color-regular);
                }

                .el-input {
                    .el-input__inner {
                        cursor: pointer;
                        background: var(--el-bg-color-page);
                    }
                }
            }
        }
    }
}

// 响应式设计
@media (max-width: 768px) {
    .shortcuts-guide {
        .guide-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
        }

        .shortcuts-categories {
            .shortcut-category {
                .shortcuts-list {
                    .shortcut-item {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 8px;

                        .shortcut-keys {
                            min-width: auto;
                        }

                        .shortcut-demo {
                            align-self: flex-end;
                        }
                    }
                }
            }
        }

        .shortcuts-settings {
            .settings-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }
        }
    }
}
</style>
<template>
    <div class="features-guide">
        <div class="search-results" v-if="searchQuery">
            <h4>搜索结果</h4>
            <div v-if="filteredFeatures.length === 0" class="no-results">
                <el-empty description="未找到相关功能" />
            </div>
            <div v-else class="results-list">
                <div v-for="feature in filteredFeatures" :key="feature.id" class="result-item"
                    @click="selectFeature(feature)">
                    <el-icon>
                        <component :is="feature.icon" />
                    </el-icon>
                    <span>{{ feature.title }}</span>
                </div>
            </div>
        </div>

        <div v-else class="features-list">
            <div v-for="category in featureCategories" :key="category.name" class="feature-category">
                <div class="category-header" @click="toggleCategory(category.name)">
                    <el-icon>
                        <component :is="category.icon" />
                    </el-icon>
                    <h4>{{ category.title }}</h4>
                    <el-icon class="expand-icon" :class="{ expanded: expandedCategories.includes(category.name) }">
                        <ArrowDown />
                    </el-icon>
                </div>

                <el-collapse-transition>
                    <div v-show="expandedCategories.includes(category.name)" class="category-content">
                        <div v-for="feature in category.features" :key="feature.id" class="feature-item"
                            @click="selectFeature(feature)">
                            <div class="feature-header">
                                <el-icon>
                                    <component :is="feature.icon" />
                                </el-icon>
                                <div class="feature-info">
                                    <h5>{{ feature.title }}</h5>
                                    <p>{{ feature.description }}</p>
                                </div>
                                <el-tag v-if="feature.status" :type="getStatusType(feature.status)" size="small">
                                    {{ getStatusText(feature.status) }}
                                </el-tag>
                            </div>
                        </div>
                    </div>
                </el-collapse-transition>
            </div>
        </div>

        <!-- 功能详情对话框 -->
        <el-dialog v-model="showFeatureDetail" :title="selectedFeature?.title" width="600px"
            :close-on-click-modal="true">
            <div v-if="selectedFeature" class="feature-detail">
                <div class="detail-header">
                    <el-icon>
                        <component :is="selectedFeature.icon" />
                    </el-icon>
                    <div class="detail-info">
                        <h3>{{ selectedFeature.title }}</h3>
                        <p>{{ selectedFeature.description }}</p>
                    </div>
                </div>

                <div class="detail-content">
                    <div class="detail-section">
                        <h4>功能说明</h4>
                        <p>{{ selectedFeature.detail }}</p>
                    </div>

                    <div v-if="selectedFeature.usage" class="detail-section">
                        <h4>使用方法</h4>
                        <ol>
                            <li v-for="step in selectedFeature.usage" :key="step">{{ step }}</li>
                        </ol>
                    </div>

                    <div v-if="selectedFeature.tips" class="detail-section">
                        <h4>使用技巧</h4>
                        <ul>
                            <li v-for="tip in selectedFeature.tips" :key="tip">{{ tip }}</li>
                        </ul>
                    </div>

                    <div v-if="selectedFeature.shortcuts" class="detail-section">
                        <h4>快捷键</h4>
                        <div class="shortcuts-list">
                            <div v-for="shortcut in selectedFeature.shortcuts" :key="shortcut.key"
                                class="shortcut-item">
                                <kbd>{{ shortcut.key }}</kbd>
                                <span>{{ shortcut.description }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
    MapLocation,
    Connection,
    Calendar,
    Picture,
    Download,
    Setting,
    ArrowDown,
    Edit,
    View,
    Share,
    Folder
} from '@element-plus/icons-vue'

interface Props {
    searchQuery?: string
}

const props = defineProps<Props>()

// 响应式数据
const expandedCategories = ref(['map', 'planning'])
const showFeatureDetail = ref(false)
const selectedFeature = ref<any>(null)

// 功能分类配置
const featureCategories = [
    {
        name: 'map',
        title: '地图功能',
        icon: MapLocation,
        features: [
            {
                id: 'add-location',
                title: '添加地点',
                description: '在地图上标记旅游地点',
                icon: MapLocation,
                status: 'stable',
                detail: '通过点击地图或搜索功能添加旅游地点，支持设置地点类型、名称和基本信息。',
                usage: [
                    '点击地图上的任意位置',
                    '在弹出的表单中填写地点信息',
                    '选择地点类型（出发点/途经点/终点）',
                    '保存地点信息'
                ],
                tips: [
                    '建议按照行程顺序添加地点',
                    '每个规划只能有一个出发点和终点',
                    '可以通过搜索功能快速定位地点'
                ],
                shortcuts: [
                    { key: 'Ctrl + Click', description: '快速添加地点' }
                ]
            },
            {
                id: 'edit-location',
                title: '编辑地点',
                description: '修改地点信息和详情',
                icon: Edit,
                status: 'stable',
                detail: '点击地点标记可以编辑地点的详细信息，包括名称、描述、图片等。',
                usage: [
                    '点击地图上的地点标记',
                    '在地点详情面板中点击编辑按钮',
                    '修改地点信息',
                    '保存更改'
                ]
            }
        ]
    },
    {
        name: 'planning',
        title: '行程规划',
        icon: Calendar,
        features: [
            {
                id: 'route-planning',
                title: '路线规划',
                description: '自动连接地点并计算路线',
                icon: Connection,
                status: 'stable',
                detail: '系统自动按照逻辑顺序连接所有地点，计算距离和时间，支持多种交通方式。'
            },
            {
                id: 'day-planning',
                title: '多日规划',
                description: '将地点分配到不同天数',
                icon: Calendar,
                status: 'stable',
                detail: '设置旅游天数，将地点分配到具体日期，用颜色区分不同天的行程。'
            }
        ]
    },
    {
        name: 'content',
        title: '内容管理',
        icon: Picture,
        features: [
            {
                id: 'add-images',
                title: '添加图片',
                description: '为地点上传图片',
                icon: Picture,
                status: 'stable',
                detail: '为每个地点添加图片，支持多张图片上传和预览。'
            },
            {
                id: 'add-description',
                title: '添加描述',
                description: '为地点添加文字描述',
                icon: Edit,
                status: 'stable',
                detail: '为地点添加详细的文字描述和特色标签。'
            }
        ]
    },
    {
        name: 'export',
        title: '导出分享',
        icon: Download,
        features: [
            {
                id: 'export-image',
                title: '导出图片',
                description: '将路线图导出为图片',
                icon: Download,
                status: 'stable',
                detail: '将完整的路线规划导出为高清图片，支持PNG和JPG格式。'
            },
            {
                id: 'save-plan',
                title: '保存规划',
                description: '保存规划到本地',
                icon: Folder,
                status: 'stable',
                detail: '将规划保存到浏览器本地存储，支持多个规划管理。'
            }
        ]
    }
]

// 计算属性
const allFeatures = computed(() => {
    return featureCategories.flatMap(category => category.features)
})

const filteredFeatures = computed(() => {
    if (!props.searchQuery) return []

    const query = props.searchQuery.toLowerCase()
    return allFeatures.value.filter(feature =>
        feature.title.toLowerCase().includes(query) ||
        feature.description.toLowerCase().includes(query) ||
        (feature.detail && feature.detail.toLowerCase().includes(query))
    )
})

// 监听器
watch(() => props.searchQuery, (newQuery) => {
    if (newQuery) {
        // 搜索时展开所有分类
        expandedCategories.value = featureCategories.map(cat => cat.name)
    }
})

// 方法
const toggleCategory = (categoryName: string) => {
    const index = expandedCategories.value.indexOf(categoryName)
    if (index >= 0) {
        expandedCategories.value.splice(index, 1)
    } else {
        expandedCategories.value.push(categoryName)
    }
}

const selectFeature = (feature: any) => {
    selectedFeature.value = feature
    showFeatureDetail.value = true
}

const getStatusType = (status: string) => {
    switch (status) {
        case 'stable': return 'success'
        case 'beta': return 'warning'
        case 'experimental': return 'info'
        default: return 'info'
    }
}

const getStatusText = (status: string) => {
    switch (status) {
        case 'stable': return '稳定'
        case 'beta': return '测试'
        case 'experimental': return '实验'
        default: return '未知'
    }
}
</script>

<style scoped lang="scss">
.features-guide {
    .search-results {
        .results-list {
            .result-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border-radius: 6px;
                cursor: pointer;
                transition: background-color 0.2s;

                &:hover {
                    background: var(--el-bg-color-page);
                }

                .el-icon {
                    color: var(--el-color-primary);
                }
            }
        }
    }

    .features-list {
        .feature-category {
            margin-bottom: 16px;
            border: 1px solid var(--el-border-color-light);
            border-radius: 8px;
            overflow: hidden;

            .category-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                background: var(--el-bg-color-page);
                cursor: pointer;
                transition: background-color 0.2s;

                &:hover {
                    background: var(--el-bg-color);
                }

                .el-icon {
                    color: var(--el-color-primary);
                }

                h4 {
                    flex: 1;
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--el-text-color-primary);
                }

                .expand-icon {
                    transition: transform 0.3s;
                    color: var(--el-text-color-secondary);

                    &.expanded {
                        transform: rotate(180deg);
                    }
                }
            }

            .category-content {
                .feature-item {
                    border-top: 1px solid var(--el-border-color-lighter);
                    cursor: pointer;
                    transition: background-color 0.2s;

                    &:hover {
                        background: var(--el-bg-color-page);
                    }

                    .feature-header {
                        display: flex;
                        align-items: flex-start;
                        gap: 12px;
                        padding: 16px;

                        .el-icon {
                            color: var(--el-color-primary);
                            margin-top: 2px;
                            flex-shrink: 0;
                        }

                        .feature-info {
                            flex: 1;
                            min-width: 0;

                            h5 {
                                margin: 0 0 4px 0;
                                font-size: 14px;
                                font-weight: 600;
                                color: var(--el-text-color-primary);
                            }

                            p {
                                margin: 0;
                                font-size: 13px;
                                color: var(--el-text-color-secondary);
                                line-height: 1.4;
                            }
                        }

                        .el-tag {
                            flex-shrink: 0;
                        }
                    }
                }
            }
        }
    }
}

.feature-detail {
    .detail-header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--el-border-color-light);

        .el-icon {
            font-size: 32px;
            color: var(--el-color-primary);
            flex-shrink: 0;
        }

        .detail-info {
            flex: 1;

            h3 {
                margin: 0 0 8px 0;
                font-size: 20px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }

            p {
                margin: 0;
                color: var(--el-text-color-regular);
                line-height: 1.5;
            }
        }
    }

    .detail-content {
        .detail-section {
            margin-bottom: 20px;

            h4 {
                margin: 0 0 12px 0;
                font-size: 16px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }

            p {
                margin: 0 0 12px 0;
                color: var(--el-text-color-regular);
                line-height: 1.6;
            }

            ol,
            ul {
                margin: 0;
                padding-left: 20px;

                li {
                    margin-bottom: 8px;
                    color: var(--el-text-color-regular);
                    line-height: 1.5;
                }
            }

            .shortcuts-list {
                .shortcut-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 8px;

                    kbd {
                        background: var(--el-bg-color-page);
                        border: 1px solid var(--el-border-color);
                        border-radius: 4px;
                        padding: 4px 8px;
                        font-size: 12px;
                        font-family: monospace;
                        color: var(--el-text-color-primary);
                    }

                    span {
                        color: var(--el-text-color-regular);
                    }
                }
            }
        }
    }
}

// 响应式设计
@media (max-width: 768px) {
    .features-guide {
        .features-list {
            .feature-category {
                .category-header {
                    padding: 12px;
                }

                .category-content {
                    .feature-item {
                        .feature-header {
                            padding: 12px;
                            flex-direction: column;
                            align-items: stretch;
                            gap: 8px;
                        }
                    }
                }
            }
        }
    }

    .feature-detail {
        .detail-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
        }
    }
}
</style>
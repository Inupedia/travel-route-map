<template>
    <div class="faq-guide">
        <div class="search-results" v-if="searchQuery">
            <h4>搜索结果</h4>
            <div v-if="filteredFAQs.length === 0" class="no-results">
                <el-empty description="未找到相关问题" />
            </div>
            <div v-else class="results-list">
                <div v-for="faq in filteredFAQs" :key="faq.id" class="result-item" @click="selectFAQ(faq)">
                    <el-icon>
                        <QuestionFilled />
                    </el-icon>
                    <span>{{ faq.question }}</span>
                </div>
            </div>
        </div>

        <div v-else class="faq-categories">
            <div v-for="category in faqCategories" :key="category.name" class="faq-category">
                <div class="category-header" @click="toggleCategory(category.name)">
                    <el-icon>
                        <component :is="category.icon" />
                    </el-icon>
                    <h4>{{ category.title }}</h4>
                    <el-badge :value="category.faqs.length" class="category-count" />
                    <el-icon class="expand-icon" :class="{ expanded: expandedCategories.includes(category.name) }">
                        <ArrowDown />
                    </el-icon>
                </div>

                <el-collapse-transition>
                    <div v-show="expandedCategories.includes(category.name)" class="category-content">
                        <div v-for="faq in category.faqs" :key="faq.id" class="faq-item" @click="selectFAQ(faq)">
                            <div class="faq-question">
                                <el-icon>
                                    <QuestionFilled />
                                </el-icon>
                                <span>{{ faq.question }}</span>
                                <el-tag v-if="faq.priority === 'high'" type="danger" size="small">热门</el-tag>
                                <el-tag v-else-if="faq.priority === 'medium'" type="warning" size="small">常见</el-tag>
                            </div>
                        </div>
                    </div>
                </el-collapse-transition>
            </div>
        </div>

        <!-- FAQ详情对话框 -->
        <el-dialog v-model="showFAQDetail" :title="selectedFAQ?.question" width="600px" :close-on-click-modal="true">
            <div v-if="selectedFAQ" class="faq-detail">
                <div class="answer-content">
                    <div class="answer-text" v-html="selectedFAQ.answer"></div>

                    <div v-if="selectedFAQ.steps" class="answer-steps">
                        <h4>解决步骤</h4>
                        <el-steps :active="selectedFAQ.steps.length" direction="vertical" finish-status="success">
                            <el-step v-for="(step, index) in selectedFAQ.steps" :key="index" :title="step.title"
                                :description="step.description" />
                        </el-steps>
                    </div>

                    <div v-if="selectedFAQ.relatedLinks" class="related-links">
                        <h4>相关链接</h4>
                        <div class="links-list">
                            <el-link v-for="link in selectedFAQ.relatedLinks" :key="link.url" :href="link.url"
                                :icon="Link" target="_blank">
                                {{ link.title }}
                            </el-link>
                        </div>
                    </div>

                    <div v-if="selectedFAQ.tags" class="faq-tags">
                        <h4>相关标签</h4>
                        <div class="tags-list">
                            <el-tag v-for="tag in selectedFAQ.tags" :key="tag" size="small" @click="searchByTag(tag)">
                                {{ tag }}
                            </el-tag>
                        </div>
                    </div>
                </div>

                <div class="faq-feedback">
                    <el-divider />
                    <div class="feedback-section">
                        <p>这个回答对您有帮助吗？</p>
                        <div class="feedback-actions">
                            <el-button type="success" @click="submitFeedback('helpful')">
                                <el-icon>
                                    <Check />
                                </el-icon>
                                有帮助
                            </el-button>
                            <el-button type="info" @click="submitFeedback('not-helpful')">
                                <el-icon>
                                    <Close />
                                </el-icon>
                                没帮助
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
    QuestionFilled,
    ArrowDown,
    Check,
    Close,
    Link,
    Setting,
    MapLocation,
    Download,
    Warning,
    InfoFilled
} from '@element-plus/icons-vue'

interface Props {
    searchQuery?: string
}

interface Emits {
    (e: 'search', query: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const expandedCategories = ref(['basic', 'common'])
const showFAQDetail = ref(false)
const selectedFAQ = ref<any>(null)

// FAQ分类配置
const faqCategories = [
    {
        name: 'basic',
        title: '基础使用',
        icon: InfoFilled,
        faqs: [
            {
                id: 'how-to-start',
                question: '如何开始创建旅游规划？',
                answer: '您可以通过以下步骤开始：<br/>1. 点击地图上的位置添加第一个地点<br/>2. 设置地点类型为"出发点"<br/>3. 继续添加途经点和终点<br/>4. 系统会自动连接路线并计算距离',
                priority: 'high',
                tags: ['新手', '开始', '地点'],
                steps: [
                    { title: '添加出发点', description: '在地图上点击选择出发位置' },
                    { title: '添加途经点', description: '继续添加想要游览的地点' },
                    { title: '添加终点', description: '设置旅程的结束位置' },
                    { title: '完善信息', description: '为地点添加描述和图片' }
                ]
            },
            {
                id: 'location-types',
                question: '地点类型有什么区别？',
                answer: '系统支持三种地点类型：<br/><strong>出发点</strong>：旅程的起始位置，每个规划只能有一个<br/><strong>途经点</strong>：中间要游览的地点，可以有多个<br/><strong>终点</strong>：旅程的结束位置，每个规划只能有一个',
                priority: 'high',
                tags: ['地点', '类型', '规划']
            },
            {
                id: 'save-plan',
                question: '如何保存我的旅游规划？',
                answer: '您的规划会自动保存到浏览器本地存储中。您也可以：<br/>1. 点击"保存规划"按钮手动保存<br/>2. 在"已保存规划"页面查看所有规划<br/>3. 使用导出功能将规划保存为图片',
                priority: 'medium',
                tags: ['保存', '存储', '导出']
            }
        ]
    },
    {
        name: 'common',
        title: '常见问题',
        icon: QuestionFilled,
        faqs: [
            {
                id: 'route-not-showing',
                question: '为什么地点之间没有显示路线？',
                answer: '可能的原因包括：<br/>1. 地点数量不足（至少需要2个地点）<br/>2. 网络连接问题导致路线计算失败<br/>3. 地点位置过于偏远，无法计算路线<br/>请检查网络连接并确保地点位置准确。',
                priority: 'high',
                tags: ['路线', '连接', '问题'],
                steps: [
                    { title: '检查地点数量', description: '确保至少有2个地点' },
                    { title: '检查网络连接', description: '确保网络连接正常' },
                    { title: '验证地点位置', description: '确认地点位置准确' },
                    { title: '重新计算路线', description: '尝试刷新页面重新计算' }
                ]
            },
            {
                id: 'export-failed',
                question: '导出图片失败怎么办？',
                answer: '导出失败的常见解决方法：<br/>1. 确保浏览器支持图片导出功能<br/>2. 检查是否有足够的内存空间<br/>3. 尝试减少地点数量或图片大小<br/>4. 使用Chrome或Firefox等现代浏览器',
                priority: 'medium',
                tags: ['导出', '图片', '失败'],
                relatedLinks: [
                    { title: '浏览器兼容性说明', url: '#' },
                    { title: '导出功能使用指南', url: '#' }
                ]
            },
            {
                id: 'mobile-usage',
                question: '在手机上如何使用？',
                answer: '移动端使用建议：<br/>1. 使用横屏模式获得更好体验<br/>2. 双指缩放地图查看详情<br/>3. 长按地图添加地点<br/>4. 使用侧边栏访问功能面板',
                priority: 'medium',
                tags: ['移动端', '手机', '操作']
            }
        ]
    },
    {
        name: 'technical',
        title: '技术问题',
        icon: Setting,
        faqs: [
            {
                id: 'browser-support',
                question: '支持哪些浏览器？',
                answer: '推荐使用以下浏览器的最新版本：<br/>• Chrome 80+<br/>• Firefox 75+<br/>• Safari 13+<br/>• Edge 80+<br/>不支持IE浏览器。',
                priority: 'low',
                tags: ['浏览器', '兼容性', '支持']
            },
            {
                id: 'data-storage',
                question: '数据存储在哪里？',
                answer: '您的数据完全存储在本地浏览器中，包括：<br/>• 旅游规划信息<br/>• 地点详情和图片<br/>• 用户设置<br/>我们不会收集或上传您的个人数据到服务器。',
                priority: 'medium',
                tags: ['数据', '存储', '隐私']
            },
            {
                id: 'performance-issues',
                question: '页面运行缓慢怎么办？',
                answer: '性能优化建议：<br/>1. 清理浏览器缓存<br/>2. 关闭其他不必要的标签页<br/>3. 减少同时显示的地点数量<br/>4. 压缩或删除大尺寸图片<br/>5. 使用较新的设备和浏览器',
                priority: 'low',
                tags: ['性能', '优化', '缓慢']
            }
        ]
    }
]

// 计算属性
const allFAQs = computed(() => {
    return faqCategories.flatMap(category => category.faqs)
})

const filteredFAQs = computed(() => {
    if (!props.searchQuery) return []

    const query = props.searchQuery.toLowerCase()
    return allFAQs.value.filter(faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.tags?.some(tag => tag.toLowerCase().includes(query))
    )
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

const selectFAQ = (faq: any) => {
    selectedFAQ.value = faq
    showFAQDetail.value = true
}

const searchByTag = (tag: string) => {
    emit('search', tag)
    showFAQDetail.value = false
}

const submitFeedback = (type: 'helpful' | 'not-helpful') => {
    // 这里可以发送反馈到分析服务
    const message = type === 'helpful' ? '感谢您的反馈！' : '我们会继续改进这个回答。'
    ElMessage.success(message)
}
</script>

<style scoped lang="scss">
.faq-guide {
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
                    flex-shrink: 0;
                }

                span {
                    flex: 1;
                    font-size: 14px;
                    color: var(--el-text-color-primary);
                }
            }
        }
    }

    .faq-categories {
        .faq-category {
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

                .category-count {
                    margin-right: 8px;
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
                .faq-item {
                    border-top: 1px solid var(--el-border-color-lighter);
                    cursor: pointer;
                    transition: background-color 0.2s;

                    &:hover {
                        background: var(--el-bg-color-page);
                    }

                    .faq-question {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 16px;

                        .el-icon {
                            color: var(--el-color-primary);
                            flex-shrink: 0;
                        }

                        span {
                            flex: 1;
                            font-size: 14px;
                            color: var(--el-text-color-primary);
                            font-weight: 500;
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

.faq-detail {
    .answer-content {
        .answer-text {
            margin-bottom: 20px;
            line-height: 1.6;
            color: var(--el-text-color-regular);

            :deep(strong) {
                color: var(--el-text-color-primary);
                font-weight: 600;
            }

            :deep(br) {
                margin-bottom: 8px;
            }
        }

        .answer-steps {
            margin-bottom: 20px;

            h4 {
                margin: 0 0 16px 0;
                font-size: 16px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }
        }

        .related-links {
            margin-bottom: 20px;

            h4 {
                margin: 0 0 12px 0;
                font-size: 16px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }

            .links-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
        }

        .faq-tags {
            h4 {
                margin: 0 0 12px 0;
                font-size: 16px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }

            .tags-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;

                .el-tag {
                    cursor: pointer;
                    transition: all 0.2s;

                    &:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                }
            }
        }
    }

    .faq-feedback {
        .feedback-section {
            text-align: center;

            p {
                margin: 0 0 16px 0;
                color: var(--el-text-color-regular);
            }

            .feedback-actions {
                display: flex;
                justify-content: center;
                gap: 12px;
            }
        }
    }
}

// 响应式设计
@media (max-width: 768px) {
    .faq-guide {
        .faq-categories {
            .faq-category {
                .category-header {
                    padding: 12px;
                }

                .category-content {
                    .faq-item {
                        .faq-question {
                            padding: 12px;
                            flex-wrap: wrap;
                            gap: 8px;
                        }
                    }
                }
            }
        }
    }

    .faq-detail {
        .faq-feedback {
            .feedback-section {
                .feedback-actions {
                    flex-direction: column;
                    align-items: stretch;
                }
            }
        }
    }
}
</style>
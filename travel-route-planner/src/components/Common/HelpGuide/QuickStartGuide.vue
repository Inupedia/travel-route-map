<template>
    <div class="quick-start-guide">
        <div class="guide-header">
            <el-icon>
                <Compass />
            </el-icon>
            <h3>快速开始使用旅游路线规划器</h3>
        </div>

        <div class="steps-container">
            <el-steps :active="currentStep" direction="vertical" finish-status="success">
                <el-step v-for="(step, index) in steps" :key="index" :title="step.title" :description="step.description"
                    @click="setCurrentStep(index)">
                    <template #icon>
                        <el-icon>
                            <component :is="step.icon" />
                        </el-icon>
                    </template>
                </el-step>
            </el-steps>
        </div>

        <div class="step-detail">
            <div class="detail-content">
                <h4>{{ currentStepData.title }}</h4>
                <p>{{ currentStepData.detail }}</p>

                <div v-if="currentStepData.tips" class="step-tips">
                    <el-alert :title="currentStepData.tips" type="info" :closable="false" show-icon />
                </div>

                <div v-if="currentStepData.demo" class="step-demo">
                    <el-image :src="currentStepData.demo" :alt="currentStepData.title" fit="contain"
                        style="width: 100%; max-height: 200px;">
                        <template #error>
                            <div class="demo-placeholder">
                                <el-icon>
                                    <Picture />
                                </el-icon>
                                <span>演示图片</span>
                            </div>
                        </template>
                    </el-image>
                </div>
            </div>

            <div class="step-actions">
                <el-button v-if="currentStep > 0" @click="previousStep" :icon="ArrowLeft">
                    上一步
                </el-button>
                <el-button v-if="currentStep < steps.length - 1" type="primary" @click="nextStep" :icon="ArrowRight">
                    下一步
                </el-button>
                <el-button v-else type="success" @click="completeGuide" :icon="Check">
                    完成指引
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
    Compass,
    MapLocation,
    Connection,
    Calendar,
    Download,
    Picture,
    ArrowLeft,
    ArrowRight,
    Check
} from '@element-plus/icons-vue'

// 响应式数据
const currentStep = ref(0)

// 步骤配置
const steps = [
    {
        title: '添加地点',
        description: '在地图上标记您想要游览的地点',
        icon: MapLocation,
        detail: '点击地图上的任意位置，或使用搜索功能找到具体地点。为每个地点设置名称、类型（出发点/途经点/终点）和详细信息。',
        tips: '建议先添加出发点，再添加途经点，最后添加终点，这样系统会自动规划最优路线。',
        demo: '/images/help/add-location.png'
    },
    {
        title: '连接路线',
        description: '系统自动连接地点并计算距离时间',
        icon: Connection,
        detail: '添加地点后，系统会自动按照逻辑顺序连接所有地点，并计算每段路线的距离和预估时间。您可以调整地点顺序来优化路线。',
        tips: '可以选择不同的交通方式（步行/驾车/公交）来获得更准确的路线规划。',
        demo: '/images/help/connect-route.png'
    },
    {
        title: '安排行程',
        description: '将地点分配到不同的旅游天数',
        icon: Calendar,
        detail: '设置旅游总天数，然后将各个地点分配到具体的天数。系统会用不同颜色区分不同天的行程安排。',
        tips: '合理安排每天的行程，避免单日行程过于紧张。可以考虑地理位置的远近来分配。',
        demo: '/images/help/plan-days.png'
    },
    {
        title: '完善信息',
        description: '为地点添加图片、描述和标签',
        icon: Picture,
        detail: '点击地点标记可以编辑详细信息，包括上传图片、添加描述文字和特色标签，让您的旅游规划更加丰富。',
        tips: '添加图片和描述有助于后续回忆和分享，建议为重要景点添加详细信息。',
        demo: '/images/help/add-details.png'
    },
    {
        title: '导出分享',
        description: '将完成的路线图导出为图片',
        icon: Download,
        detail: '完成规划后，可以将整个路线图导出为高清图片，方便保存、打印或分享给朋友。',
        tips: '导出的图片包含完整的地图、路线和地点信息，是很好的旅游纪念品。',
        demo: '/images/help/export-plan.png'
    }
]

// 计算属性
const currentStepData = computed(() => steps[currentStep.value])

// 方法
const setCurrentStep = (index: number) => {
    currentStep.value = index
}

const nextStep = () => {
    if (currentStep.value < steps.length - 1) {
        currentStep.value++
    }
}

const previousStep = () => {
    if (currentStep.value > 0) {
        currentStep.value--
    }
}

const completeGuide = () => {
    ElMessage.success('快速入门指引完成！现在您可以开始创建自己的旅游规划了。')
}
</script>

<style scoped lang="scss">
.quick-start-guide {
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
            margin: 0;
            color: var(--el-text-color-primary);
            font-size: 18px;
            font-weight: 600;
        }
    }

    .steps-container {
        margin-bottom: 24px;

        :deep(.el-steps) {
            .el-step__head {
                cursor: pointer;
            }

            .el-step__title {
                font-weight: 500;
                cursor: pointer;
            }

            .el-step__description {
                cursor: pointer;
            }
        }
    }

    .step-detail {
        background: var(--el-bg-color-page);
        border-radius: 8px;
        padding: 20px;
        border: 1px solid var(--el-border-color-light);

        .detail-content {
            margin-bottom: 20px;

            h4 {
                margin: 0 0 12px 0;
                color: var(--el-text-color-primary);
                font-size: 16px;
                font-weight: 600;
            }

            p {
                margin: 0 0 16px 0;
                color: var(--el-text-color-regular);
                line-height: 1.6;
            }

            .step-tips {
                margin-bottom: 16px;
            }

            .step-demo {
                border-radius: 6px;
                overflow: hidden;
                border: 1px solid var(--el-border-color-lighter);

                .demo-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 120px;
                    color: var(--el-text-color-secondary);
                    background: var(--el-bg-color);

                    .el-icon {
                        font-size: 32px;
                        margin-bottom: 8px;
                    }
                }
            }
        }

        .step-actions {
            display: flex;
            justify-content: space-between;
            gap: 12px;

            .el-button {
                flex: 1;
            }
        }
    }
}

// 响应式设计
@media (max-width: 768px) {
    .quick-start-guide {
        .guide-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            text-align: left;
        }

        .step-detail {
            padding: 16px;

            .step-actions {
                flex-direction: column;

                .el-button {
                    width: 100%;
                }
            }
        }
    }
}
</style>
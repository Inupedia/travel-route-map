<template>
    <div class="location-details-card">
        <!-- 地点头部信息 -->
        <div class="location-header">
            <div class="location-title">
                <el-tag :type="getLocationTypeTagType(location.type)" size="large" class="location-type-tag">
                    {{ getLocationTypeLabel(location.type) }}
                </el-tag>
                <h2 class="location-name">{{ location.name }}</h2>
            </div>
            <div class="location-actions">
                <el-button type="primary" @click="handleEdit">
                    <el-icon>
                        <Edit />
                    </el-icon>
                    编辑地点
                </el-button>
            </div>
        </div>

        <!-- 地点基本信息 -->
        <div class="location-info">
            <el-row :gutter="16">
                <el-col :span="12">
                    <div class="info-item">
                        <el-icon class="info-icon">
                            <Location />
                        </el-icon>
                        <div class="info-content">
                            <div class="info-label">坐标</div>
                            <div class="info-value">{{ formatCoordinates(location.coordinates) }}</div>
                        </div>
                    </div>
                </el-col>
                <el-col :span="12" v-if="location.address">
                    <div class="info-item">
                        <el-icon class="info-icon">
                            <MapLocation />
                        </el-icon>
                        <div class="info-content">
                            <div class="info-label">地址</div>
                            <div class="info-value">{{ location.address }}</div>
                        </div>
                    </div>
                </el-col>
                <el-col :span="12" v-if="location.dayNumber">
                    <div class="info-item">
                        <el-icon class="info-icon">
                            <Calendar />
                        </el-icon>
                        <div class="info-content">
                            <div class="info-label">安排天数</div>
                            <div class="info-value">第{{ location.dayNumber }}天</div>
                        </div>
                    </div>
                </el-col>
                <el-col :span="12" v-if="location.visitDuration">
                    <div class="info-item">
                        <el-icon class="info-icon">
                            <Clock />
                        </el-icon>
                        <div class="info-content">
                            <div class="info-label">游览时长</div>
                            <div class="info-value">{{ location.visitDuration }}分钟</div>
                        </div>
                    </div>
                </el-col>
            </el-row>
        </div>

        <!-- 地点图片展示 -->
        <div v-if="location.images && location.images.length > 0" class="location-images">
            <h3 class="section-title">
                <el-icon>
                    <Picture />
                </el-icon>
                地点图片
            </h3>
            <div class="images-gallery">
                <div v-for="(image, index) in location.images" :key="index" class="image-item"
                    @click="previewImage(index)">
                    <el-image :src="image" :alt="`${location.name} 图片 ${index + 1}`" fit="cover"
                        :preview-src-list="location.images" :initial-index="index" lazy>
                        <template #error>
                            <div class="image-error">
                                <el-icon>
                                    <Picture />
                                </el-icon>
                                <span>加载失败</span>
                            </div>
                        </template>
                    </el-image>
                </div>
            </div>
        </div>

        <!-- 默认占位图 -->
        <div v-else class="location-no-images">
            <h3 class="section-title">
                <el-icon>
                    <Picture />
                </el-icon>
                地点图片
            </h3>
            <div class="no-images-placeholder">
                <el-icon class="placeholder-icon">
                    <Picture />
                </el-icon>
                <p>暂无图片</p>
                <el-button type="primary" text @click="handleEdit">
                    点击编辑添加图片
                </el-button>
            </div>
        </div>

        <!-- 地点描述 -->
        <div v-if="location.description" class="location-description">
            <h3 class="section-title">
                <el-icon>
                    <Document />
                </el-icon>
                地点介绍
            </h3>
            <div class="description-content">
                {{ location.description }}
            </div>
        </div>

        <!-- 地点标签 -->
        <div v-if="location.tags && location.tags.length > 0" class="location-tags">
            <h3 class="section-title">
                <el-icon>
                    <CollectionTag />
                </el-icon>
                特色标签
            </h3>
            <div class="tags-content">
                <el-tag v-for="tag in location.tags" :key="tag" size="large" class="location-tag">
                    {{ tag }}
                </el-tag>
            </div>
        </div>

        <!-- 创建和更新时间 -->
        <div class="location-timestamps">
            <div class="timestamp-item">
                <span class="timestamp-label">创建时间：</span>
                <span class="timestamp-value">{{ formatDate(location.createdAt) }}</span>
            </div>
            <div class="timestamp-item">
                <span class="timestamp-label">更新时间：</span>
                <span class="timestamp-value">{{ formatDate(location.updatedAt) }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Edit, Location, MapLocation, Calendar, Clock, Picture, Document, CollectionTag } from '@element-plus/icons-vue'
import type { Location as LocationType, LocationType as LocationTypeEnum } from '@/types'

interface Props {
    location: LocationType
}

interface Emits {
    (e: 'edit', location: LocationType): void
    (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Methods
const getLocationTypeLabel = (type: LocationTypeEnum): string => {
    switch (type) {
        case 'start':
            return '出发点'
        case 'end':
            return '终点'
        case 'waypoint':
            return '途经点'
        default:
            return '未知'
    }
}

const getLocationTypeTagType = (type: LocationTypeEnum) => {
    switch (type) {
        case 'start':
            return 'success'
        case 'end':
            return 'danger'
        case 'waypoint':
            return 'info'
        default:
            return 'info'
    }
}

const formatCoordinates = (coordinates: { lat: number; lng: number }): string => {
    return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
}

const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date))
}

const handleEdit = () => {
    emit('edit', props.location)
}

const previewImage = (index: number) => {
    // Element Plus image preview will handle this automatically
}
</script>

<style scoped lang="scss">
.location-details-card {
    .location-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--el-border-color-light);

        .location-title {
            flex: 1;

            .location-type-tag {
                margin-bottom: 8px;
            }

            .location-name {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
                color: var(--el-text-color-primary);
            }
        }

        .location-actions {
            flex-shrink: 0;
        }
    }

    .location-info {
        margin-bottom: 24px;

        .info-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 16px;

            .info-icon {
                font-size: 18px;
                color: var(--el-color-primary);
                margin-top: 2px;
                flex-shrink: 0;
            }

            .info-content {
                flex: 1;

                .info-label {
                    font-size: 12px;
                    color: var(--el-text-color-secondary);
                    margin-bottom: 4px;
                }

                .info-value {
                    font-size: 14px;
                    color: var(--el-text-color-primary);
                    font-weight: 500;
                }
            }
        }
    }

    .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0 0 16px 0;

        .el-icon {
            color: var(--el-color-primary);
        }
    }

    .location-images {
        margin-bottom: 24px;

        .images-gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 12px;

            .image-item {
                aspect-ratio: 1;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                border: 1px solid var(--el-border-color-light);
                transition: all 0.2s;

                &:hover {
                    border-color: var(--el-color-primary);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                :deep(.el-image) {
                    width: 100%;
                    height: 100%;
                }

                .image-error {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    font-size: 12px;
                    color: var(--el-text-color-secondary);
                    background: var(--el-bg-color-page);

                    .el-icon {
                        font-size: 24px;
                        margin-bottom: 4px;
                    }
                }
            }
        }
    }

    .location-no-images {
        margin-bottom: 24px;

        .no-images-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            border: 1px dashed var(--el-border-color);
            border-radius: 8px;
            background: var(--el-bg-color-page);

            .placeholder-icon {
                font-size: 48px;
                color: var(--el-text-color-secondary);
                margin-bottom: 12px;
            }

            p {
                margin: 0 0 12px 0;
                color: var(--el-text-color-secondary);
                font-size: 14px;
            }
        }
    }

    .location-description {
        margin-bottom: 24px;

        .description-content {
            padding: 16px;
            background: var(--el-bg-color-page);
            border-radius: 8px;
            line-height: 1.6;
            color: var(--el-text-color-primary);
            font-size: 14px;
        }
    }

    .location-tags {
        margin-bottom: 24px;

        .tags-content {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;

            .location-tag {
                font-size: 13px;
            }
        }
    }

    .location-timestamps {
        padding-top: 16px;
        border-top: 1px solid var(--el-border-color-light);
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        .timestamp-item {
            .timestamp-label {
                margin-right: 4px;
            }

            .timestamp-value {
                font-weight: 500;
            }
        }
    }
}

@media (max-width: 768px) {
    .location-details-card {
        .location-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
        }

        .location-info {
            .el-row {
                .el-col {
                    margin-bottom: 8px;
                }
            }
        }

        .images-gallery {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 8px;
        }

        .location-timestamps {
            flex-direction: column;
            gap: 4px;
        }
    }
}
</style>
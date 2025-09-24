import type { TravelPlan } from '@/types'
import html2canvas from 'html2canvas'

/**
 * 导出服务
 * 负责将旅游规划导出为图片格式
 */
export class ExportService {
    /**
     * 导出规划为PNG格式图片
     */
    async exportToPNG(
        plan: TravelPlan,
        mapElement: HTMLElement,
        options: {
            width?: number
            height?: number
            quality?: number
            includeDetails?: boolean
        } = {}
    ): Promise<Blob> {
        const {
            width = 1920,
            height = 1080,
            quality = 1.0,
            includeDetails = true
        } = options

        try {
            // 创建导出容器
            const exportContainer = this.createExportContainer(plan, mapElement, {
                width,
                height,
                includeDetails
            })

            // 添加到DOM中（隐藏）
            document.body.appendChild(exportContainer)

            try {
                // 使用html2canvas生成图片
                const canvas = await html2canvas(exportContainer, {
                    width,
                    height,
                    scale: quality,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
                })

                // 转换为Blob
                return new Promise((resolve, reject) => {
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob)
                        } else {
                            reject(new Error('生成图片失败'))
                        }
                    }, 'image/png', quality)
                })
            } finally {
                // 清理DOM
                document.body.removeChild(exportContainer)
            }
        } catch (error) {
            throw new Error(`导出PNG失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 导出规划为JPG格式图片
     */
    async exportToJPG(
        plan: TravelPlan,
        mapElement: HTMLElement,
        options: {
            width?: number
            height?: number
            quality?: number
            includeDetails?: boolean
        } = {}
    ): Promise<Blob> {
        const {
            width = 1920,
            height = 1080,
            quality = 0.9,
            includeDetails = true
        } = options

        try {
            // 创建导出容器
            const exportContainer = this.createExportContainer(plan, mapElement, {
                width,
                height,
                includeDetails
            })

            // 添加到DOM中（隐藏）
            document.body.appendChild(exportContainer)

            try {
                // 使用html2canvas生成图片
                const canvas = await html2canvas(exportContainer, {
                    width,
                    height,
                    scale: 1.0,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
                })

                // 转换为Blob
                return new Promise((resolve, reject) => {
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob)
                        } else {
                            reject(new Error('生成图片失败'))
                        }
                    }, 'image/jpeg', quality)
                })
            } finally {
                // 清理DOM
                document.body.removeChild(exportContainer)
            }
        } catch (error) {
            throw new Error(`导出JPG失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 创建导出容器
     */
    private createExportContainer(
        plan: TravelPlan,
        mapElement: HTMLElement,
        options: {
            width: number
            height: number
            includeDetails: boolean
        }
    ): HTMLElement {
        const { width, height, includeDetails } = options

        // 创建主容器
        const container = document.createElement('div')
        container.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: ${width}px;
            height: ${height}px;
            background: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
        `

        // 创建标题区域
        const header = document.createElement('div')
        header.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.95);
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        `

        const title = document.createElement('h1')
        title.textContent = plan.name
        title.style.cssText = `
            margin: 0 0 8px 0;
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
        `

        const subtitle = document.createElement('p')
        subtitle.textContent = `${plan.totalDays}天行程 • ${plan.locations.length}个地点 • 导出时间: ${new Date().toLocaleString('zh-CN')}`
        subtitle.style.cssText = `
            margin: 0;
            font-size: 14px;
            color: #6b7280;
        `

        header.appendChild(title)
        header.appendChild(subtitle)

        // 克隆地图元素
        const mapClone = mapElement.cloneNode(true) as HTMLElement
        mapClone.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        `

        // 添加地点详情面板（如果需要）
        if (includeDetails && plan.locations.length > 0) {
            const detailsPanel = this.createDetailsPanel(plan, width, height)
            container.appendChild(detailsPanel)
        }

        container.appendChild(mapClone)
        container.appendChild(header)

        return container
    }

    /**
     * 创建地点详情面板
     */
    private createDetailsPanel(plan: TravelPlan, containerWidth: number, containerHeight: number): HTMLElement {
        const panel = document.createElement('div')
        panel.style.cssText = `
            position: absolute;
            top: 120px;
            right: 20px;
            width: 300px;
            max-height: ${containerHeight - 160}px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow-y: auto;
            z-index: 1000;
        `

        const panelHeader = document.createElement('div')
        panelHeader.style.cssText = `
            padding: 15px 20px;
            border-bottom: 1px solid #e5e7eb;
            font-weight: 600;
            color: #1f2937;
        `
        panelHeader.textContent = '行程安排'

        const locationsList = document.createElement('div')
        locationsList.style.cssText = `
            padding: 15px 20px;
        `

        // 按天数分组显示地点
        const locationsByDay = this.groupLocationsByDay(plan.locations)

        Object.entries(locationsByDay).forEach(([day, locations]) => {
            if (locations.length === 0) return

            const dayHeader = document.createElement('div')
            dayHeader.style.cssText = `
                font-weight: 600;
                color: #374151;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #f3f4f6;
            `
            dayHeader.textContent = `第${day}天`

            locationsList.appendChild(dayHeader)

            locations.forEach((location, index) => {
                const locationItem = document.createElement('div')
                locationItem.style.cssText = `
                    margin-bottom: 12px;
                    padding: 10px;
                    background: #f9fafb;
                    border-radius: 6px;
                    border-left: 3px solid ${this.getLocationTypeColor(location.type)};
                `

                const locationName = document.createElement('div')
                locationName.style.cssText = `
                    font-weight: 500;
                    color: #1f2937;
                    margin-bottom: 4px;
                `
                locationName.textContent = `${index + 1}. ${location.name}`

                const locationInfo = document.createElement('div')
                locationInfo.style.cssText = `
                    font-size: 12px;
                    color: #6b7280;
                `

                const typeText = this.getLocationTypeText(location.type)
                let infoText = typeText

                if (location.visitDuration) {
                    infoText += ` • 预计${location.visitDuration}分钟`
                }

                if (location.description) {
                    infoText += ` • ${location.description.substring(0, 50)}${location.description.length > 50 ? '...' : ''}`
                }

                locationInfo.textContent = infoText

                locationItem.appendChild(locationName)
                locationItem.appendChild(locationInfo)
                locationsList.appendChild(locationItem)
            })
        })

        // 添加路线统计信息
        if (plan.routes.length > 0) {
            const routeStats = document.createElement('div')
            routeStats.style.cssText = `
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #6b7280;
            `

            const totalDistance = plan.routes.reduce((sum, route) => sum + route.distance, 0)
            const totalDuration = plan.routes.reduce((sum, route) => sum + route.duration, 0)

            routeStats.innerHTML = `
                <div style="margin-bottom: 5px;">总距离: ${totalDistance.toFixed(1)} 公里</div>
                <div>总耗时: ${Math.round(totalDuration)} 分钟</div>
            `

            locationsList.appendChild(routeStats)
        }

        panel.appendChild(panelHeader)
        panel.appendChild(locationsList)

        return panel
    }

    /**
     * 按天数分组地点
     */
    private groupLocationsByDay(locations: any[]): Record<string, any[]> {
        const grouped: Record<string, any[]> = {}

        locations.forEach(location => {
            const day = location.dayNumber?.toString() || '1'
            if (!grouped[day]) {
                grouped[day] = []
            }
            grouped[day].push(location)
        })

        return grouped
    }

    /**
     * 获取地点类型颜色
     */
    private getLocationTypeColor(type: string): string {
        switch (type) {
            case 'start':
                return '#10b981' // 绿色
            case 'end':
                return '#ef4444' // 红色
            case 'waypoint':
                return '#3b82f6' // 蓝色
            default:
                return '#6b7280' // 灰色
        }
    }

    /**
     * 获取地点类型文本
     */
    private getLocationTypeText(type: string): string {
        switch (type) {
            case 'start':
                return '出发点'
            case 'end':
                return '终点'
            case 'waypoint':
                return '途经点'
            default:
                return '地点'
        }
    }

    /**
     * 下载文件
     */
    async downloadFile(blob: Blob, filename: string): Promise<void> {
        try {
            // 创建下载链接
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            link.style.display = 'none'

            // 添加到DOM并触发下载
            document.body.appendChild(link)
            link.click()

            // 清理
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error) {
            throw new Error(`下载失败: ${error instanceof Error ? error.message : '未知错误'}`)
        }
    }

    /**
     * 生成文件名
     */
    generateFilename(planName: string, format: 'png' | 'jpg'): string {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
        const safePlanName = planName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
        return `${safePlanName}_${timestamp}.${format}`
    }

    /**
     * 获取导出进度（模拟）
     */
    async exportWithProgress(
        plan: TravelPlan,
        mapElement: HTMLElement,
        format: 'png' | 'jpg',
        options: any = {},
        onProgress?: (progress: number) => void
    ): Promise<Blob> {
        try {
            // 模拟进度更新
            onProgress?.(10)

            // 准备导出
            await new Promise(resolve => setTimeout(resolve, 200))
            onProgress?.(30)

            // 执行导出
            const blob = format === 'png'
                ? await this.exportToPNG(plan, mapElement, options)
                : await this.exportToJPG(plan, mapElement, options)

            onProgress?.(90)

            // 完成
            await new Promise(resolve => setTimeout(resolve, 100))
            onProgress?.(100)

            return blob
        } catch (error) {
            throw error
        }
    }
}

// 创建单例实例
export const exportService = new ExportService()
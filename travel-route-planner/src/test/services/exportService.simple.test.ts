import { describe, it, expect } from 'vitest'
import { exportService } from '@/services/exportService'

describe('ExportService - Simple Tests', () => {
    describe('generateFilename', () => {
        it('应该生成正确的PNG文件名', () => {
            const filename = exportService.generateFilename('测试规划', 'png')

            expect(filename).toMatch(/^测试规划_\d{8}T\d{6}\.png$/)
        })

        it('应该生成正确的JPG文件名', () => {
            const filename = exportService.generateFilename('Test Plan', 'jpg')

            expect(filename).toMatch(/^Test_Plan_\d{8}T\d{6}\.jpg$/)
        })

        it('应该处理特殊字符', () => {
            const filename = exportService.generateFilename('测试/规划:计划', 'png')

            expect(filename).toMatch(/^测试_规划_计划_\d{8}T\d{6}\.png$/)
        })
    })

    describe('service instance', () => {
        it('应该能够创建导出服务实例', () => {
            expect(exportService).toBeDefined()
            expect(typeof exportService.generateFilename).toBe('function')
            expect(typeof exportService.downloadFile).toBe('function')
            expect(typeof exportService.exportToPNG).toBe('function')
            expect(typeof exportService.exportToJPG).toBe('function')
            expect(typeof exportService.exportWithProgress).toBe('function')
        })
    })
})
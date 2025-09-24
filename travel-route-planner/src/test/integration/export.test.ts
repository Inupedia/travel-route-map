import { describe, it, expect, vi } from 'vitest'
import { exportService } from '@/services/exportService'

describe('Export Integration', () => {
    it('应该能够创建导出服务实例', () => {
        expect(exportService).toBeDefined()
        expect(typeof exportService.generateFilename).toBe('function')
        expect(typeof exportService.downloadFile).toBe('function')
    })

    it('应该正确生成文件名', () => {
        const filename = exportService.generateFilename('测试规划', 'png')
        expect(filename).toMatch(/\.png$/)
        expect(filename).toContain('测试规划')
    })

    it('应该处理特殊字符在文件名中', () => {
        const filename = exportService.generateFilename('测试/规划:计划', 'jpg')
        expect(filename).toMatch(/\.jpg$/)
        expect(filename).toContain('测试_规划_计划')
    })
})
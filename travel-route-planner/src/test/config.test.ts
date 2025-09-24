import { describe, it, expect } from 'vitest'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'
import App from '@/App.vue'

describe('Project Configuration', () => {
  it('should create Vue app with all plugins', () => {
    const app = createApp(App)
    const pinia = createPinia()
    
    expect(() => {
      app.use(pinia)
      app.use(ElementPlus)
    }).not.toThrow()
  })

  it('should have Element Plus available', () => {
    expect(ElementPlus).toBeDefined()
    expect(typeof ElementPlus.install).toBe('function')
  })

  it('should have Pinia available', () => {
    const pinia = createPinia()
    expect(pinia).toBeDefined()
    expect(typeof pinia.install).toBe('function')
  })
})
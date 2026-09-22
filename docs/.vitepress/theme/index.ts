import DefaultTheme from 'vitepress/theme'
import { setupMermaidZoom } from './mermaid-zoom'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp() {
    // 只在浏览器执行：构建（SSR）阶段没有 DOM。
    setupMermaidZoom()
  }
}

import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

// 站点部署在 GitHub Pages 的子路径下，图标引用必须带上 base，否则线上 404。
const base = '/knowledge-base/'

export default withMermaid(defineConfig({
  title: '魏威的知识库',
  description: '前端工程化、小程序、浏览器网络、服务端与 AI 工具知识整理',
  lang: 'zh-CN',
  base,
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
    ['link', { rel: 'alternate icon', type: 'image/x-icon', href: `${base}favicon.ico` }],
    ['link', { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.png` }],
    ['meta', { name: 'theme-color', content: '#e35d3f' }]
  ],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '首页', link: '/' },
      { text: '前端工程化', link: '/engineering/npm-ci-vs-install' },
      { text: '小程序', link: '/miniprogram/cold-hot-start' },
      { text: '浏览器与网络', link: '/browser/cors' },
      { text: '服务端', link: '/backend/cache-local-vs-distributed' },
      { text: 'AI 工具', link: '/ai/pi-coding-agent' }
    ],
    sidebar: {
      '/engineering/': [
        {
          text: '前端工程化',
          items: [{ text: 'npm ci 与 npm install', link: '/engineering/npm-ci-vs-install' }]
        }
      ],
      '/miniprogram/': [
        {
          text: '小程序',
          items: [{ text: '冷启动与热启动', link: '/miniprogram/cold-hot-start' }]
        }
      ],
      '/browser/': [
        {
          text: '浏览器与网络',
          items: [{ text: 'CORS 跨域', link: '/browser/cors' }]
        }
      ],
      '/backend/': [
        {
          text: '服务端',
          items: [{ text: '本地缓存与分布式缓存', link: '/backend/cache-local-vs-distributed' }]
        }
      ],
      '/ai/': [
        {
          text: 'AI 工具',
          items: [{ text: 'Pi 编码 agent', link: '/ai/pi-coding-agent' }]
        }
      ]
    },
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/WakerCN/knowledge-base' }],
    footer: {
      message: '持续整理，持续复用。',
      copyright: 'Copyright © 2026 魏威'
    },
    outline: { level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' }
  }
}))

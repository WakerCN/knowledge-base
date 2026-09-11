import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '魏威的知识库',
  description: '前端工程化与小程序开发知识整理',
  lang: 'zh-CN',
  base: '/knowledge-base/',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '首页', link: '/' },
      { text: '前端工程化', link: '/engineering/npm-ci-vs-install' },
      { text: '小程序', link: '/miniprogram/cold-hot-start' }
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
})

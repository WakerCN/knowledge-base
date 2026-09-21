> 🤖 本文档由 AI 辅助生成
>
> 🧠 模型: GPT-5
>
> 👤 生成人: 魏威
>
> 🕐 生成时间: 2026-09-11 17:15:27

<script setup>
import { withBase } from 'vitepress'

const categories = [
  {
    title: '前端工程化',
    description: '把依赖、构建与交付变成可解释、可复现的流程。',
    link: '/engineering/npm-ci-vs-install',
    label: 'npm ci 与 npm install'
  },
  {
    title: '小程序',
    description: '从生命周期到启动体验，记录微信小程序的实践要点。',
    link: '/miniprogram/cold-hot-start',
    label: '冷启动与热启动'
  },
  {
    title: '浏览器与网络',
    description: '搞清浏览器的安全边界，把报错定位到正确的排查层面。',
    link: '/browser/cors',
    label: 'CORS 跨域'
  },
  {
    title: '服务端',
    description: '从前端视角看懂服务端的缓存分层，把性能与一致性讲清楚。',
    link: '/backend/cache-local-vs-distributed',
    label: '本地缓存与分布式缓存'
  },
  {
    title: 'AI 工具',
    description: '看懂新兴编码 agent 的路线差异，把选型依据讲清楚。',
    link: '/ai/pi-coding-agent',
    label: 'Pi 编码 agent'
  }
]
</script>

# 魏威的知识库

面向前端开发的轻量知识库，先把问题讲清楚，再把边界和实践留下来。

<div class="hero-panel">
  <span class="eyebrow">WEB ENGINEERING NOTES</span>
  <h2>把经验整理成下一次可以直接使用的答案。</h2>
  <p>这里收录前端工程化、小程序开发、浏览器网络、服务端与 AI 工具中的概念梳理、代码示例和排查路径。</p>
</div>

## 内容分类

<div class="category-grid">
  <a v-for="category in categories" :key="category.title" class="category-card" :href="withBase(category.link)">
    <span class="card-index">0{{ categories.indexOf(category) + 1 }}</span>
    <h3>{{ category.title }}</h3>
    <p>{{ category.description }}</p>
    <span class="card-link">阅读：{{ category.label }} →</span>
  </a>
</div>

## 阅读方式

- 使用右上角搜索框查找中文关键词。
- 文章中的代码块可以直接复制运行。
- 手机屏幕下会自动切换为单列阅读布局。
- 右上角按钮可以切换明暗主题。

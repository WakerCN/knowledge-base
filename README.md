> 🤖 本文档由 AI 辅助生成
>
> 🧠 模型: GPT-5
>
> 👤 生成人: 魏威
>
> 🕐 生成时间: 2026-09-11 17:15:27

# 魏威的知识库

**🌐 访问地址：<https://wakercn.github.io/knowledge-base/>**

基于 VitePress 的个人知识整理站点，记录前端工程化、小程序、浏览器网络与服务端开发中的可复用知识。

## 本地运行

环境要求：Node.js `20.19.0`、npm `10.8.2`。仓库通过 `.nvmrc` 与 `packageManager` 固定工具链。

```bash
npm ci
npm run docs:dev
```

开发服务器启动后访问终端输出的本地地址。

## 构建与预览

```bash
npm run docs:build
npm run docs:preview
```

生产构建输出到 `docs/.vitepress/dist`。GitHub Pages 使用 `/knowledge-base/` 作为 base 路径。

切换到指定 Node 版本后再安装依赖：

```bash
nvm use
```

## 发布与回退

推送到 `main` 会触发 `.github/workflows/deploy.yml`，通过 GitHub Pages 的 workflow source 发布到：
`https://wakercn.github.io/knowledge-base/`。

需要回退时，优先在目标提交上执行 `git revert <commit>` 并推送到 `main`，让 Pages 工作流重新发布；不要强推历史。若仅需重新发布，可在 GitHub Actions 中重新运行对应的部署工作流。

## 内容结构

- `docs/engineering/`：前端工程化
- `docs/miniprogram/`：微信小程序
- `docs/browser/`：浏览器与网络
- `docs/backend/`：服务端
- `docs/ai/`：AI 工具
- `docs/public/`：站点静态资源（favicon 与品牌标）
- `docs/.vitepress/config.mts`：站点配置、导航和侧边栏

## 品牌标与 favicon

站点图标是一枚「星 + 书」：星取名字里的元素，书表示知识库，底色沿用主题的品牌橙 `#e35d3f`。

| 文件 | 用途 |
| --- | --- |
| `favicon.svg` | 现代浏览器首选，矢量、任意尺寸不失真 |
| `favicon.ico` | 兼容旧浏览器，内含 16 / 32 / 48 三档 |
| `apple-touch-icon.png` | iOS 主屏图标，180×180 满幅不透明（透明角会被系统合成成黑底） |
| `logo.svg` | 顶栏品牌标，与 favicon 同一份图形 |

图标在 `config.mts` 的 `head` 里引用，用的是带 `base` 前缀的绝对路径——站点部署在 GitHub Pages 子路径下，漏掉前缀线上就会 404。

图形本身是手写 SVG（不依赖设计工具导出），几何按 16px 标签页尺寸逐轮渲染校对：五角星的内外半径比取 `0.40`（略胖于几何最优的 `0.382`），书脊缝宽按 16px 下约 1px 设计，都是为了让小尺寸下仍能辨认。

## 写作模板

新文章建议按以下顺序组织：

1. 结论：先回答读者的问题。
2. 原理：解释机制、边界和前置条件。
3. 示例：给出可运行或可迁移的代码片段。
4. 误区：说明常见但不准确的理解。
5. 官方参考：链接到权威文档，并注明适用版本和更新日期。

新建或大幅修改 Markdown 时，请保留文档顶部的 AI 生成标识。

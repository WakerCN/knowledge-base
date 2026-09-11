> 🤖 本文档由 AI 辅助生成
>
> 🧠 模型: GPT-5
>
> 👤 生成人: 魏威
>
> 🕐 生成时间: 2026-09-11 17:15:27

# 魏威的知识库

基于 VitePress 的个人知识整理站点，记录前端工程化与小程序开发中的可复用知识。

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
- `docs/.vitepress/config.mts`：站点配置、导航和侧边栏

## 写作模板

新文章建议按以下顺序组织：

1. 结论：先回答读者的问题。
2. 原理：解释机制、边界和前置条件。
3. 示例：给出可运行或可迁移的代码片段。
4. 误区：说明常见但不准确的理解。
5. 官方参考：链接到权威文档，并注明适用版本和更新日期。

新建或大幅修改 Markdown 时，请保留文档顶部的 AI 生成标识。

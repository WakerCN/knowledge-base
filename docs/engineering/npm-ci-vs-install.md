> 🤖 本文档由 AI 辅助生成
>
> 🧠 模型: GPT-5
>
> 👤 生成人: 魏威
>
> 🕐 生成时间: 2026-09-11 17:15:27

# npm ci 和 npm install：为什么安装结果会不一致？

> 适用版本：npm CLI 11 文档所述行为；概念同样适用于 npm 7+。整理日期：2026-09-11。

## 结论

`npm install`（`npm i`）是“解析并调整项目依赖”的开发命令，`npm ci` 是“按现有锁文件干净还原整个项目”的自动化命令。

但“使用 `npm ci` 就能让所有机器上的 `node_modules` 字节级绝对相同”是过度承诺。锁文件能固定依赖树和包内容的来源，实际结果仍可能受 npm 版本、Node.js 版本、操作系统、CPU/平台可选依赖、安装参数和生命周期脚本影响。

| 维度 | `npm install` / `npm i` | `npm ci` |
| --- | --- | --- |
| 主要用途 | 日常开发、增删或升级依赖 | CI、部署和干净构建 |
| 锁文件 | 依赖范围变化时可能更新 `package-lock.json` | 必须存在并与 `package.json` 同步，不能替你修复 |
| 安装目录 | 尽量增量对齐已有目录 | 安装前自动移除已有 `node_modules` |
| 安装目标 | 可以带包名添加依赖 | 只能安装整个项目，不能带包名 |
| 输出文件 | 可能写入 `package.json` 和 lock | 不写入 `package.json` 或 lock |

## 原理：两个文件各自负责什么

`package.json` 描述“允许使用哪些版本范围”，例如：

```json
{
  "dependencies": {
    "lodash": "^4.17.0"
  }
}
```

`^4.17.0` 表示允许满足该范围的版本；`package-lock.json` 记录一次解析后得到的具体依赖树、版本、下载地址和完整性信息。

### `npm install` 不是每次都升级

不带参数执行 `npm install` 时，npm 会先比较 `package.json` 和 lock：

- lock 中的版本仍满足 `package.json` 范围时，通常沿用 lock 中的精确版本。
- 两者不匹配时，npm 会按 `package.json` 的范围重新解析，并更新 lock。
- 使用 `npm install lodash@...`、修改版本范围或执行更新操作时，依赖树也可能变化。

因此，更准确的说法是：`npm install` **允许重新解析和修改锁文件**，但不是每次运行都会自动升级所有依赖。

### `npm ci` 是严格还原，不是跨环境魔法

`npm ci` 会先校验清单和 lock 是否同步，再删除已有 `node_modules`，按 lock 中的树安装。清单不匹配时直接失败，不会静默修改 lock。

它更适合构建机，因为安装前会清掉本地目录的历史残留；不过需要把生成 lock 时影响依赖树形状的参数（例如 `--legacy-peer-deps`）用项目 `.npmrc` 固化，并让团队统一 Node/npm 版本和平台。

## 为什么 `npm i` 和 `npm ci` 结果可能不同

### 1. lock 已经和清单不一致

`npm install` 可能重新解析并写回 lock；`npm ci` 则报错。两条命令面对同一份不一致输入时，策略本来就不同。

### 2. `node_modules` 带有历史状态

`npm install` 会尽量复用现有目录，目录里如果残留过旧包、手动改过文件，结果可能与从零安装不同。`npm ci` 会先删除它，因此更容易暴露未声明依赖或错误的安装假设。

### 3. 运行环境不一样

可选依赖可能按操作系统、CPU 架构或 libc 不同而选择不同包；原生模块也可能在本机重新编译。Node/npm 版本、安装参数和生命周期脚本同样会影响结果。

### 4. lock、缓存与 registry 不是同一件事

lock 中的 `resolved` 和 `integrity` 用于描述来源和校验，但私有镜像、缓存策略、网络故障或包发布问题仍应纳入构建排查。不要把“依赖树可复现”简单等同于“任何机器的整个磁盘目录都逐字节相同”。

## 示例：推荐的团队流程

开发者新增或调整依赖：

```bash
npm install -D vitepress@1.6.4
git diff -- package.json package-lock.json
git add package.json package-lock.json
git commit -m "chore: update documentation dependency"
```

CI 或部署环境：

```bash
npm ci
npm run docs:build
```

排查差异时，优先固定这些变量：

```bash
node --version
npm --version
npm config list
npm ls --depth=0
```

## 常见误区

- **误区：`npm install` 每次都会升级。** 只有重新解析条件满足时才会改 lock；lock 仍满足范围时通常复用它。
- **误区：`npm ci` 不需要 lock。** 它要求现有 `package-lock.json` 或 shrinkwrap 文件。
- **误区：`npm ci` 可以安装单个包。** 它面向完整项目还原；新增包应使用 `npm install <package>`。
- **误区：有 lock 就能保证所有机器绝对相同。** 还需统一运行时、平台、参数和脚本，并正确处理平台相关依赖。

## 官方参考

- [npm install](https://docs.npmjs.com/cli/v11/commands/npm-install/)：说明 `npm install` 如何使用 lock，以及范围不匹配时的更新规则。
- [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/)：说明 clean install 的前置条件、清理行为和参数要求。
- [package-lock.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json)：说明锁文件如何描述依赖树。

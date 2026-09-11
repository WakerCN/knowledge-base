> 🤖 本文档由 AI 辅助生成
>
> 🧠 模型: GPT-5
>
> 👤 生成人: 魏威
>
> 🕐 生成时间: 2026-09-11 17:15:27

# 微信小程序的冷启动与热启动

> 适用版本：微信小程序基础生命周期模型；具体回收策略以当前客户端版本为准。整理日期：2026-09-11。

## 结论

- **冷启动**：小程序没有可复用的运行实例，需要重新创建运行环境并进入页面。
- **热启动**：小程序实例仍在后台，用户再次进入时恢复到前台；这不是“重新打开一个全新的小程序”。

关键边界是：**启动类型描述 App 实例是否需要创建；页面是否新建，另看页面栈和导航行为。** 热启动时，用户也可能因为跳转到了新页面而触发该页面的 `onLoad`。

## 原理：从 App 实例和页面实例分别看

### 冷启动

首次打开小程序，或小程序后台实例被系统回收后再次打开，客户端需要创建新的 App 运行实例。通常会经历 App 的 `onLaunch`，随后进入目标页面的页面生命周期，如 `onLoad`、`onShow`。

适合放在冷启动路径的内容：读取启动参数、初始化全局配置、建立必要的基础状态。不要在这里无条件塞入大量接口请求，否则首屏会被拖慢。

### 热启动

用户从微信其他页面回到仍在后台的小程序实例时，客户端把已有实例切回前台。此时通常触发 App 的 `onShow`，以及当前页面的 `onShow`；不会重新触发这一实例的 `onLaunch`，当前页面也不会仅因“回前台”重新执行 `onLoad`。

不过，热启动不等于页面永远不变：如果用户在回到小程序后执行了新的页面导航，新页面仍会有自己的 `onLoad`。因此不能只用“热启动 = 只有 onShow”概括所有回前台场景。

## 示例：把初始化和回前台刷新分开

```js
// app.js
App({
  onLaunch(options) {
    // 只做一次的实例级初始化
    this.globalData.launchOptions = options
  },

  onShow(options) {
    // 每次回到前台都可能执行：检查登录态、刷新过期数据等
    this.globalData.lastShowScene = options.scene
  },

  globalData: {
    launchOptions: null,
    lastShowScene: null
  }
})
```

```js
// pages/home/home.js
Page({
  onLoad(query) {
    // 当前页面实例创建时执行一次
    this.loadInitialData(query)
  },

  onShow() {
    // 页面每次显示时执行：按需刷新可变数据
    this.refreshIfExpired()
  }
})
```

实际项目中，`onShow` 可能频繁触发，刷新逻辑应配合时间戳、请求去重和页面可见性设计，避免每次切换都打满接口。

## 误区

- **误区：热启动一定不会触发页面 `onLoad`。** 回到旧页面通常不会，但热启动后导航到新页面时，新页面仍会触发自己的 `onLoad`。
- **误区：冷启动只等于用户第一次打开。** 实例被回收后再打开，同样需要重新创建实例。
- **误区：`onShow` 只在热启动触发。** App 和页面的 `onShow` 也会出现在冷启动后的显示阶段。
- **误区：在 `onLaunch` 里完成所有刷新。** `onLaunch` 属于实例创建阶段，回前台场景要放在 `onShow` 或更细的页面策略中处理。

## 官方参考

- [微信小程序 App 生命周期](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/app.html)：关注 `onLaunch`、`onShow`、`onHide` 和实例生命周期。
- [微信小程序 Page 生命周期](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/page.html)：关注 `onLoad`、`onShow`、`onHide`、`onUnload` 和页面实例。
- [微信小程序路由](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/route.html)：理解页面栈变化与页面是否新建。

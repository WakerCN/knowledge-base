/**
 * Mermaid 图表缩放查看器 —— 零依赖，纯 DOM 实现。
 *
 * 站点原本的图表只有「缩到装得下」：mermaid 生成的是
 * `<svg width="100%" style="max-width: <自然宽>px" viewBox="...">`，
 * 配合 `.mermaid { overflow-x: auto }`，宽图靠横向滚动、窄图永远是小尺寸，
 * 没有任何办法看清细节。
 *
 * 这里的做法是给每张图挂一个右上角按钮，点击后用原生 `<dialog>` 弹出全屏查看器，
 * 在里面用「滚轮以光标为锚点缩放 + 拖拽平移」看细节。交互与分层的依据来自
 * Multica 的实现（`mermaid-viewer` / `zoom-canvas` / `use-zoom-canvas`）：
 *
 *  - 视图变换只作用在内容外层 wrapper 上，不碰 SVG 内部结构；
 *  - wrapper 用 `transform-origin: 0 0` + `translate(x, y) scale(s)`，
 *    数学部分与 DOM 完全解耦（见下方纯函数区）；
 *  - 按钮必须和滚动容器是**兄弟**关系：`.mermaid` 自己是横向滚动容器，
 *    按钮放在它里面会跟着宽图一起滚走；
 *  - 弹窗打开时默认「适应窗口」（fit），不是 100%：小图放大只会糊，
 *    大图又必须装得下，所以 fit = min(1, 视口/内容)；
 *  - 滚轮必须走原生 `addEventListener('wheel', ..., { passive: false })`：
 *    passive 监听里的 preventDefault 不生效，页面会跟着一起滚。
 *
 * 另一个本站特有的坑：`vitepress-plugin-mermaid` 是用 Vue 的 `v-html` 渲染 SVG 的，
 * 主题切换 / 页面重载都会重写 `.mermaid` 的内部，所以按钮只能挂在外层的兄弟节点上，
 * 由 `<div class="kb-mermaid">` 这个外壳提供定位上下文（`.mermaid` 自带 overflow，
 * 不能兼任 position: relative 的宿主，否则按钮依然会被横向滚动带走）。
 */

export interface Size {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

export interface ZoomTransform {
  scale: number
  x: number
  y: number
}

/** 缩放下限。只是默认值：内容大到 25% 还装不下时会被 fit 比例顶下来，见 computeMinScale。 */
export const MIN_SCALE = 0.25
export const MAX_SCALE = 4
/** 键盘 / 按钮的每步缩放倍率，约 4 次按到翻倍。 */
export const ZOOM_STEP = 1.2
/** 方向键每次平移的视口像素。 */
export const PAN_STEP_PX = 48
/** 平移限位：至少保留这么多内容可见，避免一把把图甩出视野只剩空白。 */
const MIN_VISIBLE_PX = 48

/* ───────────────────────── 纯数学（与 DOM 无关） ───────────────────────── */

function hasArea(size: Size): boolean {
  return (
    Number.isFinite(size.width) &&
    Number.isFinite(size.height) &&
    size.width > 0 &&
    size.height > 0
  )
}

export function clampScale(scale: number, minScale: number = MIN_SCALE): number {
  if (!Number.isFinite(scale)) return 1
  return Math.min(MAX_SCALE, Math.max(minScale, scale))
}

/**
 * 「装得下」的缩放比例，且绝不超过自然尺寸（100%）。
 * 小图放进大窗口时应当以 100% 呈现，而不是被放大到看起来是坏的 —— 与 macOS 预览一致。
 * 刻意不在这里兜 MIN_SCALE：比视口高十倍的图就是该以 0.1 打开，否则一进来就已经被裁掉。
 */
export function computeFitScale(content: Size, viewport: Size): number {
  if (!hasArea(content) || !hasArea(viewport)) return 1
  return Math.min(
    MAX_SCALE,
    Math.min(1, viewport.width / content.width, viewport.height / content.height),
  )
}

/** 动态缩放下限：通常是 MIN_SCALE，但永远不会高于 fit 比例。 */
export function computeMinScale(content: Size, viewport: Size): number {
  return Math.min(MIN_SCALE, computeFitScale(content, viewport))
}

function centerTransform(content: Size, viewport: Size, scale: number): ZoomTransform {
  return {
    scale,
    x: (viewport.width - content.width * scale) / 2,
    y: (viewport.height - content.height * scale) / 2,
  }
}

/** 默认视图：适应窗口并居中。 */
export function computeFitTransform(content: Size, viewport: Size): ZoomTransform {
  return centerTransform(content, viewport, computeFitScale(content, viewport))
}

/** 保证至少有 MIN_VISIBLE_PX 的内容留在视口里（内容本身更小时则要求全部可见）。 */
export function clampTransform(
  transform: ZoomTransform,
  content: Size,
  viewport: Size,
): ZoomTransform {
  if (!hasArea(content) || !hasArea(viewport)) return transform

  const scale = clampScale(transform.scale, computeMinScale(content, viewport))
  const scaledWidth = content.width * scale
  const scaledHeight = content.height * scale
  const marginX = Math.min(MIN_VISIBLE_PX, scaledWidth)
  const marginY = Math.min(MIN_VISIBLE_PX, scaledHeight)

  return {
    scale,
    x: Math.min(Math.max(transform.x, marginX - scaledWidth), viewport.width - marginX),
    y: Math.min(Math.max(transform.y, marginY - scaledHeight), viewport.height - marginY),
  }
}

/**
 * 缩放到 nextScale，同时把 anchor（视口坐标）下的那一点钉在原地。
 * 这正是滚轮 / 双指缩放「跟着光标走」而不是往角落飘的原因。
 */
export function zoomToAt(
  transform: ZoomTransform,
  nextScale: number,
  anchor: Point,
  content: Size,
  viewport: Size,
): ZoomTransform {
  const scale = clampScale(nextScale, computeMinScale(content, viewport))
  if (scale === transform.scale) return transform

  const ratio = scale / transform.scale

  return clampTransform(
    {
      scale,
      x: anchor.x - (anchor.x - transform.x) * ratio,
      y: anchor.y - (anchor.y - transform.y) * ratio,
    },
    content,
    viewport,
  )
}

export function zoomByAtCenter(
  transform: ZoomTransform,
  factor: number,
  content: Size,
  viewport: Size,
): ZoomTransform {
  const anchor = { x: viewport.width / 2, y: viewport.height / 2 }
  return zoomToAt(transform, transform.scale * factor, anchor, content, viewport)
}

export function panBy(
  transform: ZoomTransform,
  deltaX: number,
  deltaY: number,
  content: Size,
  viewport: Size,
): ZoomTransform {
  return clampTransform(
    { scale: transform.scale, x: transform.x + deltaX, y: transform.y + deltaY },
    content,
    viewport,
  )
}

export function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function midpointOf(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/**
 * 把滚轮刻度换算成缩放倍率。deltaMode 必须区分：鼠标报的是「行」(1) 或「页」(2)，
 * 触控板报的是像素 (0)，直接比较 deltaY 会让其中一种设备不可用。
 */
export function wheelZoomFactor(deltaY: number, deltaMode: number): number {
  const pixels = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 100 : deltaY
  // 指数映射让缩放对称：等量反向滚动会回到原比例。400 是触控板灵敏度调出来的。
  return Math.exp(-pixels / 400)
}

/* ───────────────────────────── 图标 ───────────────────────────── */

const ICON_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'

const ICON_EXPAND =
  `<svg ${ICON_ATTRS} width="14" height="14"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>`
const ICON_MINUS = `<svg ${ICON_ATTRS} width="16" height="16"><path d="M5 12h14"/></svg>`
const ICON_PLUS =
  `<svg ${ICON_ATTRS} width="16" height="16"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`
const ICON_FIT =
  `<svg ${ICON_ATTRS} width="16" height="16"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2h-3"/><path d="M8 21H5a2 2 0 0 0-2-2v-3"/></svg>`
const ICON_CLOSE =
  `<svg ${ICON_ATTRS} width="16" height="16"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`

/* ───────────────────────────── 弹窗结构 ───────────────────────────── */

const VIEWER_HTML = `
  <div class="kb-mermaid-bar">
    <span class="kb-mermaid-bar-title">图表</span>
    <div class="kb-mermaid-controls">
      <button type="button" class="kb-mermaid-btn" data-act="out" aria-label="缩小" title="缩小">${ICON_MINUS}</button>
      <span class="kb-mermaid-percent" aria-live="polite">100%</span>
      <button type="button" class="kb-mermaid-btn" data-act="in" aria-label="放大" title="放大">${ICON_PLUS}</button>
      <button type="button" class="kb-mermaid-btn" data-act="fit" aria-label="适应窗口" title="适应窗口（0）">${ICON_FIT}</button>
      <button type="button" class="kb-mermaid-btn kb-mermaid-actual" data-act="actual" aria-label="实际大小" title="实际大小 1:1">1:1</button>
    </div>
    <button type="button" class="kb-mermaid-btn kb-mermaid-close" data-act="close" aria-label="关闭" title="关闭（Esc）">${ICON_CLOSE}</button>
  </div>
  <div class="kb-mermaid-canvas" role="application" tabindex="0" aria-label="图表缩放画布：滚轮缩放，拖动平移">
    <div class="kb-mermaid-content"></div>
  </div>
`

/**
 * 取图的自然尺寸。mermaid 的 `<svg>` 上是 `width: 100%` + viewBox，
 * 所以 viewBox 才是真实尺寸；没有 viewBox 时才退回当前渲染盒。
 */
function readNaturalSize(svg: SVGSVGElement): Size {
  const box = svg.viewBox?.baseVal
  if (box && box.width > 0 && box.height > 0) {
    return { width: box.width, height: box.height }
  }
  const rect = svg.getBoundingClientRect()
  return { width: rect.width, height: rect.height }
}

function localPoint(element: HTMLElement, event: { clientX: number; clientY: number }): Point {
  const rect = element.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

/** 打开全屏查看器；同一时刻只允许一个，重复打开会被忽略。 */
let viewerOpen = false

function openViewer(source: HTMLElement, opener: HTMLElement): void {
  if (viewerOpen) return
  const svg = source.querySelector('svg')
  if (!svg) return
  const contentSize = readNaturalSize(svg)
  if (!hasArea(contentSize)) return

  // 克隆现场渲染出来的 SVG：配色（每张图自带的 %%{init}%% themeVariables）
  // 和当前主题完全一致，不需要在查看器里重新渲染一次。
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.removeAttribute('style')
  clone.setAttribute('width', String(contentSize.width))
  clone.setAttribute('height', String(contentSize.height))

  const dialog = document.createElement('dialog')
  dialog.className = 'kb-mermaid-dialog'
  dialog.setAttribute('aria-label', '图表查看器')
  dialog.innerHTML = VIEWER_HTML

  const canvas = dialog.querySelector<HTMLElement>('.kb-mermaid-canvas')!
  const contentEl = dialog.querySelector<HTMLElement>('.kb-mermaid-content')!
  const percentEl = dialog.querySelector<HTMLElement>('.kb-mermaid-percent')!
  const zoomOutBtn = dialog.querySelector<HTMLButtonElement>('[data-act="out"]')!
  const zoomInBtn = dialog.querySelector<HTMLButtonElement>('[data-act="in"]')!
  contentEl.style.width = `${contentSize.width}px`
  contentEl.style.height = `${contentSize.height}px`
  contentEl.appendChild(clone)

  let transform: ZoomTransform = { scale: 1, x: 0, y: 0 }
  let viewport: Size = { width: 0, height: 0 }
  let animated = false
  const activePointers = new Map<number, Point>()
  let panOrigin: { pointer: Point; transform: ZoomTransform } | null = null
  let pinchOrigin: { distance: number; scale: number } | null = null

  const ready = () => hasArea(viewport) && hasArea(contentSize)

  function render(): void {
    contentEl.style.transform =
      `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
    contentEl.classList.toggle('is-animated', animated)
    percentEl.textContent = `${Math.round(transform.scale * 100)}%`
    zoomInBtn.disabled = transform.scale >= MAX_SCALE - 0.001
    zoomOutBtn.disabled = transform.scale <= computeMinScale(contentSize, viewport) + 0.001
  }

  function apply(next: ZoomTransform, ease: boolean): void {
    animated = ease
    transform = next
    render()
  }

  function measure(): void {
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    if (width === viewport.width && height === viewport.height) return
    viewport = { width, height }
    if (ready()) apply(clampTransform(transform, contentSize, viewport), false)
  }

  const fit = () => {
    if (ready()) apply(computeFitTransform(contentSize, viewport), true)
  }
  const zoomBy = (factor: number) => {
    if (ready()) apply(zoomByAtCenter(transform, factor, contentSize, viewport), true)
  }

  /* 弹窗必须先插入文档再 showModal；显示后才有布局盒，才能量视口并 fit。
     用 offsetWidth/offsetHeight 而不是 getBoundingClientRect：后者带 transform，
     弹窗进场动画期间量到的会偏小。 */
  document.body.appendChild(dialog)
  /* 锁滚动的副作用：纵向滚动条消失会把布局视口撑宽，正文会横向抖一下。
     量出滚动条宽度，用 padding-right 补回去。 */
  const scrollbarGap = window.innerWidth - document.documentElement.clientWidth
  if (scrollbarGap > 0) document.documentElement.style.paddingRight = `${scrollbarGap}px`
  dialog.showModal()
  viewerOpen = true
  document.documentElement.classList.add('kb-mermaid-lock')

  viewport = { width: canvas.offsetWidth, height: canvas.offsetHeight }
  apply(computeFitTransform(contentSize, viewport), false)
  canvas.focus({ preventScroll: true })

  /* ── 手势：全部由本文件的监听器驱动，SVG 是 pointer-events: none 的被动内容 ── */

  // 原生非 passive 监听：passive 里 preventDefault 无效，弹窗一滚背景页面会跟着滚。
  const onWheel = (event: WheelEvent) => {
    if (!ready()) return
    event.preventDefault()
    const anchor = localPoint(canvas, event)
    const factor = wheelZoomFactor(event.deltaY, event.deltaMode)
    apply(zoomToAt(transform, transform.scale * factor, anchor, contentSize, viewport), false)
  }
  canvas.addEventListener('wheel', onWheel, { passive: false })

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    animated = false
    const point = localPoint(canvas, event)
    activePointers.set(event.pointerId, point)
    canvas.setPointerCapture?.(event.pointerId)

    const points = [...activePointers.values()]
    if (points.length === 1) {
      panOrigin = { pointer: point, transform }
      pinchOrigin = null
      canvas.classList.add('is-panning')
      return
    }
    if (points.length === 2) {
      // 第二根手指落下：从平移切换到捏合。
      panOrigin = null
      pinchOrigin = { distance: distanceBetween(points[0]!, points[1]!), scale: transform.scale }
      canvas.classList.remove('is-panning')
    }
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!activePointers.has(event.pointerId) || !ready()) return
    const point = localPoint(canvas, event)
    activePointers.set(event.pointerId, point)
    const points = [...activePointers.values()]

    if (points.length >= 2) {
      if (!pinchOrigin || pinchOrigin.distance <= 0) return
      const [first, second] = points as [Point, Point]
      const nextScale =
        pinchOrigin.scale * (distanceBetween(first, second) / pinchOrigin.distance)
      apply(zoomToAt(transform, nextScale, midpointOf(first, second), contentSize, viewport), false)
      return
    }

    if (!panOrigin) return
    apply(
      clampTransform(
        {
          scale: panOrigin.transform.scale,
          x: panOrigin.transform.x + (point.x - panOrigin.pointer.x),
          y: panOrigin.transform.y + (point.y - panOrigin.pointer.y),
        },
        contentSize,
        viewport,
      ),
      false,
    )
  }

  const onPointerUp = (event: PointerEvent) => {
    activePointers.delete(event.pointerId)
    canvas.releasePointerCapture?.(event.pointerId)
    const points = [...activePointers.values()]
    if (points.length === 1) {
      // 捏合中抬起一根手指：从剩下的那根继续平移，而不是卡住等重新触摸。
      panOrigin = { pointer: points[0]!, transform }
      pinchOrigin = null
      return
    }
    if (points.length === 0) {
      panOrigin = null
      pinchOrigin = null
      canvas.classList.remove('is-panning')
    }
  }

  // 双击在「适应窗口」和 100% 之间切换 —— macOS 预览/浏览器通用的看图手势。
  const onDoubleClick = (event: MouseEvent) => {
    if (!ready()) return
    const fitScale = computeFitScale(contentSize, viewport)
    if (Math.abs(transform.scale - fitScale) >= 0.001) {
      apply(computeFitTransform(contentSize, viewport), true)
      return
    }
    // 已经 fit 了：去 100%；fit 本身就是 100%（小图）时去 200%，让手势永远有反馈。
    const next = fitScale < 0.999 ? 1 : 2
    apply(zoomToAt(transform, next, localPoint(canvas, event), contentSize, viewport), true)
  }

  // 键盘监听挂在 dialog 上：点了工具条按钮之后焦点在按钮上，挂在 canvas 上会收不到。
  const onKeyDown = (event: KeyboardEvent) => {
    if (!ready()) return
    switch (event.key) {
      case '+':
      case '=':
        event.preventDefault()
        zoomBy(ZOOM_STEP)
        return
      case '-':
      case '_':
        event.preventDefault()
        zoomBy(1 / ZOOM_STEP)
        return
      case '0':
        event.preventDefault()
        fit()
        return
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight': {
        event.preventDefault()
        const step = event.shiftKey ? PAN_STEP_PX * 3 : PAN_STEP_PX
        const deltaX = event.key === 'ArrowLeft' ? step : event.key === 'ArrowRight' ? -step : 0
        const deltaY = event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0
        apply(panBy(transform, deltaX, deltaY, contentSize, viewport), true)
        return
      }
      default:
    }
  }

  const onClick = (event: MouseEvent) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-act]')
    if (!target) return
    switch (target.dataset.act) {
      case 'out':
        zoomBy(1 / ZOOM_STEP)
        return
      case 'in':
        zoomBy(ZOOM_STEP)
        return
      case 'fit':
        fit()
        return
      case 'actual':
        if (ready()) apply(clampTransform({ scale: 1, x: 0, y: 0 }, contentSize, viewport), true)
        return
      case 'close':
        dialog.close()
        return
      default:
    }
  }

  // 点遮罩关闭。弹窗没有内边距，子元素铺满，所以点击事件落在 dialog 本身时
  // 只可能是背后的遮罩层。
  const onDialogClick = (event: MouseEvent) => {
    if (event.target === dialog) dialog.close()
  }

  const onResize = () => measure()

  dialog.addEventListener('click', onClick)
  dialog.addEventListener('click', onDialogClick)
  dialog.addEventListener('keydown', onKeyDown)
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('dblclick', onDoubleClick)
  window.addEventListener('resize', onResize)

  // Esc 由原生 <dialog> 负责（cancel 事件），这里只做拆解与焦点归还。
  dialog.addEventListener('close', () => {
    window.removeEventListener('resize', onResize)
    canvas.removeEventListener('wheel', onWheel)
    dialog.remove()
    document.documentElement.classList.remove('kb-mermaid-lock')
    document.documentElement.style.paddingRight = ''
    viewerOpen = false
    opener.focus({ preventScroll: true })
  })
}

/* ───────────────────────── 页面扫描与按钮注入 ───────────────────────── */

const READY_FLAG = 'kbMermaidReady'

function enhance(container: HTMLElement): void {
  if (container.dataset[READY_FLAG] === 'yes') return
  // mermaid 是异步渲染的，还没有 <svg> 就等下一次 mutation。
  if (!container.querySelector('svg')) return

  const parent = container.parentElement
  if (!parent) return
  // 已经被外壳包过（理论上不会走到），直接标记完成避免重复注入。
  if (parent.classList.contains('kb-mermaid')) {
    container.dataset[READY_FLAG] = 'yes'
    return
  }

  const shell = document.createElement('div')
  shell.className = 'kb-mermaid'
  parent.insertBefore(shell, container)
  shell.appendChild(container)

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'kb-mermaid-open'
  button.setAttribute('aria-label', '放大查看图表')
  button.title = '放大查看图表'
  button.innerHTML = ICON_EXPAND
  button.addEventListener('click', () => openViewer(container, button))
  shell.appendChild(button)

  container.dataset[READY_FLAG] = 'yes'
}

function scan(): void {
  // 换页后可能留下没有内容的空外壳（Vue 卸载时只摘走自己认识的 .mermaid），清掉。
  document.querySelectorAll<HTMLElement>('.kb-mermaid').forEach((shell) => {
    if (!shell.querySelector('.mermaid')) shell.remove()
  })
  document.querySelectorAll<HTMLElement>('.mermaid').forEach(enhance)
}

let scanScheduled = false
function scheduleScan(): void {
  if (scanScheduled) return
  scanScheduled = true
  requestAnimationFrame(() => {
    scanScheduled = false
    scan()
  })
}

/**
 * 在 `enhanceApp` 里调用一次即可。用 MutationObserver 覆盖所有时机：
 * 首屏渲染、mermaid 异步补上 SVG、主题切换重写 `.mermaid` 内部、路由切换换内容。
 * 按钮挂在外壳上，所以主题切换重写内部时不会被抹掉。
 */
export function setupMermaidZoom(): void {
  if (typeof window === 'undefined' || !document.body) return
  new MutationObserver(scheduleScan).observe(document.body, {
    childList: true,
    subtree: true,
  })
  scheduleScan()
}
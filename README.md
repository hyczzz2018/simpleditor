# Simpleditor

一个轻量级的在线文档编辑器，基于 Vue 2 + Tiptap 3 + Vite 构建，提供类 Word 的排版体验，并内置一套完整的站内批注（评论）能力：选中文本添加批注、正文高亮与侧栏卡片联动、回复 / 解决 / 删除，以及通过 `.docx` 导出再导入恢复批注数据的闭环。

> 项目仓库：<https://github.com/hyczzz2018/simpleditor>
> 协议：Apache-2.0

---

## 目录

- [技术栈](#技术栈)
- [功能特性](#功能特性)
- [项目结构](#项目结构)
- [核心模块说明](#核心模块说明)
- [架构与数据流](#架构与数据流)
- [快速开始](#快速开始)
- [常用命令](#常用命令)
- [导入与导出](#导入与导出)
- [批注系统](#批注系统)
- [本地草稿与自动保存](#本地草稿与自动保存)
- [快捷键](#快捷键)
- [主题与样式](#主题与样式)
- [浏览器兼容性](#浏览器兼容性)
- [部署](#部署)
- [嵌入到其他项目](#嵌入到其他项目)
- [License](#license)

---

## 技术栈

| 分类 | 选型 | 说明 |
| --- | --- | --- |
| 前端框架 | Vue 2.7 | 选项式 API，单文件组件 |
| 状态管理 | Vuex 3 | 维护编辑器全局状态（HTML、只读、保存态、当前排版属性、批注模式等） |
| 构建工具 | Vite 4 + `vite-plugin-vue2` | 开发服务器端口 `5175`，路径别名 `@ -> src` |
| 富文本内核 | Tiptap 3（`@tiptap/vue-2` + `@tiptap/starter-kit` + `@tiptap/pm`） | 基于 ProseMirror，提供编辑器实例与扩展机制 |
| Tiptap 扩展 | `extension-underline` / `extension-link` / `extension-placeholder` / `extension-text-align` / `extension-text-style`（含 `Color` / `FontFamily` / `FontSize` / `BackgroundColor`）/ `extension-table` 系列 | 排版与表格能力 |
| 自研 Tiptap 扩展 | `CommentAnchor`（Mark） / `WordLikeEditing`（Extension） | 批注锚点、类桌面文档键盘行为 |
| 文档处理 | `docx` | 生成 `.docx`（含标准 Word 批注结构与项目快照） |
| 文档解析 | `mammoth` | 将 `.docx` 转为 HTML（无项目快照时回退使用） |
| 压缩包操作 | `jszip` | 读取 / 写入 `.docx` 内部 `customXml` 项目快照 |
| 文件保存 | `file-saver` + `window.showSaveFilePicker` | 优先调用系统「另存为」对话框，不支持时回退为浏览器下载 |
| 其他 | 原生 `DOMParser` / `FileReader` / `localStorage` / `matchMedia` | HTML 解析、文件读取、草稿持久化、主题跟随 |

---

## 功能特性

### 排版能力

- 段落、标题（H1 / H2 / H3）、引用块
- 字体（微软雅黑 / 宋体 / 仿宋 / 楷体 / Arial）、字号（六号 ~ 二号，对应 12px ~ 32px）
- 粗体、斜体、下划线、删除线
- 字体颜色、背景颜色（原生 `<input type="color">`）
- 左对齐 / 居中 / 右对齐 / 两端对齐
- 有序列表、无序列表（`Tab` / `Shift-Tab` 调整层级）
- 链接插入 / 取消（`prompt` 输入地址，自动补全 `https` 协议）
- 表格插入（2×2 / 3×3 / 4×4，可调整列宽，带表头）

### 文档管理

- 新建空白文档（带确认弹窗，避免误清空）
- 导入：`.docx` / `.html` / `.htm` / `.txt`
- 导出：`.html` / `.docx`
- 本地草稿：手动保存 + 防抖自动保存（1s）+ 关闭页面前保存
- 撤销 / 重做
- 只读模式切换

### 批注能力

- 批注模式开关：开启后选中文本即可新建批注
- 正文高亮锚点（基于 Tiptap Mark `commentAnchor`）
- 右侧批注侧栏，正文锚点与侧栏卡片双向联动
- SVG 贝塞尔曲线连接正文高亮与对应卡片
- 批注回复（线程）、解决 / 重新打开、删除（带确认弹窗）
- 高亮状态：激活、悬停、已解决、待处理，分别有独立样式
- 批注数据随本地草稿保存；导出 `.docx` 时写入标准 Word 批注 + 项目快照，再次导入可完整恢复

### 体验细节

- 工具栏自定义浮层下拉（字体 / 字号 / 段落块 / 表格尺寸），自动处理视口越界回退
- 工具栏按钮悬浮 Tooltip（视口边缘自动回退）
- 自定义 Toast 通知（`utils/Message.js`，2.6s 自动消失）
- 自定义确认弹窗（替代浏览器原生 `confirm`）
- 快捷键面板
- 亮 / 暗主题，自动跟随系统 `prefers-color-scheme` 并可手动切换
- 类桌面文档的键盘行为：空标题 / 空引用回车退回正文、表格前空段落退格上顶、空表格整表删除等

---

## 项目结构

```text
simpleditor/
├── index.html                  # 入口 HTML，挂载点 #app
├── package.json                # 依赖与脚本
├── vite.config.js              # Vite 配置（vue2 插件、端口 5175、@ 别名）
├── README.md
└── src/
    ├── main.js                 # 应用入口：注册 Vuex、加载全局 CSS、挂载 App
    ├── App.vue                 # 根组件，渲染 SimpleditorEditor
    ├── assets/css/
    │   ├── style.css           # CSS 变量、应用外壳
    │   ├── global.css          # 全局重置、背景渐变、字体
    │   ├── editor.css          # 编辑区纸张样式、ProseMirror 内容样式、批注高亮
    │   └── components.css      # 工具栏、下拉、批注侧栏、状态栏、弹窗、Tooltip 等
    ├── components/
    │   ├── SimpleditorEditor.vue   # 编辑器总装组件（状态、事件、生命周期中枢）
    │   ├── EditorToolbar.vue       # 工具栏（按钮 + 自定义下拉）
    │   ├── TiptapEditor.vue        # EditorContent 薄封装，转发选区与批注点击
    │   ├── AnnotationSystem.vue    # 批注侧栏（草稿区、卡片列表、回复编辑器）
    │   ├── EditorStatusBar.vue     # 底部状态栏（保存态、字符数、只读切换）
    │   ├── TableSizeSelector.vue   # 表格尺寸选择浮层
    │   ├── ShortcutPanel.vue       # 快捷键面板
    │   ├── Tooltip.vue             # 浮动提示
    │   └── ConfirmationDialog.vue  # 确认弹窗
    ├── composables/
    │   ├── useAnnotations.js   # 批注状态工厂与 CRUD
    │   ├── useEditorState.js   # 编辑器统计、工具栏状态同步
    │   ├── useShortcuts.js     # 全局快捷键注册
    │   └── useTheme.js         # 主题跟随系统偏好
    ├── core/
    │   ├── TiptapCore.js       # Tiptap 编辑器封装 + 扩展装配 + WordLikeEditing
    │   ├── CommentAnchor.js    # 批注锚点 Mark
    │   └── RichTextCore.js     # contentEditable 旧实现（当前主流程未使用，保留备用）
    ├── fileHandlers/
    │   └── WordHandler.js      # 导入 / 导出（docx / html / txt，含项目快照）
    ├── stores/
    │   └── editorStore.js      # Vuex store
    └── utils/
        ├── Console.js          # 带 [Simpleditor] 前缀的日志
        └── Message.js          # DOM Toast 通知
```

---

## 核心模块说明

### `core/TiptapCore.js`

`TiptapCore` 类封装 Tiptap `Editor` 的创建、销毁、只读切换、HTML 读写。`init()` 时装配以下扩展：

- `StarterKit`（关闭 `gapcursor`）
- `WordLikeEditing`：自研 `Extension`，绑定 `Backspace` / `Delete` / `Enter` / `Tab` / `Shift-Tab`，模拟桌面文档行为（空标题回车退段、表格前空段落退格上顶、空表格整表删除、列表缩进 / 提升）
- `Underline` / `TextStyle` / `Color` / `FontFamily` / `FontSize` / `BackgroundColor`
- `CommentAnchor`（自研批注 Mark）
- `Placeholder` / `Link`（默认 `https`、自动链接、不点击打开）/ `TextAlign`（作用于 `heading` 与 `paragraph`）
- `Table` / `TableRow` / `TableHeader` / `TableCell`（可调整列宽）

构造函数接受 `content`、`readOnly` 以及 `onCreate` / `onUpdate` / `onSelectionUpdate` 回调，由上层 `SimpleditorEditor.vue` 注入。

### `core/CommentAnchor.js`

`Mark.create({ name: 'commentAnchor' })`，`inclusive: false`，通过 `data-comment-id` 属性在 HTML 中持久化。提供 `setCommentAnchor` / `unsetCommentAnchor` 命令。HTML 解析规则匹配 `span[data-comment-id]`，导入时即可恢复批注锚点。

### `components/SimpleditorEditor.vue`

整个编辑器的总装中枢（约 830 行），职责包括：

- 实例化 `TiptapCore` 与 `WordHandler`
- 注册全局快捷键、主题控制器、窗口 resize / scroll / beforeunload 监听
- 同步工具栏状态、字符统计、批注高亮 class
- 维护批注状态（`annotationState`）、批注草稿、悬停 / 激活 ID
- 计算并绘制正文锚点 ↔ 批注卡片的 SVG 连线
- 处理导入 / 导出、本地草稿持久化、防抖自动保存
- 协调子组件事件：工具栏意图 → 编辑器命令、批注侧栏交互 → 数据写入

### `components/EditorToolbar.vue`

工具栏只负责分发意图（`$emit`），不直接操作编辑器实例。包含三组 cluster：

1. 文件操作：新建、导入、保存草稿、导出 HTML / DOCX、撤销、重做
2. 排版：字体下拉、字号下拉、粗体 / 斜体 / 下划线 / 删除线、字体颜色、背景颜色
3. 段落与插入：段落块下拉（正文 / H1 / H2 / H3 / 引用）、对齐、表格、有序 / 无序列表、链接、引用
4. 尾部：批注模式、主题切换、快捷键面板

下拉浮层使用 `position: fixed` 并在视口越界时自动回退位置，监听 `resize` / `scroll` 重算。

### `components/AnnotationSystem.vue`

批注侧栏，含：

- 顶部草稿区：展示当前选中文本、批注内容输入框、重置选择 / 添加批注
- 批注卡片列表：作者、状态、时间、内容、引用原文、展开 / 收起回复、回复 / 解决 / 删除操作
- 回复编辑器：同一时间只允许展开一条

侧栏只负责展示与输入，数据写入由 `SimpleditorEditor.vue` 统一处理。

### `fileHandlers/WordHandler.js`

`importFile(file)` 返回 `string`（HTML）或 `{ html, annotations }`：

- `.docx`：优先用 `jszip` 读取 `customXml/simpleditor.xml`（或旧版 `gxjt-editor-ui.xml`）项目快照；损坏或不存在时回退到 `mammoth.convertToHtml`
- `.html` / `.htm`：`FileReader` 读为文本
- `.txt`：按空行分段，行内换行转 `<br>`
- `.doc`：抛错（暂不支持）

`exportHtml(html)` / `exportDocx(html, annotations)`：

- 统一走 `saveBlob`：支持 `showSaveFilePicker` 时弹出系统「另存为」，否则回退 `file-saver` 的 `saveAs`
- `exportDocx` 用 `docx` 库把 HTML 转为 `Paragraph` / `Table` / `TextRun`，命中 `data-comment-id` 时插入 `CommentRangeStart` / `CommentRangeEnd` / `CommentReference`，并生成标准 Word 批注定义；同时通过 `Packer.toBlob` 的 `overrides` 把项目快照写入 `customXml/simpleditor.xml`

### `stores/editorStore.js`

Vuex store 维护全局状态：`html`、`readOnly`、`saved`、`currentBlock`、`currentAlignment`、`currentFontFamily`、`currentFontSize`、`currentTextColor`、`currentBgColor`、`annotationMode`。mutations：`setHtml` / `setReadOnly` / `setSaved` / `patchState`。

### `composables/`

Vue 2 项目中以纯函数形式提供「组合式」能力：

- `useAnnotations.js`：`createAnnotationState` 与 `saveAnnotation` / `replyAnnotation` / `setAnnotationStatus` / `removeAnnotation` / `loadAnnotations` / `resetAnnotationDraft` 等
- `useEditorState.js`：`getEditorMetrics`（字符 / 单词数）、`getToolbarState`（当前格式、块、对齐、字体、字号、颜色）
- `useShortcuts.js`：`registerShortcuts(vm)` 注册全局 `keydown`，返回清理函数
- `useTheme.js`：`createThemeController(vm)` 监听 `prefers-color-scheme`，返回清理函数

---

## 架构与数据流

```text
EditorToolbar ──(emit 意图)──▶ SimpleditorEditor ──(Tiptap chain)──▶ TiptapCore/Editor
                                    │
                                    ├── Vuex store（全局状态）
                                    ├── WordHandler（导入 / 导出）
                                    ├── useAnnotations（批注数据）
                                    ├── useEditorState（统计 / 工具栏同步）
                                    ├── useShortcuts / useTheme
                                    └── localStorage（草稿持久化）

TiptapEditor ──(selection-change / comment-click)──▶ SimpleditorEditor
AnnotationSystem ──(activate / hover / save / reply / resolve / remove)──▶ SimpleditorEditor
                                     │
                                     ▼
                            syncCommentHighlights() / updateAnnotationLine()
                            （正文高亮 class + SVG 连线）
```

- 工具栏不直接操作编辑器，只发出意图；执行集中在 `SimpleditorEditor.vue`
- 批注数据存在组件级 `annotationState`，正文锚点存在 ProseMirror 文档（Mark），两者通过 `commentId` 关联
- 编辑器 `onUpdate` / `onSelectionUpdate` 回调驱动工具栏状态与批注选区捕获

---

## 快速开始

### 环境要求

- Node.js 18 及以上
- npm 9 及以上

### 1. 拉取代码

```bash
git clone https://github.com/hyczzz2018/simpleditor.git
cd simpleditor
```

### 2. 安装依赖

```bash
npm install
```

### 3. 本地开发

```bash
npm run dev
```

默认启动在 <http://localhost:5175>（端口由 `vite.config.js` 指定）。

### 4. 生产构建

```bash
npm run build
```

产物输出到 `dist/`。

### 5. 预览构建产物

```bash
npm run preview
```

---

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动开发服务器（端口 5175） |
| `npm run build` | 生产构建，输出 `dist/` |
| `npm run preview` | 本地预览构建产物 |

---

## 导入与导出

### 导入

支持格式：`.docx` / `.html` / `.htm` / `.txt`（文件选择框还接受 `.doc`，但导入会抛错提示暂不支持）。

| 格式 | 行为 |
| --- | --- |
| `.docx` | 优先读取 `customXml/simpleditor.xml` 项目快照恢复批注；无快照或损坏时回退 `mammoth` 解析正文 |
| `.html` / `.htm` | 直接作为 HTML 内容载入 |
| `.txt` | 按空行切段，行内换行转 `<br>` |
| `.doc` | 抛错，提示「当前仅支持 docx 导入」 |

### 导出

支持格式：`.html` / `.docx`。

- 在支持 `window.showSaveFilePicker` 的浏览器中，导出会弹出系统「另存为」对话框，可自定义文件名与保存目录
- 不支持时回退为浏览器默认下载（`file-saver`）
- 导出 `.docx` 会同时写入：
  1. 标准 Word 批注结构（`CommentRangeStart/End/Reference` + 批注定义），可在 Word 中查看
  2. 项目快照（`customXml/simpleditor.xml`，含 HTML + 批注数据），用于再次导入本项目恢复完整批注线程

---

## 批注系统

实现思路：

1. **正文锚点**：自研 Tiptap Mark `commentAnchor`，命中时给 `<span>` 加 `data-comment-id` 与 `comment-anchor` class
2. **数据模型**：`annotationState.items` 存储批注列表，每条含 `id` / `quote`（引用原文）/ `content` / `from` / `to`（选区位置）/ `author` / `status`（`open` / `resolved`）/ `replies` / `createdAt`
3. **联动**：
   - 正文悬停 / 点击锚点 → 激活对应卡片并滚动定位
   - 卡片悬停 / 点击 → 正文高亮切换 `comment-anchor--active` / `--hover` / `--resolved` 样式
   - SVG 贝塞尔曲线连接正文锚点右侧与卡片左侧，滚动 / 尺寸变化时重算路径
4. **操作**：回复（追加到 `replies` 线程）、解决 / 重新打开（切换 `status`）、删除（先移除正文 Mark，再删除数据，带确认弹窗）
5. **持久化**：随本地草稿保存到 `localStorage`；导出 `.docx` 时写入项目快照，再次导入恢复

---

## 本地草稿与自动保存

- 草稿键：`simpleditor:draft`（兼容读取旧版 `gxjt-editor-ui:draft`，避免项目改名后历史内容丢失）
- 草稿内容：`{ html, annotations, updatedAt }`
- 自动保存：编辑后防抖 1000ms 写入；`beforeunload` 时再保存一次
- 手动保存：工具栏「保存」按钮或 `Ctrl/Cmd + S`
- 新建空白文档会清空草稿键与批注数据

---

## 快捷键

由 `useShortcuts.js` 注册全局监听（`Ctrl` 或 `Cmd`）：

| 快捷键 | 行为 |
| --- | --- |
| `Ctrl/Cmd + S` | 保存本地草稿 |
| `Ctrl/Cmd + O` | 打开导入文件对话框 |
| `Ctrl/Cmd + /` | 显示 / 隐藏快捷键面板 |

以下由 Tiptap `StarterKit` / 扩展默认提供：

| 快捷键 | 行为 |
| --- | --- |
| `Ctrl/Cmd + B` | 粗体 |
| `Ctrl/Cmd + I` | 斜体 |
| `Ctrl/Cmd + U` | 下划线 |
| `Tab` / `Shift-Tab` | 列表项缩进 / 提升（`WordLikeEditing` 扩展） |

> 快捷键面板（`ShortcutPanel.vue`）展示的 `Ctrl+S` 文案为「导出 HTML」，但实际代码行为是「保存本地草稿」，以代码实现为准。

---

## 主题与样式

- 样式拆分为 `global.css` / `style.css` / `editor.css` / `components.css`，使用 CSS 变量（`--gxjt-bg` / `--gxjt-panel` / `--gxjt-line` / `--gxjt-text` / `--gxjt-brand` / `--gxjt-paper` 等）
- 亮 / 暗主题：自动跟随系统 `prefers-color-scheme`（`useTheme.js`），工具栏按钮可手动切换
- 编辑区采用「纸张」视觉：最大宽度 960px 居中，最小高度 920px，圆角与投影
- 暗色模式下编辑纸张仍保持浅色，保证书写舒适度
- 批注高亮四态配色：默认（黄）、激活（红）、悬停（琥珀）、已解决（绿）
- 响应式：视口 ≤ 1080px 时批注侧栏改为单列堆叠，纸张内边距收窄

---

## 浏览器兼容性

- 需要支持 ES Module 与 `showSaveFilePicker` / `matchMedia` / `FileReader` / `DOMParser` 的现代浏览器（Chrome / Edge / Firefox / Safari 近期版本）
- `showSaveFilePicker` 仅 Chromium 系支持，不支持时导出自动回退为下载
- `.doc` 旧版二进制格式不支持导入
- 项目使用 Vue 2.7 + Vite 4，不兼容 IE

---

## 部署

### 静态部署

`npm run build` 产出纯静态文件到 `dist/`，可托管到任意静态服务器或 CDN（Nginx / Vercel / Netlify / GitHub Pages / 对象存储等）。

#### Nginx 示例

```nginx
server {
    listen 80;
    server_name your-domain;
    root /var/www/simpleditor/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Vercel / Netlify

- 构建命令：`npm run build`
- 输出目录：`dist`

> 项目为单页应用且无路由，刷新一般不会 404；`try_files` 兜底是为了保险。

---

## 嵌入到其他项目

项目当前以独立 SPA 形式运行（`index.html` 挂载 `#app`），未配置 Vite 库模式打包。根据宿主环境选择以下方案：

### 方案 A：iframe 嵌入（最简单，零耦合）

1. 将 `dist/` 部署到任一静态路径，例如 `https://your-host/simpleditor/`
2. 在宿主页面用 iframe 引入：

```html
<iframe
  src="https://your-host/simpleditor/index.html"
  width="100%"
  height="800"
  frameborder="0"
  title="Simpleditor"
></iframe>
```

- 优点：隔离样式与依赖，宿主无需关心 Vue 版本
- 限制：跨域下无法直接通过 JS 读取编辑器内容；如需通信，需用 `postMessage` 自行扩展

### 方案 B：作为 Vue 2 组件引入（同栈项目）

适用于宿主也是 Vue 2.7 + Vuex + Vite 的项目。

1. 把 `src/` 下的目录（`components` / `composables` / `core` / `fileHandlers` / `stores` / `utils` / `assets`）拷贝到宿主项目，或以 git submodule 形式引入
2. 安装对等依赖（见 `package.json` 的 `dependencies`）：`vue@2.7`、`vuex@3`、`@tiptap/*`、`docx`、`mammoth`、`jszip`、`file-saver`
3. 在宿主入口注册 Vuex 或复用既有 store；引入所需 CSS：

```js
// main.js（宿主）
import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import editorStore from '@/simpleditor/stores/editorStore'
import '@/simpleditor/assets/css/style.css'
import '@/simpleditor/assets/css/global.css'
import '@/simpleditor/assets/css/editor.css'
import '@/simpleditor/assets/css/components.css'

Vue.use(Vuex)
Vue.config.productionTip = false

new Vue({
  store: editorStore, // 注意：若宿主已有 store，需将 simpleditor 的 state/mutations 合并进去
  render: h => h(App),
}).$mount('#app')
```

4. 在任意页面组件中使用：

```vue
<template>
  <SimpleditorEditor />
</template>

<script>
import SimpleditorEditor from '@/simpleditor/components/SimpleditorEditor.vue'

export default {
  components: { SimpleditorEditor },
}
</script>
```

> 注意：`SimpleditorEditor` 默认会用 `editorStore`，若宿主已有 Vuex store，需要把 `editorStore` 的 `state` / `mutations` 合并到现有 store，避免多 store 冲突。

### 方案 C：改造为库模式打包（需要少量改动）

如需以 npm 包或单文件 JS 形式提供，可在 `vite.config.js` 增加 `build.lib` 配置，以 `SimpleditorEditor.vue` 为入口打包，并 externals 掉 `vue` / `vuex` / `@tiptap/*` 等 peerDependencies。当前仓库未做此配置，需自行扩展。

### 可编程接口说明

当前没有对外暴露命令式 API（如 `getHTML()` / `setHTML()` / `getAnnotations()`）。如需在嵌入场景下读写内容，可：

- 直接使用浏览器 `localStorage` 读写 `simpleditor:draft`（与本地草稿格式一致）
- 或基于 `core/TiptapCore.js` / `fileHandlers/WordHandler.js` 自行实例化（这两个模块是独立类，可直接 import 使用）
- 或在 `SimpleditorEditor.vue` 上扩展自定义事件 / ref 方法

---

## License

[Apache-2.0](LICENSE)

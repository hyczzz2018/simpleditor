# Simpleditor

Simpleditor 是一个基于 Vue 2、Tiptap 3 和 Vite 的在线文档编辑器，支持在线批注。

## 快速部署

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

默认启动后可通过终端输出的本地地址访问编辑器。

### 4. 生产构建

```bash
npm run build
```

### 5. 预览构建产物

```bash
npm run preview
```

## 主要功能

- 基于 `Vue 2 + @tiptap/vue-2 + Vite` 的富文本编辑器
- 标题、字体、字号、粗斜体、下划线、删除线、颜色、对齐、列表、链接等基础排版能力
- 表格插入与编辑
- 批注高亮、侧边栏评论、回复、解决、删除、正文与侧栏联动
- 本地草稿手动保存与自动保存
- 导出时支持系统“另存为”对话框，可自定义文件名和保存目录
- `docx` 导出内置标准批注结构，同时写入项目快照，便于再次导回本项目恢复批注

## 导入与导出

### 导入

当前支持导入以下格式：

- `.docx`
- `.html`
- `.htm`
- `.txt`

说明：
- `.docx` 导入优先读取项目内嵌快照，以恢复批注与编辑内容。
- 如果导入的 `docx` 不包含项目快照，则退回普通文档内容解析。
- 旧版 `.doc` 目前不支持导入。

### 导出

当前支持导出以下格式：

- `.html`
- `.docx`

说明：
- 在支持 `showSaveFilePicker` 的浏览器中，导出会弹出系统保存窗口。
- 在不支持的环境中，会自动回退为浏览器下载。

## 批注说明

当前已实现第一阶段站内批注能力：

- 选中文本后添加批注
- 正文高亮与右侧批注卡片联动
- 支持回复、解决、删除
- 支持本地草稿恢复
- 导出 `docx` 后，再用本项目导入时可恢复批注数据

```text
src/
  assets/css/          样式文件
  components/          Vue 组件
  composables/         编辑器与批注逻辑
  core/                Tiptap 扩展与编辑核心
  fileHandlers/        导入导出处理
  stores/              Vuex 状态
  utils/               通用工具
```

## 常用命令

```bash
npm run dev
npm run build
npm run preview
```

## 技术栈

- Vue 2
- Vuex
- Vite
- Tiptap 3
- docx
- mammoth
- jszip

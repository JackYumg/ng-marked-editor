# ng-marked-editor

基于 **Angular 22** 的 Markdown 编辑器组件库（Standalone + SSR Ready），由原 `ng-plugins/projects/ng-marked-editor` 重构而来，依赖全部改为 **ESM / npm 包**，不再依赖全局 UMD 脚本。

- 组件库：`projects/ng-marked-editor`
- 演示应用（含 SSR）：`projects/demo`
- 包管理器：pnpm
- 支持 SSR 与客户端 hydration

## 功能

- 工具栏：加粗、斜体、下划线、删除线、标题、上下标、引用、有序/无序列表、行内代码、代码块、链接、图片、表格、流程图、公式、撤销/回滚、保存、格式化、放大、全屏、预览/源码切换
- 实时预览（`marked`）
- 代码高亮（`highlight.js`）+ 一键复制
- 数学公式（`katex`）：行内 `$...$` 与行间 `$$...$$`
- Mermaid 图表：流程图 / 时序图 / 状态图 / 类图 / 饼图 / 甘特图 / ER 图
- 主题：`default` / `dark`
- 自定义图片上传 / 内置上传
- 表单集成：实现 `ControlValueAccessor`，可直接 `[(ngModel)]` / Reactive Forms
- 自动保存到 `localStorage`（可开关）
- SSR 安全：服务端渲染 Markdown，Mermaid 输出占位节点，客户端 hydration 后渲染为 SVG

## 环境要求

| 依赖 | 版本 |
| ---- | ---- |
| Node.js | `^22.22.3` \|\| `^24.15.0` \|\| `>=26` |
| pnpm | 10.x |
| Angular | 22.3.x |

若使用 nvm-windows，本项目已附带 `.nvmrc`：

```bash
nvm install 22.22.3
nvm use 22.22.3
node -v   # 需输出 v22.22.3
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动演示应用（开发服务器，默认 http://localhost:4200）
pnpm start

# 若 4200 被占用（或处于 Windows 保留端口段）
pnpm exec ng serve demo --port 4201
```

## 常用脚本

| 命令 | 说明 |
| ---- | ---- |
| `pnpm start` | 启动 demo 开发服务器（带 SSR） |
| `pnpm build:lib` | 构建组件库到 `dist/ng-marked-editor` |
| `pnpm build:demo` | 构建 demo（含 SSR 产物）到 `dist/demo` |
| `pnpm build` | 先构建组件库，再构建 demo |
| `pnpm serve:ssr` | 启动构建后的 SSR 服务（默认 `http://localhost:4000`） |

> `pnpm serve:ssr` 前需先执行 `pnpm build:demo`。

## 目录结构

```
ng-marked-editor/
├── angular.json
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json                 # paths: ng-marked-editor -> projects/ng-marked-editor/src/public-api.ts
├── projects/
│   ├── ng-marked-editor/         # 组件库
│   │   ├── src/
│   │   │   ├── public-api.ts
│   │   │   ├── lib/
│   │   │   │   ├── ng-marked-editor.component.*   # 编辑器主组件
│   │   │   │   ├── tool-bar/                      # 工具栏
│   │   │   │   ├── preview/                       # 预览渲染
│   │   │   │   ├── image-upload/ link-upload/     # 图片 / 链接弹窗
│   │   │   │   ├── main-modal/ md-modal/          # 基于 CDK Overlay 的弹窗
│   │   │   │   ├── services/                      # 配置、撤销栈、存储、操作
│   │   │   │   ├── utils/                         # textarea 选区
│   │   │   │   ├── core/platform.service.ts       # SSR 平台判断
│   │   │   │   ├── types/editor.ts
│   │   │   │   └── data.ts
│   │   │   └── styles/                            # 对外提供的全局样式
│   │   └── package.json
│   └── demo/                     # 演示应用（SSR）
│       └── src/
├── dist/                         # 构建产物
└── README.md
```

## 演示应用

`projects/demo` 展示：

- 编辑器双向绑定 `[(ngModel)]`
- 主题切换（default / dark）
- 自动保存开关
- 自定义上传 vs 内置上传
- `saveChange` 输出事件

## SSR 说明

组件库内部所有浏览器 API 都经过 `PlatformService` 判断：

- `window` / `document` / `localStorage` 在服务端不会访问
- `ViewChild` setter 在 SSR 不执行，事件绑定只发生在浏览器
- 预览使用 `marked` 在服务端生成 HTML
- Mermaid 在服务端输出 `<pre class="mermaid-placeholder" data-mermaid-src="...">`，浏览器端 `afterNextRender` 后动态 `import('mermaid')` 并替换为 SVG

构建并验证 SSR：

```bash
pnpm build:demo
pnpm serve:ssr
# 浏览器访问 http://localhost:4000
```

## 组件库开发

```bash
# 监听构建组件库
pnpm watch:lib
```

由于根 `tsconfig.json` 的 `paths` 指向组件库源码，demo 会直接编译源码，无需先构建 `dist`。

## 样式

需要在使用方全局样式中引入：

```less
@import 'node_modules/@angular/cdk/overlay-prebuilt.css';       /* CDK Overlay */
@import 'node_modules/katex/dist/katex.min.css';                /* 公式字体 */
@import 'node_modules/highlight.js/styles/atom-one-light.css';  /* 代码高亮 */

/* 组件库内置主题与弹窗遮罩 */
@import 'projects/ng-marked-editor/src/styles/theme/index.less';
@import 'projects/ng-marked-editor/src/styles/modal/index.less';
```

图标使用 alicdn iconfont symbol，需要在 `index.html` 引入：

```html
<script src="https://at.alicdn.com/t/font_2605852_khjf435c7th.js"></script>
<script src="https://at.alicdn.com/t/font_2811272_7vmvveil0au.js"></script>
```

详细组件 API 见 [组件库文档](projects/ng-marked-editor/README.md)。

# ng-marked-editor

Angular 22 Standalone Markdown 编辑器组件库，支持 SSR、实时预览、代码高亮、KaTeX 公式与 Mermaid 图表。

## 安装

```bash
npm install ng-marked-editor marked highlight.js katex mermaid
# 可选：工具栏「格式化」按钮需要
npm install prettier
```

依赖说明：

| 包 | 用途 |
| -- | ---- |
| `marked` | Markdown 解析 |
| `highlight.js` | 代码高亮 |
| `katex` | 数学公式 |
| `mermaid` | 图表渲染（浏览器端动态加载） |
| `prettier` | 可选，Markdown 格式化 |

## 快速使用

```ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgMarkedEditorComponent, NgMarkedEditorOption } from 'ng-marked-editor';

@Component({
  selector: 'app-root',
  imports: [FormsModule, NgMarkedEditorComponent],
  template: `
    <ng-marked-editor
      [(ngModel)]="markdown"
      [theme]="'default'"
      [option]="option"
      (saveChange)="onSave($event)">
    </ng-marked-editor>
  `
})
export class AppComponent {
  markdown = '# Hello ng-marked-editor';
  option: NgMarkedEditorOption = {
    saveOption: { autoSave: false },
    customUpload: false
  };

  onSave(value: string): void {
    console.log('save', value);
  }
}
```

编辑器默认高度为 `100%`，请确保父容器有明确高度。

## API

### 输入

| 输入 | 类型 | 默认值 | 说明 |
| ---- | ---- | ------ | ---- |
| `value` | `string` | `''` | Markdown 内容，也可通过 `ngModel` / 表单使用 |
| `theme` | `ThemeType` | `'default'` | 主题，内置 24 套，见下方「主题清单」 |
| `option` | `NgMarkedEditorOption` | 见下 | 编辑器配置 |
| `fileUploadChange` | `(file: File) => Promise<string> \| Observable<string>` | - | 自定义上传回调，需返回文件地址 |
| `disabled` | `boolean` | `false` | 表单禁用状态 |
| `readonly` | `boolean` | `false` | 只读模式：内容不可编辑，编辑类工具栏按钮禁用，预览 / 源码 / 全屏仍可用 |

### 输出

| 输出 | 类型 | 说明 |
| ---- | ---- | ---- |
| `saveChange` | `EventEmitter<string>` | 点击工具栏「保存」时触发 |

### NgMarkedEditorOption

```ts
interface NgMarkedEditorOption {
  saveOption: {
    autoSave?: boolean; // 是否每 10s 自动保存到 localStorage
  };
  toolbars?: EditorToolType[]; // 工具栏项（保留字段）
  customUpload?: boolean;      // true 使用 fileUploadChange，false 使用内置上传地址
}
```

### 表单

组件实现了 `ControlValueAccessor`，支持：

```html
<ng-marked-editor [(ngModel)]="markdown"></ng-marked-editor>

<ng-marked-editor [formControl]="control"></ng-marked-editor>
```

## 工具项

```ts
import { defualtToolbars } from 'ng-marked-editor';

console.log(defualtToolbars);
```

包含：`blod`、`underline`、`italic`、`del`、`header`、`sub`、`sup`、`blockquote`、`ul`、`ol`、`inner-code`、`block-code`、`link`、`imgage`、`table`、`liuchengtu`、`gongshi`、`revoke`、`next`、`baocun`、`prettier`、`fangda`、`fullScreen`、`preview`、`coding`、`github`。

> 为兼容旧版本，`blod`、`imgage`、`defualtToolbars` 的拼写保持不变。

## 公式与流程图可视化编辑

工具栏「公式」「流程图」下拉中的 **可视化编辑** 会打开可视化编辑弹窗，适合不熟悉 LaTeX / Mermaid 语法的使用者。

### 公式编辑器

- 左侧符号/结构面板：基础运算、分数与根号、上下标、求和/积分/极限、括号、矩阵/分段、希腊字母、关系与集合、箭头、常用函数。
- 点击符号会在 LaTeX 输入框光标处插入片段，并实时通过 KaTeX 预览。
- 可直接修改 LaTeX 输入框，预览会防抖更新；语法错误时显示错误信息。
- 支持「插入行内公式」与「插入行间公式」，会插入到编辑器当前光标处，有选区时替换选区。
- 打开时若编辑器有选区文本，会自动预填并去除已有的 `$...$`、`$$...$$` 包裹。

### 流程图编辑器

- 支持流程图、时序图、状态图、类图、ER 图、饼图、甘特图。
- 流程图：以表单维护节点（ID、文本、矩形/圆角/菱形/圆形）与连线（起点、终点、标签、实线/虚线/粗线）。
- 时序图：以表单维护参与者与消息（方向、线型）。
- 其他图类型使用源码模式编辑，提供对应模板。
- 右侧 Mermaid 实时预览，配色跟随当前编辑器主题。
- 支持表单 / 源码双向切换；源码语法错误时显示错误信息，不影响插入。
- 点击「插入」会生成 ```` ```mermaid ```` 代码块并插入到光标处；打开时若选区内已有 `mermaid` 代码块，会自动预填并进入源码模式。

> 可视化编辑器仅为便捷入口，原有下拉中的快速插入模板选项保持不变；只读模式下入口为禁用状态。

## 快捷键

快捷键默认跨平台：`mod` 在 macOS 为 `Cmd`，其他平台为 `Ctrl`。

| 动作 | 键位 | 说明 |
| ---- | ---- | ---- |
| bold | `mod+b` | 加粗 |
| italic | `mod+i` | 斜体 |
| underline | `mod+u` | 下划线 |
| strikeThrough | `mod+shift+x` | 删除线 |
| inlineCode | `mod+e` | 行内代码 |
| blockCode | `mod+shift+e` | 代码块 |
| insertLink | `mod+k` / `mod+shift+k` | 打开链接弹窗（Chrome 会占用 `Ctrl+K`，建议用 `mod+shift+k`） |
| undo | `mod+z` | 撤销 |
| redo | `mod+shift+z` / `mod+y` | 重做 |
| save | `mod+s` | 保存并触发 `saveChange` |
| closeModal | `escape` | 关闭弹窗 |

```ts
import { NgMarkedEditorOption, EditorShortcutMap } from 'ng-marked-editor';

const shortcuts: EditorShortcutMap = {
  bold: 'mod+alt+b',          // 覆盖默认键位
  italic: null,                // 禁用斜体快捷键
  redo: ['mod+shift+z', 'mod+y']
};

const option: NgMarkedEditorOption = {
  saveOption: { autoSave: false },
  shortcuts
};
```

> 快捷键命中时会阻止浏览器默认行为；只读模式下编辑类快捷键不生效；配置为 `null` 可禁用单个动作。

## 单独使用预览组件

```ts
import { Component } from '@angular/core';
import { NgMarkedPreviewComponent } from 'ng-marked-editor';

@Component({
  selector: 'app-preview',
  imports: [NgMarkedPreviewComponent],
  template: `<lib-ng-marked-preview [context]="markdown" theme="dark"></lib-ng-marked-preview>`
})
export class PreviewComponent {
  markdown = '# Preview';
}
```

| 输入 | 说明 |
| ---- | ---- |
| `context` | Markdown 文本 |
| `theme` | `ThemeType`，内置 24 套主题 |
| `scrollH` | 滚动比例（0~1），用于与编辑器同步滚动 |

| 输出 | 说明 |
| ---- | ---- |
| `valueChange` | 渲染后的 HTML |
| `scrollEvent` | 预览区滚动事件 |

## 样式

在应用全局样式中引入（顺序建议如下）：

```less
@import 'node_modules/@angular/cdk/overlay-prebuilt.css';
@import 'node_modules/katex/dist/katex.min.css';
@import 'node_modules/highlight.js/styles/atom-one-light.css';

/* 组件库主题：默认 / 深色、代码复制按钮 */
@import 'node_modules/ng-marked-editor/styles/theme/index.less';

/* 弹窗遮罩层 */
@import 'node_modules/ng-marked-editor/styles/modal/index.less';
```

在本仓库开发时使用源码路径：

```less
@import 'projects/ng-marked-editor/src/styles/theme/index.less';
@import 'projects/ng-marked-editor/src/styles/modal/index.less';
```

图标依赖 iconfont symbol，在 `index.html` 中加入：

```html
<script src="https://at.alicdn.com/t/font_2605852_khjf435c7th.js"></script>
<script src="https://at.alicdn.com/t/font_2811272_7vmvveil0au.js"></script>
```

### 主题清单与按需引入

组件内置 24 套主题，通过 `[theme]` 切换；每套主题对应 `styles/theme/` 下的同名文件。

**GitHub 家族**

| 主题 | `theme` 值 |
| ---- | ---------- |
| GitHub Light（默认） | `'default'` |
| GitHub Dark | `'dark'` |
| GitHub Dark Dimmed | `'github-dark-dimmed'` |
| GitHub Dark High Contrast | `'github-high-contrast'` |
| GitHub Light High Contrast | `'github-light-high-contrast'` |

**编辑器家族**

| 主题 | `theme` 值 | 主题 | `theme` 值 |
| ---- | ---------- | ---- | ---------- |
| VS Code Dark+ | `'vscode-dark'` | VS Code Light+ | `'vscode-light'` |
| One Dark | `'one-dark'` | One Light | `'one-light'` |
| Dracula | `'dracula'` | Nord | `'nord'` |
| Solarized Dark | `'solarized-dark'` | Solarized Light | `'solarized-light'` |
| Gruvbox | `'gruvbox'` | Tokyo Night | `'tokyo-night'` |
| Monokai | `'monokai'` | Catppuccin Mocha | `'catppuccin-mocha'` |
| Catppuccin Latte | `'catppuccin-latte'` |  |  |

**文档 / 印刷风**

| 主题 | `theme` 值 | 特点 |
| ---- | ---------- | ---- |
| GitLab | `'gitlab'` | 橙色强调、链接下划线 |
| Notion | `'notion'` | 无标题底边框、4px 圆角 |
| GitBook | `'gitbook'` | 宽松行距、阅读型排版 |
| Material | `'material'` | 卡片圆角 + 阴影 |
| 纯白文档 | `'plain'` | 无斑马纹、无标题底边框 |
| 报纸印刷 | `'paper'` | 衬线字体、首字下沉 |

按需引入（`styles/theme/core.less` 为公共结构样式，会自动带上）：

```less
/* 全部主题，支持运行时切换（推荐） */
@import 'ng-marked-editor/styles/theme/index.less';

/* 只引入其中一套，页面固定 [theme]="'dracula'" */
@import 'ng-marked-editor/styles/theme/dracula.less';

/* 按需组合多套 */
@import 'ng-marked-editor/styles/theme/default.less';
@import 'ng-marked-editor/styles/theme/paper.less';
```

> 只引入部分主题时不要切换到未引入的主题，否则缺少 `--md-*` 变量。
> 弹窗与浮层自带浅 / 深两套 `--mo-*` token，深色主题会自动使用深色卡片；遮罩统一由 `styles/modal/index.less` 提供。
> 如需同步宿主页面深浅色，可使用导出的 `DARK_THEMES` 或 `isDarkTheme(theme)`。

### 主题变量

预览区与弹窗 / 浮层的颜色均由 CSS 变量驱动，可在全局样式中覆盖：

| 作用域 | 变量 | 说明 |
| ------ | ---- | ---- |
| 预览区 | `--md-text` / `--md-text-muted` | 正文 / 次要文字 |
| 预览区 | `--md-bg` / `--md-surface` | 容器 / 代码块、表头背景 |
| 预览区 | `--md-border` / `--md-quote-border` | 边框 / 引用左侧条 |
| 预览区 | `--md-inline-code-bg` / `--md-table-stripe` | 行内代码 / 表格斑马纹 |
| 预览区 | `--md-link` / `--md-code-btn-bg` | 链接 / 复制按钮背景 |
| 弹窗与浮层 | `--mo-bg` / `--mo-surface` / `--mo-hover` | 卡片、次级按钮 / 悬停背景 |
| 弹窗与浮层 | `--mo-text` / `--mo-muted` / `--mo-border` | 文字层级与边框 |
| 弹窗与浮层 | `--mo-primary` / `--mo-primary-hover` / `--mo-focus-ring` | 主色、悬停态、焦点光晕 |
| 弹窗与浮层 | `--mo-shadow` | 卡片与浮层阴影 |

```less
.ng-editor-md-workspace-display.default {
  --md-link: #0b6bcb;
}

.default-modal {
  background-color: rgba(31, 35, 40, .6);
}
```

深色主题的代码高亮（`.hljs-*`）已由组件库内部覆盖，无需额外引入 dark 高亮 CSS。


## SSR

组件库可直接在 Angular SSR 中使用，无需 `isPlatformBrowser` 包裹：

- 服务端不会访问 `window` / `document` / `localStorage`
- Markdown、代码高亮、KaTeX 在服务端直接生成 HTML
- Mermaid 服务端输出占位符，浏览器 hydration 后异步渲染：

```html
<pre class="mermaid-placeholder" data-mermaid-src="...">...</pre>
```

应用侧建议开启 hydration：

```ts
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [provideClientHydration()]
};
```

`mermaid` 只在浏览器端动态 `import`，不会进入服务端渲染关键路径。

## 自定义上传

```ts
fileUploadChange = (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  return fetch('/api/upload', { method: 'POST', body: formData })
    .then((res) => res.json())
    .then((data) => data.url);
};
```

开启 `option.customUpload = true` 后，插入图片时会调用该回调；否则使用组件内置上传地址。

## 与其他渲染器集成

`MarkRenderService` 暴露扩展能力：

```ts
import { MarkRenderService } from 'ng-marked-editor';

const render = inject(MarkRenderService);
render.useRender({ heading: (token) => `...` });
render.useToken({ inlineText: (src) => ... });
```

## 许可证

MIT

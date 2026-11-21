# 快捷键说明

ng-marked-editor 内置一套跨平台快捷键，`mod` 在 macOS 上为 `Cmd`，在 Windows / Linux 上为 `Ctrl`。

## 编辑区快捷键

编辑区快捷键在 Markdown 文本域获得焦点时生效，命中后会阻止浏览器默认行为。

| 动作 | Windows / Linux | macOS | 说明 |
| ---- | --------------- | ----- | ---- |
| `bold` | `Ctrl + B` | `Cmd + B` | 加粗所选文本 |
| `italic` | `Ctrl + I` | `Cmd + I` | 斜体所选文本 |
| `underline` | `Ctrl + U` | `Cmd + U` | 为所选文本添加下划线 |
| `strikeThrough` | `Ctrl + Shift + X` | `Cmd + Shift + X` | 为所选文本添加删除线 |
| `inlineCode` | `Ctrl + E` | `Cmd + E` | 将所选内容转为行内代码 |
| `blockCode` | `Ctrl + Shift + E` | `Cmd + Shift + E` | 插入代码块 |
| `insertLink` | `Ctrl + K` | `Cmd + K` | 打开插入链接弹窗 |
| `undo` | `Ctrl + Z` | `Cmd + Z` | 撤销 |
| `redo` | `Ctrl + Shift + Z` 或 `Ctrl + Y` | `Cmd + Shift + Z` 或 `Cmd + Y` | 重做 |
| `save` | `Ctrl + S` | `Cmd + S` | 立即写入本地存储并触发 `saveChange` 事件 |

> 未选中文本时，格式类动作会插入占位文本（如 `**加粗**`、`*斜体*`、`` `代码` ``）并选中占位内容，直接输入即可替换。

## 全局快捷键

以下快捷键绑定在 `window` 上，不要求文本域聚焦。

| 按键 | 功能 | 说明 |
| ---- | ---- | ---- |
| `F11` | 切换编辑器全屏 | 任何时候按下都会切换全屏状态，并阻止浏览器默认的 F11 行为 |
| `Esc` | 关闭弹窗 | 存在打开的弹窗时关闭全部弹窗（链接、图片、流程图、公式等）；没有弹窗时不拦截浏览器默认行为 |

## 自定义快捷键

通过 `option.shortcuts` 覆盖默认键位，键名为 `EditorShortcutAction`：

```ts
import { NgMarkedEditorOption, EditorShortcutMap } from 'ng-marked-editor';

const shortcuts: EditorShortcutMap = {
  bold: 'mod+alt+b',           // 覆盖默认键位
  italic: null,                // 禁用斜体快捷键
  redo: ['mod+shift+z', 'mod+y'] // 同一动作绑定多个键位
};

const option: NgMarkedEditorOption = {
  saveOption: { autoSave: false },
  shortcuts
};
```

未在 `shortcuts` 中出现的动作沿用默认键位。

### 键位写法

- 使用 `+` 连接修饰键与主键，例如 `mod+shift+z`，不区分大小写。
- 修饰键：

  | 写法 | 含义 |
  | ---- | ---- |
  | `mod` | macOS 为 `Cmd`，其他平台为 `Ctrl` |
  | `ctrl` / `control` | `Ctrl` |
  | `cmd` / `command` / `meta` | `Cmd`（macOS） |
  | `shift` | `Shift` |
  | `alt` / `option` | `Alt`（macOS 为 `Option`） |

- 主键与 `KeyboardEvent.key` 或 `KeyboardEvent.code` 匹配，例如 `b`、`z`、`escape`、`f11`。
- 值可以是字符串、字符串数组（多键位），或 `null`（禁用该动作）。

## 生效规则

- 编辑类快捷键只监听 Markdown 文本域，焦点在页面其他位置时不触发。
- 只读（`readonly`）或禁用（`disabled`）状态下不执行编辑动作；只读时仍会阻止对应的浏览器默认行为，避免误保存网页等操作。
- 输入法组合输入（`isComposing`）期间不触发快捷键。
- 修饰键需完全匹配：若某个动作只配置了 `mod+b`，按 `Ctrl + Shift + B` 不会触发加粗。
- `Esc` 仅在存在打开的弹窗时被拦截，没有弹窗时保留浏览器默认行为。

## 相关源码

- 默认键位与动作类型：[editor.ts](projects/ng-marked-editor/src/lib/types/editor.ts)
- 键位解析与事件绑定：[editor-shortcut.service.ts](projects/ng-marked-editor/src/lib/services/editor-shortcut.service.ts)
- 动作执行：[ng-marked-editor.component.ts](projects/ng-marked-editor/src/lib/ng-marked-editor.component.ts)

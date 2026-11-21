// 主题
export type ThemeType =
  | 'default'
  | 'dark'
  | 'github-dark-dimmed'
  | 'github-high-contrast'
  | 'github-light-high-contrast'
  | 'vscode-dark'
  | 'vscode-light'
  | 'one-dark'
  | 'one-light'
  | 'dracula'
  | 'nord'
  | 'solarized-dark'
  | 'solarized-light'
  | 'gruvbox'
  | 'tokyo-night'
  | 'monokai'
  | 'catppuccin-mocha'
  | 'catppuccin-latte'
  | 'gitlab'
  | 'notion'
  | 'gitbook'
  | 'material'
  | 'plain'
  | 'paper';

// 深色主题集合，用于同步宿主页面配色
export const DARK_THEMES: readonly ThemeType[] = [
  'dark',
  'github-dark-dimmed',
  'github-high-contrast',
  'vscode-dark',
  'one-dark',
  'dracula',
  'nord',
  'solarized-dark',
  'gruvbox',
  'tokyo-night',
  'monokai',
  'catppuccin-mocha'
];

export function isDarkTheme(theme: ThemeType): boolean {
  return DARK_THEMES.includes(theme);
}

// 保存的配置项
export interface SaveOption {
  autoSave?: boolean;
}

// 工具条有哪些功能
export const defualtToolbars: EditorToolType[] = [
  'blod', 'underline', 'italic', 'del', 'header', 'sub', 'sup',
  'blockquote', 'ul', 'ol', 'inner-code', 'block-code', 'link', 'imgage',
  'table', 'liuchengtu', 'gongshi', 'revoke', 'next', 'baocun', 'prettier',
  'fangda', 'fullScreen', 'preview', 'coding', 'github'
];

export type EditorToolType =
  | 'blod' | 'underline' | 'italic' | 'del' | 'header' | 'sub' | 'sup'
  | 'blockquote' | 'ul' | 'ol' | 'inner-code' | 'block-code' | 'link' | 'imgage'
  | 'table' | 'liuchengtu' | 'gongshi' | 'revoke' | 'next' | 'baocun' | 'prettier'
  | 'fangda' | 'fullScreen' | 'preview' | 'coding' | 'github';

// 给编辑框定义的类型
export interface NgMarkedEditorOption {
  saveOption: SaveOption;
  toolbars?: EditorToolType[];
  customUpload?: boolean; // 是否自定义上传，默认 true；false 时文件上传到默认地址
  shortcuts?: EditorShortcutMap; // 自定义快捷键，null 表示禁用该动作
}

// 工具栏图标信息
export interface ToolItem {
  name: string;
}

// 当前选中信息
export interface MdSelection {
  index: number;
  text: string;
  rowNum: number;
}

// 操作完成后返回的内容
export interface ResTrans {
  value: string;
  selectStart: number;
  selectEnd: number;
}

// 可视化编辑插入类型
export type VisualInsertKind = 'inline-formula' | 'block-formula' | 'mermaid';

// 可视化编辑插入载荷
export interface VisualInsertPayload {
  kind: VisualInsertKind;
  content: string; // 不带包裹符的原始内容
}

// 快捷键动作
export type EditorShortcutAction =
  | 'bold' | 'italic' | 'underline' | 'strikeThrough'
  | 'inlineCode' | 'blockCode' | 'insertLink'
  | 'undo' | 'redo' | 'save' | 'closeModal';

// 单个动作的键位配置：字符串、多键位数组，或 null 表示禁用
export type EditorShortcutBinding = string | readonly string[] | null;

// 快捷键配置
export type EditorShortcutMap = Partial<Record<EditorShortcutAction, EditorShortcutBinding>>;

// 默认快捷键（mod 在 macOS 为 Cmd，其他平台为 Ctrl）
export const DEFAULT_EDITOR_SHORTCUTS: Readonly<Record<EditorShortcutAction, readonly string[]>> = {
  bold: ['mod+b'],
  italic: ['mod+i'],
  underline: ['mod+u'],
  strikeThrough: ['mod+shift+x'],
  inlineCode: ['mod+e'],
  blockCode: ['mod+shift+e'],
  insertLink: ['mod+k', 'mod+shift+k'],
  undo: ['mod+z'],
  redo: ['mod+shift+z', 'mod+y'],
  save: ['mod+s'],
  closeModal: ['escape']
};

// 合并用户配置与默认键位（用户传入 null 表示禁用该动作）
export function resolveShortcutMap(overrides?: EditorShortcutMap): EditorShortcutMap {
  return { ...DEFAULT_EDITOR_SHORTCUTS, ...(overrides || {}) };
}

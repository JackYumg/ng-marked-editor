import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isDarkTheme, NgMarkedEditorComponent, NgMarkedEditorOption, ThemeType } from 'ng-marked-editor';

const THEME_GROUPS: { label: string; themes: { value: ThemeType; label: string }[] }[] = [
  {
    label: 'GitHub',
    themes: [
      { value: 'default', label: 'GitHub Light' },
      { value: 'dark', label: 'GitHub Dark' },
      { value: 'github-dark-dimmed', label: 'GitHub Dark Dimmed' },
      { value: 'github-high-contrast', label: 'GitHub Dark High Contrast' },
      { value: 'github-light-high-contrast', label: 'GitHub Light High Contrast' }
    ]
  },
  {
    label: '编辑器',
    themes: [
      { value: 'vscode-dark', label: 'VS Code Dark+' },
      { value: 'vscode-light', label: 'VS Code Light+' },
      { value: 'one-dark', label: 'One Dark' },
      { value: 'one-light', label: 'One Light' },
      { value: 'dracula', label: 'Dracula' },
      { value: 'nord', label: 'Nord' },
      { value: 'solarized-dark', label: 'Solarized Dark' },
      { value: 'solarized-light', label: 'Solarized Light' },
      { value: 'gruvbox', label: 'Gruvbox' },
      { value: 'tokyo-night', label: 'Tokyo Night' },
      { value: 'monokai', label: 'Monokai' },
      { value: 'catppuccin-mocha', label: 'Catppuccin Mocha' },
      { value: 'catppuccin-latte', label: 'Catppuccin Latte' }
    ]
  },
  {
    label: '文档 / 印刷',
    themes: [
      { value: 'gitlab', label: 'GitLab' },
      { value: 'notion', label: 'Notion' },
      { value: 'gitbook', label: 'GitBook' },
      { value: 'material', label: 'Material' },
      { value: 'plain', label: '纯白文档' },
      { value: 'paper', label: '报纸印刷' }
    ]
  }
];

const INITIAL_MARKDOWN = `# NG Marked Editor

一个基于 **Angular 22**、\`marked\` 的 Markdown 编辑器组件，支持实时预览、代码高亮、KaTeX 公式、Mermaid 图表与 **SSR**。

## 功能

- 工具栏快捷操作：加粗、斜体、标题、列表、表格、引用、代码等
- 实时预览与源码查看
- 代码高亮（highlight.js）
- 行内公式 $E = mc^2$ 与行间公式
- Mermaid 流程图/时序图/甘特图等
- 撤销 / 回滚、全屏、放大、自动保存
- 主题切换：24 套内置风格
- 服务端渲染（SSR）安全

## 代码示例

\`\`\`ts
import { Component } from '@angular/core';
import { NgMarkedEditorComponent } from 'ng-marked-editor';

@Component({
  selector: 'app-root',
  imports: [NgMarkedEditorComponent],
  template: \`<ng-marked-editor [(ngModel)]="markdown"></ng-marked-editor>\`
})
export class App {
  markdown = '# Hello';
}
\`\`\`

## 表格

| 能力 | 说明 |
| ---- | ---- |
| 预览 | 实时渲染 Markdown |
| 公式 | KaTeX |
| 图表 | Mermaid |

## 行间公式

$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$

## Mermaid

\`\`\`mermaid
graph TD
A[开始] --> B{是否支持 SSR}
B -->|是| C[服务端渲染占位]
B -->|否| D[仅浏览器渲染]
C --> E[客户端 hydration 后渲染 SVG]
\`\`\`

> 提示：点击工具栏右侧的「预览 / 源码 / 全屏」按钮体验更多能力。
`;

@Component({
  selector: 'app-root',
  imports: [FormsModule, NgMarkedEditorComponent],
  templateUrl: './app.html',
  styleUrl: './app.less'
})
export class App {
  protected readonly title = 'ng-marked-editor';

  markdown = INITIAL_MARKDOWN;

  theme: ThemeType = 'default';

  readonly = false;

  protected readonly themeGroups = THEME_GROUPS;

  get isDark(): boolean {
    return isDarkTheme(this.theme);
  }

  option: NgMarkedEditorOption = {
    saveOption: {
      autoSave: false
    },
    customUpload: false
  };

  lastSaved = '';

  get charCount(): number {
    return this.markdown.replace(/\s/g, '').length;
  }

  fileUploadChange = (file: File): Promise<string> => {
    // 演示：本地生成可访问地址；真实项目可替换为上传接口返回的地址
    return Promise.resolve(URL.createObjectURL(file));
  };

  onSave(value: string): void {
    this.lastSaved = new Date().toLocaleTimeString();
    console.log('[ng-marked-editor] save:', value.length, 'chars');
  }

  reset(): void {
    this.markdown = INITIAL_MARKDOWN;
  }
}

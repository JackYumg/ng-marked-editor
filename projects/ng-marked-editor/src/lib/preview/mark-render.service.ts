import { Injectable } from '@angular/core';
import hljs from 'highlight.js';
import katex from 'katex';
import { Marked, Tokens } from 'marked';

const copyCodeHtml = '<span class="code-copy">复制代码</span>';

interface MarkedTokenLike {
  text?: string;
  lang?: string;
  raw?: string;
}

/**
 * Markdown 渲染服务。
 * marked / highlight.js / katex 均为纯 JS，可在浏览器与服务端运行；
 * mermaid 依赖真实 DOM，本服务只输出占位节点，由预览组件在浏览器端异步替换。
 */
@Injectable({ providedIn: 'root' })
export class MarkRenderService {
  private readonly marked = new Marked({
    gfm: true,
    breaks: false
  });

  constructor() {
    this.marked.use({
      renderer: {
        code: (token: Tokens.Code) => this.renderCode(token),
        text: (token: Tokens.Text | Tokens.Escape) => this.renderText(token)
      },
      extensions: [this.inlineKatexExtension]
    });
  }

  toHtml(context = ''): string {
    if (!context) {
      return '';
    }
    return this.marked.parse(context, { async: false }) as string;
  }

  /** 开放给使用方的渲染器扩展能力 */
  useRender(renderer: Record<string, unknown>): void {
    this.marked.use({ renderer } as never);
  }

  /** 开放给使用方的 tokenizer 扩展能力 */
  useToken(tokenizer: Record<string, unknown>): void {
    this.marked.use({ tokenizer } as never);
  }

  private renderCode(token: Tokens.Code): string {
    const text = token.text ?? '';
    const lang = ((token.lang || '').match(/\S*/) || [''])[0] || '';

    if (lang === 'mermaid') {
      const encoded = encodeURIComponent(text);
      return `<pre class="mermaid-placeholder" data-mermaid-src="${encoded}"><code>${this.escapeHtml(text)}</code></pre>`;
    }

    let highlighted = this.escapeHtml(text);
    try {
      highlighted = lang
        ? hljs.highlight(text, { language: lang }).value
        : hljs.highlightAuto(text).value;
    } catch {
      highlighted = this.escapeHtml(text);
    }
    return `<pre class="language-${lang}"><code>${highlighted}</code>${copyCodeHtml}</pre>`;
  }

  private renderText(token: Tokens.Text | Tokens.Escape): string {
    const raw = (token as MarkedTokenLike).text || (token as MarkedTokenLike).raw || '';
    const trimmed = raw.trim();
    const match = /^\$\$([\s\S]+)\$\$$/.exec(trimmed);
    if (match) {
      return katex.renderToString(match[1].trim(), {
        displayMode: true,
        throwOnError: false
      });
    }
    return raw;
  }

  /** 行内公式 $...$ */
  private readonly inlineKatexExtension = {
    name: 'inlineKatex',
    level: 'inline' as const,
    start(src: string): number | undefined {
      return src.indexOf('$');
    },
    tokenizer(src: string): { type: string; raw: string; text: string } | undefined {
      const match = /^\$([^$\n]+?)\$/.exec(src);
      if (match) {
        return {
          type: 'inlineKatex',
          raw: match[0],
          text: match[1]
        };
      }
      return undefined;
    },
    renderer(token: MarkedTokenLike): string {
      return katex.renderToString(token.text || '', { throwOnError: false });
    }
  };

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

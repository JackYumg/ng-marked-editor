import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import katex from 'katex';
import { NgMarkedEditorService } from '../services/ng-marked-editor.service';
import { isDarkTheme, ThemeType } from '../types/editor';

interface FormulaSymbolItem {
  label: string;
  latex: string;
  title?: string;
}

interface FormulaSymbolGroup {
  name: string;
  symbols: FormulaSymbolItem[];
}

@Component({
  selector: 'lib-formula-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formula-builder.component.html',
  styleUrls: ['./formula-builder.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormulaBuilderComponent implements OnInit, OnDestroy {
  @Input()
  theme: ThemeType = 'default';

  @Input()
  initialText = '';

  @Input()
  private ngMarkedEditorService?: NgMarkedEditorService;

  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);

  defaultStyle = {
    width: '760px',
    maxWidth: 'calc(100vw - 32px)'
  };

  latex = '';
  previewHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml('');
  previewError = '';

  readonly groups: FormulaSymbolGroup[] = [
    {
      name: '基础运算',
      symbols: [
        { label: '+', latex: '+' },
        { label: '−', latex: '-' },
        { label: '×', latex: '\\times' },
        { label: '÷', latex: '\\div' },
        { label: '±', latex: '\\pm' },
        { label: '=', latex: '=' },
        { label: '≠', latex: '\\neq' },
        { label: '≈', latex: '\\approx' },
        { label: '<', latex: '<' },
        { label: '>', latex: '>' },
        { label: '≤', latex: '\\leq' },
        { label: '≥', latex: '\\geq' },
        { label: '∞', latex: '\\infty' }
      ]
    },
    {
      name: '分数与根号',
      symbols: [
        { label: 'a/b', latex: '\\frac{}{}' },
        { label: '√', latex: '\\sqrt{}' },
        { label: '∛', latex: '\\sqrt[3]{}' }
      ]
    },
    {
      name: '上下标',
      symbols: [
        { label: 'x²', latex: '^{}' },
        { label: 'x₁', latex: '_{}' },
        { label: 'x₁²', latex: '_{}^{}' }
      ]
    },
    {
      name: '求和 / 积分 / 极限',
      symbols: [
        { label: '∑', latex: '\\sum_{}^{}' },
        { label: '∏', latex: '\\prod_{}^{}' },
        { label: '∫', latex: '\\int_{}^{}' },
        { label: 'lim', latex: '\\lim_{x \\to }' }
      ]
    },
    {
      name: '括号',
      symbols: [
        { label: '( )', latex: '\\left( \\right)' },
        { label: '[ ]', latex: '\\left[ \\right]' },
        { label: '{ }', latex: '\\left\\{ \\right\\}' },
        { label: '| |', latex: '\\left| \\right|' }
      ]
    },
    {
      name: '矩阵 / 分段',
      symbols: [
        { label: '矩阵', latex: '\\begin{matrix} & \\\\ & \\end{matrix}' },
        { label: '分段', latex: '\\begin{cases} & \\\\ & \\end{cases}' }
      ]
    },
    {
      name: '希腊字母',
      symbols: [
        { label: 'α', latex: '\\alpha' },
        { label: 'β', latex: '\\beta' },
        { label: 'γ', latex: '\\gamma' },
        { label: 'δ', latex: '\\delta' },
        { label: 'θ', latex: '\\theta' },
        { label: 'λ', latex: '\\lambda' },
        { label: 'μ', latex: '\\mu' },
        { label: 'π', latex: '\\pi' },
        { label: 'σ', latex: '\\sigma' },
        { label: 'φ', latex: '\\phi' },
        { label: 'ω', latex: '\\omega' },
        { label: 'Δ', latex: '\\Delta' },
        { label: 'Σ', latex: '\\Sigma' },
        { label: 'Ω', latex: '\\Omega' }
      ]
    },
    {
      name: '关系与集合',
      symbols: [
        { label: '∈', latex: '\\in' },
        { label: '∉', latex: '\\notin' },
        { label: '⊂', latex: '\\subset' },
        { label: '∪', latex: '\\cup' },
        { label: '∩', latex: '\\cap' },
        { label: '∀', latex: '\\forall' },
        { label: '∃', latex: '\\exists' },
        { label: '∂', latex: '\\partial' },
        { label: '∇', latex: '\\nabla' },
        { label: '∝', latex: '\\propto' },
        { label: '≡', latex: '\\equiv' }
      ]
    },
    {
      name: '箭头',
      symbols: [
        { label: '→', latex: '\\to' },
        { label: '←', latex: '\\leftarrow' },
        { label: '↔', latex: '\\leftrightarrow' },
        { label: '⇒', latex: '\\Rightarrow' },
        { label: '⇐', latex: '\\Leftarrow' },
        { label: '⇔', latex: '\\Leftrightarrow' }
      ]
    },
    {
      name: '函数',
      symbols: [
        { label: 'sin', latex: '\\sin' },
        { label: 'cos', latex: '\\cos' },
        { label: 'tan', latex: '\\tan' },
        { label: 'log', latex: '\\log' },
        { label: 'ln', latex: '\\ln' },
        { label: 'exp', latex: '\\exp' },
        { label: 'max', latex: '\\max' },
        { label: 'min', latex: '\\min' }
      ]
    }
  ];

  @ViewChild('latexInput')
  private latexInput?: ElementRef<HTMLTextAreaElement>;

  private previewTimer: ReturnType<typeof setTimeout> | null = null;

  get isDark(): boolean {
    return isDarkTheme(this.theme);
  }

  get canInsert(): boolean {
    return this.latex.trim().length > 0;
  }

  ngOnInit(): void {
    this.latex = this.stripWrapper(this.initialText);
    this.renderPreview();
  }

  ngOnDestroy(): void {
    if (this.previewTimer !== null) {
      clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }
  }

  onLatexInput(): void {
    this.schedulePreview();
  }

  insertSymbol(symbol: FormulaSymbolItem): void {
    const textarea = this.latexInput?.nativeElement;
    const source = this.latex;
    const start = textarea ? textarea.selectionStart ?? source.length : source.length;
    const end = textarea ? textarea.selectionEnd ?? start : source.length;
    const braceIndex = symbol.latex.indexOf('{}');
    const caret = start + (braceIndex >= 0 ? braceIndex + 1 : symbol.latex.length);

    this.latex = source.slice(0, start) + symbol.latex + source.slice(end);
    this.renderPreview();

    if (textarea) {
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(caret, caret);
      });
    }
  }

  insertFormula(kind: 'inline-formula' | 'block-formula'): void {
    const content = this.latex.trim();
    if (!content) {
      return;
    }
    this.ngMarkedEditorService?.visualInsertEvent.emit({ kind, content });
  }

  cancel(): void {
    this.ngMarkedEditorService?.fileUploadEvent.emit({ type: 'cancel' });
  }

  private schedulePreview(): void {
    if (this.previewTimer !== null) {
      clearTimeout(this.previewTimer);
    }
    this.previewTimer = setTimeout(() => {
      this.previewTimer = null;
      this.renderPreview();
    }, 250);
  }

  private renderPreview(): void {
    const source = this.latex.trim();
    if (!source) {
      this.previewHtml = this.sanitizer.bypassSecurityTrustHtml('');
      this.previewError = '';
      this.cdr.markForCheck();
      return;
    }

    try {
      const html = katex.renderToString(source, { displayMode: true, throwOnError: true });
      this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(html);
      this.previewError = '';
    } catch (error: unknown) {
      this.previewHtml = this.sanitizer.bypassSecurityTrustHtml('');
      this.previewError = error instanceof Error ? error.message : String(error);
    }
    this.cdr.markForCheck();
  }

  private stripWrapper(text: string): string {
    const value = (text || '').trim();
    const wrappers: ReadonlyArray<readonly [string, string]> = [
      ['$$', '$$'],
      ['\\(', '\\)'],
      ['\\[', '\\]'],
      ['$', '$']
    ];
    for (const [open, close] of wrappers) {
      if (value.length >= open.length + close.length && value.startsWith(open) && value.endsWith(close)) {
        return value.slice(open.length, value.length - close.length).trim();
      }
    }
    return value;
  }
}

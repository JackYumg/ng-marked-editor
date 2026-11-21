import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PlatformService } from '../core/platform.service';
import { NgMarkedEditorService } from '../services/ng-marked-editor.service';
import { isDarkTheme, ThemeType } from '../types/editor';
import { buildMermaidThemeVariables } from '../utils/mermaid-theme';

type DiagramType = 'flowchart' | 'sequence' | 'state' | 'class' | 'er' | 'pie' | 'gantt';
type EditMode = 'form' | 'source';
type NodeShape = 'rect' | 'round' | 'diamond' | 'circle';
type FlowLineStyle = 'arrow' | 'dashed' | 'thick' | 'open';
type SequenceLineStyle = 'solid' | 'dashed' | 'cross' | 'async';

interface FlowNode {
  id: string;
  text: string;
  shape: NodeShape;
}

interface FlowLink {
  from: string;
  to: string;
  label: string;
  line: FlowLineStyle;
}

interface SequenceParticipant {
  key: string;
  label: string;
}

interface SequenceMessage {
  from: string;
  to: string;
  text: string;
  line: SequenceLineStyle;
}

// 节点形状 → mermaid 语法
const FLOW_SHAPE_SYNTAX: Record<NodeShape, (id: string, text: string) => string> = {
  rect: (id, text) => `${id}[${text}]`,
  round: (id, text) => `${id}(${text})`,
  diamond: (id, text) => `${id}{${text}}`,
  circle: (id, text) => `${id}((${text}))`
};

// 连线类型 → mermaid 箭头
const FLOW_LINE_SYNTAX: Record<FlowLineStyle, string> = {
  arrow: '-->',
  dashed: '-.->',
  thick: '==>',
  open: '---'
};

// 消息线类型 → mermaid 箭头
const SEQUENCE_LINE_SYNTAX: Record<SequenceLineStyle, string> = {
  solid: '->>',
  dashed: '-->>',
  cross: '-x',
  async: '-)'
};

const DEFAULT_NODES: FlowNode[] = [
  { id: 'A', text: '开始', shape: 'rect' },
  { id: 'B', text: '处理', shape: 'rect' },
  { id: 'C', text: '判断', shape: 'diamond' }
];

const DEFAULT_LINKS: FlowLink[] = [
  { from: 'A', to: 'B', label: '', line: 'arrow' },
  { from: 'B', to: 'C', label: '', line: 'arrow' }
];

const DEFAULT_PARTICIPANTS: SequenceParticipant[] = [
  { key: 'A', label: '用户' },
  { key: 'B', label: '系统' }
];

const DEFAULT_MESSAGES: SequenceMessage[] = [
  { from: 'A', to: 'B', text: '发起请求', line: 'solid' },
  { from: 'B', to: 'A', text: '返回结果', line: 'dashed' }
];

// 仅源码模式的图类型默认模板
const STATIC_TEMPLATES: Record<Exclude<DiagramType, 'flowchart' | 'sequence'>, string> = {
  state: [
    'stateDiagram-v2',
    '    [*] --> 待处理',
    '    待处理 --> 处理中: 开始',
    '    处理中 --> 已完成: 完成',
    '    已完成 --> [*]'
  ].join('\n'),
  class: [
    'classDiagram',
    '    class Animal {',
    '        +String name',
    '        +int age',
    '        +move()',
    '    }',
    '    class Dog {',
    '        +bark()',
    '    }',
    '    Animal <|-- Dog'
  ].join('\n'),
  er: [
    'erDiagram',
    '    CUSTOMER ||--o{ ORDER : places',
    '    ORDER ||--|{ ORDER_ITEM : contains',
    '    CUSTOMER {',
    '        string name',
    '        string email',
    '    }',
    '    ORDER {',
    '        int id',
    '        date createdAt',
    '    }'
  ].join('\n'),
  pie: [
    'pie title 示例分布',
    '    "类别 A" : 40',
    '    "类别 B" : 35',
    '    "类别 C" : 25'
  ].join('\n'),
  gantt: [
    'gantt',
    '    title 项目计划',
    '    dateFormat YYYY-MM-DD',
    '    section 阶段一',
    '    需求分析 :a1, 2024-01-01, 7d',
    '    方案设计 :a2, after a1, 5d',
    '    section 阶段二',
    '    开发实现 :b1, after a2, 10d',
    '    测试验收 :b2, after b1, 5d'
  ].join('\n')
};

/** 从 ```mermaid ... ``` 代码块中提取源码（围栏语言标记可选） */
function extractMermaidBlock(text: string): string | null {
  if (!text) {
    return null;
  }
  const match = /```[ \t]*(?:mermaid[ \t]*)?\r?\n([\s\S]*?)```/i.exec(text);
  const body = match?.[1]?.trim();
  return body ? body : null;
}

/** 根据源码首行推断图类型 */
function detectDiagramType(source: string): DiagramType | null {
  const head = source.trim().toLowerCase();
  if (head.startsWith('sequencediagram')) {
    return 'sequence';
  }
  if (head.startsWith('statediagram')) {
    return 'state';
  }
  if (head.startsWith('classdiagram')) {
    return 'class';
  }
  if (head.startsWith('erdiagram')) {
    return 'er';
  }
  if (head.startsWith('pie')) {
    return 'pie';
  }
  if (head.startsWith('gantt')) {
    return 'gantt';
  }
  if (head.startsWith('graph') || head.startsWith('flowchart')) {
    return 'flowchart';
  }
  return null;
}

@Component({
  selector: 'lib-diagram-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diagram-builder.component.html',
  styleUrls: ['./diagram-builder.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiagramBuilderComponent implements OnInit, OnChanges, OnDestroy {
  private readonly platform = inject(PlatformService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input()
  theme: ThemeType = 'default';

  @Input()
  initialText = '';

  @Input()
  private ngMarkedEditorService?: NgMarkedEditorService;

  readonly defaultStyle = {
    width: '980px',
    maxWidth: 'calc(100vw - 32px)'
  };

  readonly diagramTypes: ReadonlyArray<{ value: DiagramType; label: string }> = [
    { value: 'flowchart', label: '流程图' },
    { value: 'sequence', label: '时序图' },
    { value: 'state', label: '状态图' },
    { value: 'class', label: '类图' },
    { value: 'er', label: 'ER 图' },
    { value: 'pie', label: '饼图' },
    { value: 'gantt', label: '甘特图' }
  ];

  diagramType: DiagramType = 'flowchart';
  mode: EditMode = 'form';
  source = '';

  nodes: FlowNode[] = DEFAULT_NODES.map((node) => ({ ...node }));
  links: FlowLink[] = DEFAULT_LINKS.map((link) => ({ ...link }));
  participants: SequenceParticipant[] = DEFAULT_PARTICIPANTS.map((item) => ({ ...item }));
  messages: SequenceMessage[] = DEFAULT_MESSAGES.map((item) => ({ ...item }));

  previewHtml?: SafeHtml;
  renderError = '';

  @ViewChild('previewEl')
  private previewEl?: ElementRef<HTMLElement>;

  private renderTimer?: ReturnType<typeof setTimeout>;
  private renderSeq = 0;

  get isDark(): boolean {
    return isDarkTheme(this.theme);
  }

  get supportsForm(): boolean {
    return this.diagramType === 'flowchart' || this.diagramType === 'sequence';
  }

  get canInsert(): boolean {
    return this.source.trim().length > 0;
  }

  ngOnInit(): void {
    const extracted = extractMermaidBlock(this.initialText);
    if (extracted) {
      this.source = extracted;
      this.mode = 'source';
      const detected = detectDiagramType(extracted);
      if (detected) {
        this.diagramType = detected;
      }
    } else {
      this.diagramType = 'flowchart';
      this.mode = 'form';
      this.source = this.buildFlowchartSource();
    }
    this.schedulePreview();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['theme'] && !changes['theme'].firstChange) {
      this.schedulePreview();
    }
  }

  ngOnDestroy(): void {
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
      this.renderTimer = undefined;
    }
  }

  onTypeChange(type: DiagramType): void {
    this.diagramType = type;
    this.mode = this.supportsForm ? 'form' : 'source';
    this.resetForType();
    this.schedulePreview();
    this.cdr.markForCheck();
  }

  setMode(mode: EditMode): void {
    if (this.mode === mode) {
      return;
    }
    this.mode = mode;
    // 从源码切回表单时，以表单数据为准覆盖 source
    if (mode === 'form' && this.supportsForm) {
      this.regenerateFromForm();
    }
    this.schedulePreview();
    this.cdr.markForCheck();
  }

  onSourceChange(): void {
    this.schedulePreview();
  }

  onFormChange(): void {
    this.regenerateFromForm();
    this.schedulePreview();
    this.cdr.markForCheck();
  }

  addNode(): void {
    this.nodes = [
      ...this.nodes,
      { id: this.nextKey(this.nodes.map((node) => node.id)), text: '新节点', shape: 'rect' }
    ];
    this.onFormChange();
  }

  removeNode(index: number): void {
    this.nodes = this.nodes.filter((_, i) => i !== index);
    this.onFormChange();
  }

  addLink(): void {
    this.links = [
      ...this.links,
      {
        from: this.nodes[0]?.id ?? '',
        to: this.nodes[1]?.id ?? '',
        label: '',
        line: 'arrow'
      }
    ];
    this.onFormChange();
  }

  removeLink(index: number): void {
    this.links = this.links.filter((_, i) => i !== index);
    this.onFormChange();
  }

  addParticipant(): void {
    this.participants = [
      ...this.participants,
      { key: this.nextKey(this.participants.map((item) => item.key)), label: '参与者' }
    ];
    this.onFormChange();
  }

  removeParticipant(index: number): void {
    this.participants = this.participants.filter((_, i) => i !== index);
    this.onFormChange();
  }

  addMessage(): void {
    this.messages = [
      ...this.messages,
      {
        from: this.participants[0]?.key ?? '',
        to: this.participants[1]?.key ?? '',
        text: '新消息',
        line: 'solid'
      }
    ];
    this.onFormChange();
  }

  removeMessage(index: number): void {
    this.messages = this.messages.filter((_, i) => i !== index);
    this.onFormChange();
  }

  insert(): void {
    if (!this.canInsert) {
      return;
    }
    this.ngMarkedEditorService?.visualInsertEvent.emit({ kind: 'mermaid', content: this.source });
  }

  cancel(): void {
    this.ngMarkedEditorService?.fileUploadEvent.emit({ type: 'cancel' });
  }

  private resetForType(): void {
    if (this.diagramType === 'flowchart') {
      this.nodes = DEFAULT_NODES.map((node) => ({ ...node }));
      this.links = DEFAULT_LINKS.map((link) => ({ ...link }));
      this.source = this.buildFlowchartSource();
      return;
    }
    if (this.diagramType === 'sequence') {
      this.participants = DEFAULT_PARTICIPANTS.map((item) => ({ ...item }));
      this.messages = DEFAULT_MESSAGES.map((item) => ({ ...item }));
      this.source = this.buildSequenceSource();
      return;
    }
    this.source = STATIC_TEMPLATES[this.diagramType];
  }

  private regenerateFromForm(): void {
    if (this.diagramType === 'flowchart') {
      this.source = this.buildFlowchartSource();
    } else if (this.diagramType === 'sequence') {
      this.source = this.buildSequenceSource();
    }
  }

  private buildFlowchartSource(): string {
    const rows = ['graph TD'];
    for (const node of this.nodes) {
      const id = (node.id || '').trim();
      if (!id) {
        continue;
      }
      rows.push(`    ${FLOW_SHAPE_SYNTAX[node.shape](id, node.text || '')}`);
    }
    for (const link of this.links) {
      const from = (link.from || '').trim();
      const to = (link.to || '').trim();
      if (!from || !to) {
        continue;
      }
      const arrow = FLOW_LINE_SYNTAX[link.line];
      const label = (link.label || '').trim();
      rows.push(label ? `    ${from} ${arrow}|${label}| ${to}` : `    ${from} ${arrow} ${to}`);
    }
    return rows.join('\n');
  }

  private buildSequenceSource(): string {
    const rows = ['sequenceDiagram'];
    for (const item of this.participants) {
      const key = (item.key || '').trim();
      if (!key) {
        continue;
      }
      rows.push(`    participant ${key} as ${(item.label || '').trim() || key}`);
    }
    for (const message of this.messages) {
      const from = (message.from || '').trim();
      const to = (message.to || '').trim();
      if (!from || !to) {
        continue;
      }
      rows.push(`    ${from}${SEQUENCE_LINE_SYNTAX[message.line]}${to}: ${message.text || ''}`);
    }
    return rows.join('\n');
  }

  /** 生成互不重复的节点 / 参与者标识（A、B、…、Z、AA） */
  private nextKey(existing: string[]): string {
    const used = new Set(existing.map((item) => (item || '').trim()));
    let index = existing.length;
    let key = '';
    do {
      key = this.columnName(index);
      index++;
    } while (used.has(key));
    return key;
  }

  private columnName(index: number): string {
    let name = '';
    let value = index;
    while (value >= 0) {
      name = String.fromCharCode(65 + (value % 26)) + name;
      value = Math.floor(value / 26) - 1;
    }
    return name;
  }

  private schedulePreview(): void {
    if (!this.platform.isBrowser) {
      return;
    }
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
    }
    this.renderTimer = setTimeout(() => {
      this.renderTimer = undefined;
      void this.renderPreview();
    }, 300);
  }

  /** 浏览器端渲染 mermaid，SSR 与异常都不影响插入 */
  private async renderPreview(): Promise<void> {
    if (!this.platform.isBrowser) {
      return;
    }
    // 每次渲染递增序号，保证异步返回时旧的渲染结果不会覆盖新内容
    const seq = ++this.renderSeq;
    const el = this.previewEl?.nativeElement;
    if (!el) {
      return;
    }
    const source = this.source.trim();
    if (!source) {
      this.previewHtml = undefined;
      this.renderError = '';
      this.cdr.markForCheck();
      return;
    }

    try {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'base',
        themeVariables: buildMermaidThemeVariables(el, this.theme)
      });
      const { svg } = await mermaid.render('diagram-builder-' + seq, source);
      if (seq !== this.renderSeq) {
        return;
      }
      this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(svg);
      this.renderError = '';
    } catch (error) {
      if (seq !== this.renderSeq) {
        return;
      }
      this.previewHtml = undefined;
      this.renderError = error instanceof Error ? error.message : String(error);
    }
    this.cdr.markForCheck();
  }
}

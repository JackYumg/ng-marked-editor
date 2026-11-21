import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { fromEvent, Subscription } from 'rxjs';
import { PlatformService } from '../core/platform.service';
import { ThemeType } from '../types/editor';
import { buildMermaidThemeVariables } from '../utils/mermaid-theme';
import { MarkRenderService } from './mark-render.service';

@Component({
  selector: 'lib-ng-marked-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ng-editor-md-workspace-display" [hidden]="!previewText" [ngClass]="theme" #rootElm [innerHtml]="previewText"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgMarkedPreviewComponent implements OnInit, OnChanges, OnDestroy {
  private readonly cdk = inject(ChangeDetectorRef);
  private readonly markRender = inject(MarkRenderService);
  private readonly elm = inject(ElementRef<HTMLElement>);
  private readonly render = inject(Renderer2);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platform = inject(PlatformService);
  private readonly injector = inject(Injector);

  @Input()
  context = '';

  @Output()
  scrollEvent: EventEmitter<Event> = new EventEmitter<Event>();

  @Output()
  valueChange: EventEmitter<string> = new EventEmitter<string>();

  previewText?: SafeHtml;

  private clickEvent?: Subscription;
  private scrollSub?: Subscription;
  private renderToken = 0;
  private mermaidSeq = 0;

  @Input()
  theme: ThemeType = 'default';

  @Input()
  scrollH = 0;

  isjsScroll = false;
  private jsScrollTime?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    if (this.platform.isBrowser) {
      this.subscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const html = this.markRender.toHtml(this.context || '');
    this.previewText = this.sanitizer.bypassSecurityTrustHtml(html);
    this.valueChange.emit(html);

    const token = ++this.renderToken;
    if (this.platform.isBrowser) {
      afterNextRender(() => this.renderMermaid(token), { injector: this.injector });
    }

    if (changes['scrollH'] && changes['scrollH'].currentValue) {
      this.scrollTo(this.scrollH);
      this.isjsScroll = true;
      if (this.jsScrollTime) {
        clearTimeout(this.jsScrollTime);
      }
      this.jsScrollTime = setTimeout(() => {
        this.isjsScroll = false;
      }, 100);
    } else {
      this.scrollH = 0;
    }
  }

  // 预览框滚动
  scrollTo(h: number): void {
    if (!this.platform.isBrowser) {
      return;
    }
    const target = this.elm.nativeElement;
    const t1 = target.scrollHeight - target.clientHeight;
    target.scrollTop = h * t1;
    this.cdk.markForCheck();
  }

  // 订阅事件
  private subscribe(): void {
    this.clickEvent = fromEvent<MouseEvent>(this.elm.nativeElement, 'click').subscribe((event) => {
      const target = event.target as HTMLElement;
      if (target?.classList?.contains('code-copy')) {
        const codeEl = target.parentNode?.children?.[0] as HTMLElement | undefined;
        if (!codeEl) {
          return;
        }
        this.copyText(codeEl.innerText).then(() => {
          target.innerText = '复制成功';
          setTimeout(() => {
            target.innerText = '复制代码';
          }, 3000);
        });
      }
    });

    this.scrollSub = fromEvent<Event>(this.elm.nativeElement, 'scroll').subscribe((event) => {
      if (!this.isjsScroll) {
        this.scrollEvent.emit(event);
      }
    });
  }

  private async copyText(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = this.render.createElement('textarea');
      textarea.value = text;
      this.render.setStyle(textarea, 'position', 'fixed');
      this.render.setStyle(textarea, 'opacity', '0');
      this.render.appendChild(this.elm.nativeElement.ownerDocument.body, textarea);
      textarea.select();
      this.elm.nativeElement.ownerDocument.execCommand?.('copy');
      this.render.removeChild(this.elm.nativeElement.ownerDocument.body, textarea);
    }
  }

  /** 浏览器端把 mermaid 占位节点替换为 SVG；SSR 端不会执行 */
  private async renderMermaid(token: number): Promise<void> {
    const host: HTMLElement = this.elm.nativeElement;
    const placeholders = Array.from(host.querySelectorAll<HTMLElement>('pre.mermaid-placeholder'));
    if (placeholders.length === 0) {
      return;
    }

    let mermaid: any;
    try {
      mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'base',
        themeVariables: buildMermaidThemeVariables(
          host.querySelector<HTMLElement>('.ng-editor-md-workspace-display') ?? host,
          this.theme
        )
      });
    } catch {
      return;
    }

    for (const el of placeholders) {
      if (token !== this.renderToken) {
        return;
      }
      const src = decodeURIComponent(el.dataset['mermaidSrc'] || '');
      if (!src) {
        continue;
      }
      try {
        const id = `mermaid-${token}-${this.mermaidSeq++}`;
        const result = await mermaid.render(id, src);
        if (token !== this.renderToken) {
          return;
        }
        el.outerHTML = result.svg;
      } catch {
        // 渲染失败时保留源码块
      }
    }
    this.cdk.markForCheck();
  }

  ngOnDestroy(): void {
    this.clickEvent?.unsubscribe();
    this.scrollSub?.unsubscribe();
    if (this.jsScrollTime) {
      clearTimeout(this.jsScrollTime);
    }
  }
}

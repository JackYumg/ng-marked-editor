import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, Subscription, fromEvent, fromEventPattern } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PlatformService } from './core/platform.service';
import { DiagramBuilderComponent } from './diagram-builder/diagram-builder.component';
import { FormulaBuilderComponent } from './formula-builder/formula-builder.component';
import { ImageUploadComponent } from './image-upload/image-upload.component';
import { LinkUploadComponent } from './link-upload/link-upload.component';
import { MainModalService } from './main-modal/main-modal.service';
import { NgMarkedPreviewComponent } from './preview/ng-marked-preview.component';
import { EditorOptService } from './services/editor-opt.service';
import { EditorShortcutService } from './services/editor-shortcut.service';
import { EditorStateManageService } from './services/editor-state-manage.service';
import { EditorStorageService } from './services/editor-storage.service';
import { NgMarkedEditorService } from './services/ng-marked-editor.service';
import { ToolBarComponent } from './tool-bar/tool-bar.component';
import { EditorShortcutAction, isDarkTheme, MdSelection, NgMarkedEditorOption, ThemeType, VisualInsertPayload } from './types/editor';
import { TextareaSelectionService } from './utils/textarea-selection.service';

@Component({
  selector: 'lib-ng-marked-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ToolBarComponent, NgMarkedPreviewComponent],
  templateUrl: './ng-marked-editor.html',
  styleUrls: ['./styles/ng-marked-editor.component.less'],
  providers: [
    EditorOptService,
    EditorShortcutService,
    EditorStateManageService,
    EditorStorageService,
    MainModalService,
    NgMarkedEditorService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgMarkedEditorComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NgMarkedEditorComponent implements OnInit, OnDestroy, ControlValueAccessor {
  private readonly platform = inject(PlatformService);
  private readonly ngMarkedEditorService = inject(NgMarkedEditorService);
  private readonly textareaSelectionService = inject(TextareaSelectionService);
  private readonly editorOptService = inject(EditorOptService);
  private readonly cdk = inject(ChangeDetectorRef);
  private readonly editorStateManageService = inject(EditorStateManageService);
  private readonly mainModalService = inject(MainModalService);
  private readonly editorStorageService = inject(EditorStorageService);
  private readonly shortcutService = inject(EditorShortcutService);

  optionValue?: NgMarkedEditorOption;

  @Input()
  set option(option: NgMarkedEditorOption) {
    this.optionValue = Object.assign({}, this.ngMarkedEditorService.getDefaultOption(), option);
    this.ngMarkedEditorService.setOption(this.optionValue);
    // 文本域已存在时按新配置重新绑定快捷键
    if (this.textareaElement) {
      this.subscribeShortcuts();
    }
  }

  get option(): NgMarkedEditorOption {
    return this.optionValue || this.ngMarkedEditorService.getDefaultOption();
  }

  // 点击保存时向外面抛出事件
  @Output()
  saveChange = new EventEmitter<string>();

  // 自定义上传回调
  @Input()
  fileUploadChange?: (file: File) => any;

  // 主题
  @Input()
  theme: ThemeType = 'default';

  // 只读模式：内容不可编辑，工具栏编辑类按钮禁用，预览 / 源码 / 全屏仍可用
  @Input()
  readonly = false;

  get isDark(): boolean {
    return isDarkTheme(this.theme);
  }

  private appKey = '';
  // 服务实例传递给子组件使用
  editorStateManageInstance?: EditorStateManageService;
  ngMarkedEditorRefValue?: ElementRef<HTMLElement>;
  textareaRefValue?: ElementRef<HTMLTextAreaElement>;

  rootValue = '';

  editorState = {
    zoom: false,
    full: false,
    preview: true,
    code: false
  };

  domText = '';

  // 表单属性
  disabled = false;

  scrollH = 0;
  isjsScroll = false; // 判断非用户行为滚动
  jsScrollTime?: ReturnType<typeof setTimeout>;
  tempTIme?: ReturnType<typeof setTimeout>;

  private readonly subscriptions: Subscription[] = [];
  // 快捷键与历史记录监听
  private shortcutSubs: Subscription[] = [];
  private pendingVisualSelection?: MdSelection;

  @ViewChild('ngMarkedEditorTpl')
  set ngMarkedEditorRef(elm: ElementRef<HTMLElement>) {
    if (elm) {
      this.ngMarkedEditorRefValue = elm;
      this.editorOptService.setElm(elm);
    }
  }

  @ViewChild('textareaTpl')
  set textareaRef(e: ElementRef<HTMLTextAreaElement> | undefined) {
    this.textareaRefValue = e;
    if (e && this.platform.isBrowser) {
      this.subscribeShortcuts();
      this.initTextareaEvent();
    }
  }

  get textareaRef(): ElementRef<HTMLTextAreaElement> | undefined {
    return this.textareaRefValue;
  }

  get hasHistory(): boolean {
    return this.editorStateManageService.hasPre();
  }

  private get textareaElement(): HTMLTextAreaElement | undefined {
    return this.textareaRef?.nativeElement;
  }

  constructor() {
    this.editorState = this.editorOptService.state;
    this.editorStateManageInstance = this.editorStateManageService;
  }

  ngOnInit(): void {
    this.option = this.ngMarkedEditorService.getDefaultOption();
    this.subscribeModalEvent();
    this.createAppKey();
    this.autoSaveConfig();
  }

  getAppkey(): string {
    return this.appKey;
  }

  setAppKey(appkey: string): void {
    this.appKey = appkey;
  }

  @Input()
  set value(value: string) {
    this.rootValue = value;
    this.editorStorageService.saveEvent.emit(value);
  }

  get value(): string {
    return this.rootValue;
  }

  // textarea 输入时同步 value 与表单绑定（撤销栈由 keydown 维护）
  onTextChange(value: string): void {
    this.rootValue = value;
    this.editorStorageService.saveEvent.emit(value);
    this.propsChange(value);
  }

  // 点击工具条按钮时的响应方法
  toolbarClick($event: any): void {
    const { name, item, value } = $event;
    const { type, salis } = item;

    const dealFunction = (e: string, index: number): string =>
      index === 0 ? e : e.substring(0, 1).toUpperCase() + e.substring(1);

    if (type === 'editor-state') { // 一般控制编辑器的展示
      const fnName = name.split('-').map(dealFunction).join('');
      const fn = (this.editorOptService as any)[fnName];
      if (typeof fn === 'function') {
        this.editorState = fn.call(this.editorOptService);
      }
    } else if (type === 'editor-opt') { // 控制浏览器的固有操作
      const fnName = name.split('-').map(dealFunction).join('');
      const fn = (this.editorOptService as any)[fnName];
      if (typeof fn === 'function') {
        fn.call(this.editorOptService);
      }
    } else if (type === 'editor-transform') { // 对文本进行转换的
      const fnName = name.split('-').map(dealFunction).join('');
      const fn = (this.editorOptService as any)[fnName];
      if (typeof fn === 'function') {
        const result = fn.call(this.editorOptService, this.value);
        if (result instanceof Promise) {
          result.then((res: string) => {
            this.applyTransformValue(res);
          });
        } else {
          this.applyTransformValue(result);
        }
      }
    } else if (type === 'insert') { // 能够直接插入的
      if (value === 'visual' && (name === 'gongshi' || name === 'liuchengtu')) {
        this.openVisualBuilder(name === 'gongshi' ? 'formula' : 'diagram');
        return;
      }
      const section = this.textareaSelectionService.getSelection(this.textareaElement);
      if (this.editorOptService[name as 'bold']) {
        const res = this.editorOptService[name as 'bold' | 'title'](this.value, section, value);
        this.insertValue(res);
      } else if (this.editorOptService[salis as 'bold']) {
        const res = this.editorOptService[salis as 'bold'](this.value, section);
        this.insertValue(res);
      }
    } else if (type === 'modal') { // 如果是弹出框
      if (name === 'image') {
        this.mainModalService.create({
          content: ImageUploadComponent,
          modalParams: {
            theme: this.theme,
            ngMarkedEditorService: this.ngMarkedEditorService
          }
        });
      } else if (name === 'link') {
        this.openLinkModal();
      }
    } else if (name === 'baocun') {
      this.editorStorageService.saveImidet(this.value);
      this.saveChange.emit(this.value);
    } else if (name === 'revoke') {
      this.undo();
    } else if (name === 'next') {
      this.redo();
    }
    this.cdk.markForCheck();
  }

  private applyTransformValue(value: string): void {
    this.setValueSilently(value || '');
    this.editorStateManageService.pushState({ value: this.value });
    this.cdk.markForCheck();
  }

  private insertValue(res: { value: string; selectStart: number; selectEnd: number }): void {
    this.setValueSilently(res.value);
    this.editorStateManageService.pushState({ value: this.value });
    this.editorStateManageService.toolEvent.emit(true);
    setTimeout(() => {
      this.textareaSelectionService.textSelect(this.textareaElement, res.selectStart, res.selectEnd);
    }, 1);
  }

  // 撤销/回滚等内部更新，不回写表单
  private setValueSilently(value: string): void {
    this.rootValue = value;
    this.editorStorageService.saveEvent.emit(value);
  }

  // 订阅快捷键：textarea 动作 + window 上的 Esc 关闭弹窗
  private subscribeShortcuts(): void {
    this.shortcutSubs.forEach((sub) => sub.unsubscribe());
    this.shortcutSubs = [];
    const textarea = this.textareaElement;
    if (!textarea) {
      return;
    }
    this.shortcutSubs.push(
      this.shortcutService.bind(textarea, this.option?.shortcuts, (action) => this.handleShortcut(action))
    );
    const win = this.platform.window;
    if (win) {
      this.shortcutSubs.push(
        // 仅监听 Esc，不合并默认键位，避免与 textarea 按键重复触发
        this.shortcutService.bind(
          win,
          { closeModal: 'escape' },
          () => {
            if (!this.mainModalService.openModals.length) {
              return false;
            }
            this.mainModalService.closeAll();
            this.pendingVisualSelection = undefined;
            return true;
          },
          { mergeDefaults: false }
        )
      );
    }
    // 历史记录监听需在快捷键之后注册，通过 defaultPrevented 判断事件是否已被处理
    this.subscribeHistoryEvent();
  }

  // 维护撤销栈：处理未被快捷键消费的普通按键
  private subscribeHistoryEvent(): void {
    const textarea = this.textareaElement;
    if (!textarea) {
      return;
    }
    this.shortcutSubs.push(
      fromEvent<KeyboardEvent>(textarea, 'keydown').subscribe((event) => {
        if (event.defaultPrevented || event.isComposing) {
          return;
        }
        if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
          return;
        }
        this.editorStateManageService.pushState({ value: this.value });
        if (this.editorStateManageService.isInputText(event.keyCode)) {
          this.editorStateManageService.clearY();
        }
        this.editorStateManageService.toolEvent.emit(true);
        this.cdk.markForCheck();
      })
    );
  }

  // 处理快捷键动作，返回 false 表示保留浏览器默认行为
  private handleShortcut(action: EditorShortcutAction): boolean {
    // 只读 / 禁用时阻止浏览器默认行为，但不执行编辑动作
    if (this.readonly || this.disabled) {
      return true;
    }
    const section = this.textareaSelectionService.getSelection(this.textareaElement);
    switch (action) {
      case 'bold':
        this.insertValue(this.editorOptService.bold(this.value, section));
        return true;
      case 'italic':
        this.insertValue(this.editorOptService.italic(this.value, section));
        return true;
      case 'underline':
        this.insertValue(this.editorOptService.underline(this.value, section));
        return true;
      case 'strikeThrough':
        this.insertValue(this.editorOptService.through(this.value, section));
        return true;
      case 'inlineCode':
        this.insertValue(this.editorOptService.codeRow(this.value, section));
        return true;
      case 'blockCode':
        this.insertValue(this.editorOptService.code(this.value, section));
        return true;
      case 'insertLink':
        this.openLinkModal();
        return true;
      case 'undo':
        this.undo();
        return true;
      case 'redo':
        this.redo();
        return true;
      case 'save':
        this.editorStorageService.saveImidet(this.value);
        this.saveChange.emit(this.value);
        return true;
      default:
        return false;
    }
  }

  // 撤销
  private undo(): void {
    const state = this.editorStateManageService.rollback();
    if (state) {
      this.setValueSilently(state.value || '');
    }
    this.editorStateManageService.toolEvent.emit(true);
    this.cdk.markForCheck();
  }

  // 重做
  private redo(): void {
    const state = this.editorStateManageService.rollInvoke();
    if (state) {
      this.setValueSilently(state.value || '');
    }
    this.editorStateManageService.toolEvent.emit(true);
    this.cdk.markForCheck();
  }

  // 打开链接弹窗
  private openLinkModal(): void {
    this.mainModalService.create({
      content: LinkUploadComponent,
      modalParams: {
        theme: this.theme,
        ngMarkedEditorService: this.ngMarkedEditorService
      }
    });
  }

  // 订阅模态框的事件
  private subscribeModalEvent(): void {
    this.subscriptions.push(
      this.ngMarkedEditorService.fileUploadEvent.subscribe((result) => {
        const { type } = result;
        if (type === 'image' || type === 'link') {
          const section = this.textareaSelectionService.getSelection(this.textareaElement);
          const res = this.editorOptService[type as 'image'](this.value, section, result);
          this.setValueSilently(res.value);
          this.textareaSelectionService.textSelect(this.textareaElement, res.selectStart, res.selectEnd);
          this.cdk.markForCheck();
          this.mainModalService.closeAll();
        } else if (type === 'cancel') {
          this.pendingVisualSelection = undefined;
          this.mainModalService.closeAll();
        }
      })
    );

    this.subscriptions.push(
      this.ngMarkedEditorService.beforeUploadEvent.subscribe((file: File) => {
        if (!this.fileUploadChange) {
          throw new Error('is the option of customUpload is true , the fileuploadChange is must be set');
        }
        const res = this.fileUploadChange(file);
        if (res instanceof Promise) {
          res.then((path: string) => {
            this.ngMarkedEditorService.afterUploadEvent.emit(path);
          });
        } else if (res instanceof Observable) {
          res.subscribe((path: string) => {
            this.ngMarkedEditorService.afterUploadEvent.emit(path);
          });
        }
      })
    );

    this.subscriptions.push(
      this.ngMarkedEditorService.visualInsertEvent.subscribe((payload: VisualInsertPayload) => {
        const section = this.pendingVisualSelection ?? this.textareaSelectionService.getSelection(this.textareaElement);
        const res = this.editorOptService.visualInsert(this.value, section, payload);
        this.insertValue(res);
        this.pendingVisualSelection = undefined;
        this.mainModalService.closeAll();
      })
    );
  }

  // 判断是否启动存储功能
  private autoSaveConfig(): void {
    if (this.option.saveOption.autoSave) {
      this.editorStorageService.loadConfig(this.appKey).then((res) => {
        if (res) {
          this.editorStorageService.start();
        }
      });
    }
  }

  previewValueChange(event: string): void {
    this.domText = event.replace(/<span class="code-copy">复制代码<\/span>/g, '');
  }

  // 创建 APPID
  private createAppKey(): void {
    const key = Date.now() * Math.random() * 10000;
    this.setAppKey(key.toString());
  }

  // 打开公式 / 流程图可视化编辑器
  private openVisualBuilder(type: 'formula' | 'diagram'): void {
    const section = this.textareaSelectionService.getSelection(this.textareaElement);
    let initialText = section.text || '';
    // 公式编辑器只预填公式文本，避免把 mermaid 代码块等长文本带进去
    if (type === 'formula' && (initialText.includes('```') || initialText.length > 300)) {
      initialText = '';
    }
    this.pendingVisualSelection = section;
    this.mainModalService.create({
      content: type === 'formula' ? FormulaBuilderComponent : DiagramBuilderComponent,
      modalParams: {
        theme: this.theme,
        initialText,
        ngMarkedEditorService: this.ngMarkedEditorService
      }
    });
  }

  // 预览框滚动时同步 textarea
  scrollEvent($event: any): void {
    const target = $event?.target;
    const textarea = this.textareaElement;
    if (!target || !textarea) {
      return;
    }
    this.isjsScroll = true;
    const t1 = target.scrollHeight - target.clientHeight;
    if (t1 <= 0) {
      return;
    }
    const h = target.scrollTop / t1 * (textarea.scrollHeight - textarea.clientHeight);
    textarea.scrollTop = h;
    if (this.jsScrollTime) {
      clearTimeout(this.jsScrollTime);
    }
    this.jsScrollTime = setTimeout(() => {
      this.isjsScroll = false;
    }, 100);
  }

  // 监听文本框的滚动事件
  private initTextareaEvent(): void {
    const textarea = this.textareaElement;
    if (!textarea) {
      return;
    }
    let sub: Subscription | undefined;
    const addScrollEvent = () => {
      sub = fromEvent(textarea, 'scroll').pipe(filter(() => !this.isjsScroll)).subscribe((event: any) => {
        const target = event.target;
        const t1 = target.scrollHeight - target.clientHeight;
        if (t1 <= 0) {
          return;
        }
        this.scrollH = target.scrollTop / t1;
        this.cdk.markForCheck();
      });
    };

    const removeScrollEvent = () => {
      sub?.unsubscribe();
    };

    this.subscriptions.push(
      fromEventPattern(addScrollEvent, removeScrollEvent).subscribe()
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.shortcutSubs.forEach((sub) => sub.unsubscribe());
    this.shortcutSubs = [];
    if (this.jsScrollTime) {
      clearTimeout(this.jsScrollTime);
    }
    if (this.tempTIme) {
      clearTimeout(this.tempTIme);
    }
    this.editorStorageService.destory();
  }

  writeValue(obj: any): void {
    this.rootValue = obj ?? '';
    this.editorStateManageService.pushState({ value: this.rootValue });
    this.editorStateManageService.toolEvent.emit(true);
    this.cdk.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.propsChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.propsTouched = fn;
  }

  propsChange: (value: any) => void = (_: any) => { };
  propsTouched: (value: any) => void = (_: any) => { };

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    this.cdk.markForCheck();
  }
}

import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectorRef,
  ComponentRef,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  EventEmitter,
  inject,
  Inject,
  OnDestroy,
  Renderer2
} from '@angular/core';
import { AnimationEvent } from '@angular/animations';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { OverlayRef } from '@angular/cdk/overlay';
import { BasePortalOutlet, CdkPortalOutlet, ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import {
  FADE_CLASS_NAME_MAP, getElementOffset, getValueWithConfig, isNotNil,
  ModalOptions, ModalRef, MODAL_MASK_CLASS_NAME, SafeAny, throwModalContentAlreadyAttachedError, ZOOM_CLASS_NAME_MAP
} from './modal.data';

@Directive({
  selector: '[libMainModal]',
  standalone: true
})
export class MainModalDirective extends BasePortalOutlet implements OnDestroy {
  portalOutlet!: CdkPortalOutlet;
  animationStateChanged = new EventEmitter<AnimationEvent>();
  containerClick = new EventEmitter<void>();
  cancelTriggered = new EventEmitter<void>();
  okTriggered = new EventEmitter<void>();
  state: 'void' | 'enter' | 'exit' = 'enter';
  modalRef!: ModalRef;
  private focusTrap?: FocusTrap;
  private oldMaskStyle: { [key: string]: string } | null = null;
  document: Document;
  private elementFocusedBeforeModalWasOpened: HTMLElement | SafeAny = {};
  modalElementRef!: ElementRef<HTMLDivElement>;

  mouseDown = false;
  isStringContent = false;

  animationType?: string;

  get showMask(): boolean {
    return !!getValueWithConfig<boolean>(this.config.mask, true, true);
  }

  get maskClosable(): boolean {
    return !!getValueWithConfig<boolean>(this.config.mask, true, true);
  }

  constructor(
    protected elementRef: ElementRef,
    protected focusTrapFactory: FocusTrapFactory,
    public cdr: ChangeDetectorRef,
    protected render: Renderer2,
    protected overlayRef: OverlayRef,
    public config: ModalOptions,
    @Inject(DOCUMENT) doc: Document
  ) {
    super();
    this.document = doc;
    this.isStringContent = typeof config.content === 'string';
  }

  setType(animationType: string): void {
    this.animationType = animationType;
  }

  setDoc(doc: Document): void {
    this.document = doc;
  }

  ngOnDestroy(): void {
    // no-op
  }

  attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    if (this.portalOutlet.hasAttached()) {
      throwModalContentAlreadyAttachedError();
    }
    this.savePreviouslyFocusedElement();
    this.setZIndexForBackdrop();
    return this.portalOutlet.attachComponentPortal(portal);
  }

  attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C> {
    if (this.portalOutlet.hasAttached()) {
      throwModalContentAlreadyAttachedError();
    }
    this.savePreviouslyFocusedElement();
    this.setZIndexForBackdrop();
    return this.portalOutlet.attachTemplatePortal(portal);
  }

  getNativeElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  startExitAnimation(): void {
    this.state = 'exit';
    this.cdr.markForCheck();
  }

  bindBackdropStyle(): void {
    const backdropElement = this.overlayRef.backdropElement;
    if (backdropElement) {
      if (this.oldMaskStyle) {
        const styles = this.oldMaskStyle as { [key: string]: string };
        Object.keys(styles).forEach(key => {
          this.render.removeStyle(backdropElement, key);
        });
        this.oldMaskStyle = null;
      }

      this.setZIndexForBackdrop();

      if (typeof this.config.maskStyle === 'object' && Object.keys(this.config.maskStyle).length) {
        const styles: { [key: string]: string } = { ...this.config.maskStyle };
        Object.keys(styles).forEach(key => {
          this.render.setStyle(backdropElement, key, styles[key]);
        });
        this.oldMaskStyle = styles;
      }
    }
  }

  private setZIndexForBackdrop(): void {
    const backdropElement = this.overlayRef.backdropElement;
    if (backdropElement) {
      if (isNotNil(this.config.zIndex)) {
        this.render.setStyle(backdropElement, 'z-index', this.config.zIndex);
      }
    }
  }

  attachStringContent(): void {
    this.savePreviouslyFocusedElement();
    this.setZIndexForBackdrop();
  }

  private savePreviouslyFocusedElement(): void {
    if (!this.focusTrap) {
      this.focusTrap = this.focusTrapFactory.create(this.elementRef.nativeElement);
    }

    if (this.document) {
      this.elementFocusedBeforeModalWasOpened = this.document.activeElement as HTMLElement;
      if (this.elementRef.nativeElement.focus) {
        Promise.resolve().then(() => this.elementRef.nativeElement.focus());
      }
    }
  }

  onMousedown(): void {
    this.mouseDown = true;
  }

  onContainerClick(e: MouseEvent): void {
    if (e.target === e.currentTarget && this.showMask && this.maskClosable) {
      this.containerClick.emit();
      this.modalRef.close();
    }
  }

  onCloseClick(): void {
    this.cancelTriggered.emit();
  }

  onOkClick(): void {
    this.okTriggered.emit();
  }

  onAnimationStart(event: AnimationEvent): void {
    if (event.toState === 'enter') {
      this.setEnterAnimationClass();
      this.bindBackdropStyle();
    } else if (event.toState === 'exit') {
      this.setExitAnimationClass();
    }
    this.animationStateChanged.emit(event);
  }

  private setEnterAnimationClass(): void {
    if (this.animationDisabled()) {
      return;
    }
    this.setModalTransformOrigin();
    const modalElement = this.modalElementRef?.nativeElement;
    const backdropElement = this.overlayRef.backdropElement;
    if (modalElement) {
      modalElement.classList.add(ZOOM_CLASS_NAME_MAP.enter);
      modalElement.classList.add(ZOOM_CLASS_NAME_MAP.enterActive);
    }
    if (backdropElement) {
      backdropElement.classList.add(FADE_CLASS_NAME_MAP.enter);
      backdropElement.classList.add(FADE_CLASS_NAME_MAP.enterActive);
    }
  }

  private setExitAnimationClass(): void {
    const modalElement = this.modalElementRef?.nativeElement;
    if (modalElement) {
      modalElement.classList.add(ZOOM_CLASS_NAME_MAP.leave);
      modalElement.classList.add(ZOOM_CLASS_NAME_MAP.leaveActive);
    }
    this.setMaskExitAnimationClass();
  }

  private animationDisabled(): boolean {
    return this.config.noAnimation || this.animationType === 'NoopAnimations';
  }

  private setModalTransformOrigin(): void {
    const modalElement = this.modalElementRef?.nativeElement;
    if (!modalElement) {
      return;
    }
    if (this.elementFocusedBeforeModalWasOpened as HTMLElement) {
      const previouslyDOMRect = (this.elementFocusedBeforeModalWasOpened as any).getBoundingClientRect?.();
      if (!previouslyDOMRect) {
        return;
      }
      const lastPosition = getElementOffset(this.elementFocusedBeforeModalWasOpened);
      const x = lastPosition.left + previouslyDOMRect.width / 2;
      const y = lastPosition.top + previouslyDOMRect.height / 2;
      const transformOrigin = `${x - modalElement.offsetLeft}px ${y - modalElement.offsetTop}px 0px`;
      this.render.setStyle(modalElement, 'transform-origin', transformOrigin);
    }
  }

  private setMaskExitAnimationClass(force = false): void {
    const backdropElement = this.overlayRef.backdropElement;
    if (backdropElement) {
      if (this.animationDisabled() || force) {
        backdropElement.classList.remove(MODAL_MASK_CLASS_NAME);
        return;
      }
      backdropElement.classList.add(FADE_CLASS_NAME_MAP.leave);
      backdropElement.classList.add(FADE_CLASS_NAME_MAP.leaveActive);
    }
  }

  onAnimationDone(event: AnimationEvent): void {
    if (event.toState === 'enter') {
      this.trapFocus();
    } else if (event.toState === 'exit') {
      this.restoreFocus();
    }
    this.cleanAnimationClass();
    this.animationStateChanged.emit(event);
  }

  private cleanAnimationClass(): void {
    if (this.animationDisabled()) {
      return;
    }
    const backdropElement = this.overlayRef.backdropElement;
    const modalElement = this.modalElementRef?.nativeElement;
    if (backdropElement) {
      backdropElement.classList.remove(FADE_CLASS_NAME_MAP.enter);
      backdropElement.classList.remove(FADE_CLASS_NAME_MAP.enterActive);
    }
    if (modalElement) {
      modalElement.classList.remove(ZOOM_CLASS_NAME_MAP.enter);
      modalElement.classList.remove(ZOOM_CLASS_NAME_MAP.enterActive);
      modalElement.classList.remove(ZOOM_CLASS_NAME_MAP.leave);
      modalElement.classList.remove(ZOOM_CLASS_NAME_MAP.leaveActive);
    }
  }

  private trapFocus(): void {
    const element = this.elementRef.nativeElement;

    if (this.config.autofocus) {
      this.focusTrap?.focusInitialElementWhenReady().then();
    } else {
      const activeElement = this.document?.activeElement;
      if (activeElement !== element && !element.contains(activeElement)) {
        element.focus();
      }
    }
  }

  private restoreFocus(): void {
    const toFocus = this.elementFocusedBeforeModalWasOpened as HTMLElement;

    if (toFocus && typeof toFocus.focus === 'function') {
      const activeElement = this.document?.activeElement as Element;
      const element = this.elementRef.nativeElement;

      if (
        !activeElement ||
        activeElement === this.document?.body ||
        activeElement === element ||
        element.contains(activeElement)
      ) {
        toFocus.focus();
      }
    }

    if (this.focusTrap) {
      this.focusTrap.destroy();
      this.focusTrap = undefined;
    }
  }
}

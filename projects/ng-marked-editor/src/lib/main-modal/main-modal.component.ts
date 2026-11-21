import { DOCUMENT, CommonModule } from '@angular/common';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Inject,
  OnInit,
  Optional,
  Renderer2,
  ViewChild
} from '@angular/core';
import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';
import { FocusTrapFactory } from '@angular/cdk/a11y';
import { CdkPortalOutlet } from '@angular/cdk/portal';
import { nzModalAnimations } from './modal-animations';
import { MainModalDirective } from './main-modal.directive';
import { ModalOptions, SafeAny } from './modal.data';

@Component({
  selector: 'lib-main-modal',
  standalone: true,
  imports: [CommonModule, CdkPortalOutlet],
  templateUrl: './main-modal.component.html',
  styleUrls: ['./main-modal.component.less'],
  animations: [
    nzModalAnimations.modalContainer
  ],
  host: {
    '[@modalContainer]': 'state',
    '(@modalContainer.start)': 'onAnimationStart($event)',
    '(@modalContainer.done)': 'onAnimationDone($event)',
  }
})
export class MainModalComponent extends MainModalDirective implements OnInit {
  private readonly overlayContainer = inject(Overlay);

  @ViewChild(CdkPortalOutlet, { static: true })
  override portalOutlet: CdkPortalOutlet = null as any;

  @ViewChild('modalElement', { static: true })
  override modalElementRef: ElementRef<HTMLDivElement> = null as any;

  constructor(
    protected override elementRef: ElementRef,
    focusTrapFactory: FocusTrapFactory,
    public override cdr: ChangeDetectorRef,
    protected override overlayRef: OverlayRef,
    protected override render: Renderer2,
    public override config: ModalOptions,
    @Optional() @Inject(DOCUMENT) document: SafeAny,
    @Optional() @Inject(ANIMATION_MODULE_TYPE) animationType: string | null
  ) {
    super(elementRef, focusTrapFactory, cdr, render, overlayRef, config, document);
    this.setType(animationType ?? '');
    this.setDoc(document);
  }

  ngOnInit(): void {
    // no-op
  }
}

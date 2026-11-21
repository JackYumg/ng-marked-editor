import { ComponentType, ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { inject, Injectable, TemplateRef, ViewContainerRef } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MdModalService {
  private readonly overlay = inject(Overlay);

  refs: OverlayRef[] = [];

  create(component: ComponentType<any> | TemplateRef<any> | ViewContainerRef | any, parentContainer?: ViewContainerRef): OverlayRef | null {
    if (component instanceof TemplateRef && parentContainer) {
      const tpp = new TemplatePortal(component, parentContainer, '');
      const ref = this.overlay.create({});
      ref.attach(tpp);
      this.refs.push(ref);
      return ref;
    } else {
      const cmm = new ComponentPortal(component);
      (cmm as any).title = '11';
      const ref = this.overlay.create({
        hasBackdrop: true,
        disposeOnNavigation: true
      });
      ref.attach(cmm);
      this.refs.push(ref);
      return ref;
    }
  }

  closeAll(): void {
    this.refs.forEach((res) => {
      res.dispose();
    });
    this.refs = [];
  }
}

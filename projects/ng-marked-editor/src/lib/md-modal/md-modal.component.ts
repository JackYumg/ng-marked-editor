import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, OnInit } from '@angular/core';

@Component({
  selector: 'lib-md-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './md-modal.component.html',
  styleUrls: ['./md-modal.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MdModalComponent implements OnInit {
  @Input()
  modalStyle = {};

  @Input()
  mdModalTitle?: string | ElementRef;

  @Input('mdModalFooterTpl')
  mdModalFooter?: string | ElementRef;

  ngOnInit(): void {
    // no-op
  }

  @HostListener('click', ['$event'])
  onContainerClick(e: MouseEvent): void {
    // no-op
  }
}

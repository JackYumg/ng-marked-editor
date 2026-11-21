import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseConfig } from '../data';
import { MdModalService } from '../md-modal/md-modal.service';
import { NgMarkedEditorService } from '../services/ng-marked-editor.service';
import { isDarkTheme, ThemeType } from '../types/editor';

type OptType = 'upload' | 'online' | 'cut';

@Component({
  selector: 'lib-link-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './link-upload.component.html',
  styleUrls: ['./link-upload.component.less']
})
export class LinkUploadComponent implements OnInit {
  private readonly httpClient = inject(HttpClient);
  private readonly modalService = inject(MdModalService);

  @Input()
  defaultStyle = {
    width: '520px',
  };

  @Input()
  title = '';

  files: FileList | null = null;

  desc = '';
  url = '';
  optType: OptType = 'upload';

  @Input()
  theme: ThemeType = 'default';

  get isDark(): boolean {
    return isDarkTheme(this.theme);
  }

  @Input()
  private ngMarkedEditorService?: NgMarkedEditorService;

  ngOnInit(): void {
    // no-op
  }

  fileuploadChange($event: Event): void {
    const { target } = $event;
    this.files = (target as HTMLInputElement).files;
  }

  uploadFile(): void {
    const file = this.files?.[0];
    if (!file) {
      return;
    }
    const url = `${BaseConfig.fileurl}uploadfile?`;
    const formData = new FormData();
    formData.append('file', file);
    this.httpClient.post(url, formData, { withCredentials: false }).subscribe((res: any) => {
      if (res.path) {
        this.url = BaseConfig.fileurl + 'getFiles?path=' + res.path;
      }
    });
  }

  confirm(): void {
    this.ngMarkedEditorService?.fileUploadEvent.emit({ path: this.url, desc: this.desc, type: 'link' });
    this.modalService.closeAll();
  }

  cancel(): void {
    this.ngMarkedEditorService?.fileUploadEvent.emit({ type: 'cancel' });
  }

  activeTab(type: OptType): void {
    this.optType = type;
  }
}

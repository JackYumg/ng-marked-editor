import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseConfig } from '../data';
import { NgMarkedEditorService } from '../services/ng-marked-editor.service';
import { isDarkTheme, ThemeType } from '../types/editor';

type OptType = 'upload' | 'online' | 'cut';

@Component({
  selector: 'lib-image-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.less']
})
export class ImageUploadComponent implements OnInit {
  private readonly httpClient = inject(HttpClient);

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
    this.subscribeEvent();
  }

  subscribeEvent(): void {
    this.ngMarkedEditorService?.afterUploadEvent.subscribe((path: string) => {
      this.url = path;
    });
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
    const option = this.ngMarkedEditorService?.getOption();
    if (option?.customUpload) {
      this.ngMarkedEditorService?.beforeUploadEvent.emit(file);
    } else {
      const url = `${BaseConfig.fileurl}uploadfile?`;
      const formData = new FormData();
      formData.append('file', file);
      this.httpClient.post(url, formData, { withCredentials: false }).subscribe((res: any) => {
        if (res.path) {
          this.url = BaseConfig.fileurl + 'getFiles?path=' + res.path;
        }
      });
    }
  }

  confirm(): void {
    this.ngMarkedEditorService?.fileUploadEvent.emit({ path: this.url, desc: this.desc, type: 'image' });
  }

  cancel(): void {
    this.ngMarkedEditorService?.fileUploadEvent.emit({ type: 'cancel' });
  }

  activeTab(type: OptType): void {
    this.optType = type;
  }
}

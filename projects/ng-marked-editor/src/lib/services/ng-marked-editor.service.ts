import { EventEmitter, Injectable } from '@angular/core';
import { defualtToolbars, NgMarkedEditorOption, VisualInsertPayload } from '../types/editor';

const defaultOption: NgMarkedEditorOption = {
  saveOption: {
    autoSave: false,
  },
  toolbars: defualtToolbars,
  customUpload: true
};

@Injectable()
export class NgMarkedEditorService {
  private optionValue?: NgMarkedEditorOption;
  // 点击确认后传输数据
  fileUploadEvent: EventEmitter<any> = new EventEmitter();
  // 公式 / 流程图可视化编辑的插入事件
  visualInsertEvent: EventEmitter<VisualInsertPayload> = new EventEmitter<VisualInsertPayload>();
  // 自定义上传时，把文件传出去
  beforeUploadEvent: EventEmitter<File> = new EventEmitter();
  // 自定义上传时，把成功上传文件的路径传到弹框里面
  afterUploadEvent: EventEmitter<string> = new EventEmitter();
  resizeEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  setOption(option: NgMarkedEditorOption): void {
    this.optionValue = option || this.getDefaultOption();
  }

  getOption(): NgMarkedEditorOption {
    return this.optionValue || this.getDefaultOption();
  }

  getDefaultOption(): NgMarkedEditorOption {
    return defaultOption;
  }
}

import { DOCUMENT } from '@angular/common';
import { ElementRef, inject, Injectable } from '@angular/core';
import { PlatformService } from '../core/platform.service';
import { lctDefaultValue } from '../data';
import { MdSelection, ResTrans, VisualInsertPayload } from '../types/editor';

@Injectable()
export class EditorOptService {
  private readonly platform = inject(PlatformService);
  private readonly document = inject(DOCUMENT);
  private elm?: ElementRef<HTMLElement>;

  state = {
    zoom: false,
    full: false,
    preview: true,
    code: false
  };

  private titleMap = [
    '',
    '一级标题',
    '二级标题',
    '三级标题',
    '四级标题',
    '五级标题',
    '六级标题',
  ];

  setElm(elm: ElementRef<HTMLElement>): void {
    this.elm = elm;
  }

  // 全屏
  fullScreen = (): void => {
    const element: any = this.elm?.nativeElement;
    if (!element) {
      return;
    }
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    }
  }

  // 退出全屏
  fullScreenExit = (): void => {
    const doc: any = this.document;
    if (doc.exitFullscreen) {
      doc.exitFullscreen();
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen();
    } else if (doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen();
    }
  }

  // 格式化 Markdown，prettier 体积较大，按需动态加载
  prettier = async (value = ''): Promise<string> => {
    if (!this.platform.isBrowser) {
      return value;
    }
    try {
      const [prettierModule, markdownPlugin] = await Promise.all([
        import('prettier/standalone'),
        import('prettier/plugins/markdown')
      ]);
      return await prettierModule.format(value, {
        parser: 'markdown',
        plugins: [markdownPlugin as any]
      });
    } catch {
      return value;
    }
  }

  // 放大
  fangda = () => {
    this.state = { ...this.state, zoom: true };
    return this.state;
  }

  // 缩小
  suoxiao = () => {
    this.state = { ...this.state, zoom: false };
    return this.state;
  }

  // 表示当前是 close，需要切换到 preview
  eyeClose = () => {
    this.state = { ...this.state, preview: true, code: false };
    return this.state;
  }

  // 表示当前是 preview，需要切换到 close
  preview = () => {
    this.state = { ...this.state, preview: false, code: false };
    return this.state;
  }

  // 代码或者预览
  coding = () => {
    this.state = { ...this.state, code: !this.state.code };
    return this.state;
  }

  // 粗体
  bold(text: string, selection: MdSelection): ResTrans {
    let value = '';
    let selectStart = 0;
    let selectEnd = 0;
    if (selection.text) {
      value = `${text.substring(0, selection.index)}**${selection.text}**${text.substring(selection.index + selection.text.length, text.length)}`;
      selectStart = selection.index + 2;
      selectEnd = selectStart + selection.text.length;
    } else {
      value = `${text.substring(0, selection.index)}**加粗**${text.substring(selection.index, text.length)}`;
      selectStart = selection.index + 2;
      selectEnd = selectStart + 2;
    }
    return {
      value,
      selectStart,
      selectEnd
    };
  }

  // 斜体
  italic(text: string, selection: MdSelection): ResTrans {
    let value = '';
    let selectStart = 0;
    let selectEnd = 0;
    if (selection.text) {
      value = `${text.substring(0, selection.index)}*${selection.text}*${text.substring(selection.index + selection.text.length, text.length)}`;
      selectStart = selection.index + 1;
      selectEnd = selectStart + selection.text.length;
    } else {
      value = `${text.substring(0, selection.index)}*斜体*${text.substring(selection.index, text.length)}`;
      selectStart = selection.index + 1;
      selectEnd = selectStart + 2;
    }
    return {
      value,
      selectStart,
      selectEnd
    };
  }

  // 划去
  through(text: string, selection: MdSelection): ResTrans {
    let value = '';
    let selectStart = 0;
    let selectEnd = 0;
    if (selection.text) {
      value = `${text.substring(0, selection.index)}~${selection.text}~${text.substring(selection.index + selection.text.length, text.length)}`;
      selectStart = selection.index + 1;
      selectEnd = selectStart + selection.text.length;
    } else {
      value = `${text.substring(0, selection.index)}~划去~${text.substring(selection.index, text.length)}`;
      selectStart = selection.index + 1;
      selectEnd = selectStart + 2;
    }
    return {
      value,
      selectStart,
      selectEnd
    };
  }

  // 下划线
  underline(text: string, selection: MdSelection): ResTrans {
    let value = '';
    let selectStart = 0;
    let selectEnd = 0;
    if (selection.text) {
      value = `${text.substring(0, selection.index)}<u>${selection.text}</u>${text.substring(selection.index + selection.text.length, text.length)}`;
      selectStart = selection.index + 3;
      selectEnd = selectStart + selection.text.length;
    } else {
      value = `${text.substring(0, selection.index)}<u>下划线</u>${text.substring(selection.index, text.length)}`;
      selectStart = selection.index + 3;
      selectEnd = selectStart + 3;
    }
    return {
      value,
      selectStart,
      selectEnd
    };
  }

  // 下标
  sub(text: string, selection: MdSelection): ResTrans {
    let value = '';
    let selectStart = 0;
    let selectEnd = 0;
    if (selection.text) {
      value = `${text.substring(0, selection.index)}<sub>${selection.text}</sub>${text.substring(selection.index + selection.text.length, text.length)}`;
      selectStart = selection.index + 5;
      selectEnd = selectStart + selection.text.length;
    } else {
      value = `${text.substring(0, selection.index)}<sub>下标</sub>${text.substring(selection.index, text.length)}`;
      selectStart = selection.index + 5;
      selectEnd = selectStart + 2;
    }
    return {
      value,
      selectStart,
      selectEnd
    };
  }

  // 上标
  sup(text: string, selection: MdSelection): ResTrans {
    let value = '';
    let selectStart = 0;
    let selectEnd = 0;
    if (selection.text) {
      value = `${text.substring(0, selection.index)}<sup>${selection.text}</sup>${text.substring(selection.index + selection.text.length, text.length)}`;
      selectStart = selection.index + 5;
      selectEnd = selectStart + selection.text.length;
    } else {
      value = `${text.substring(0, selection.index)}<sup>上标</sup>${text.substring(selection.index, text.length)}`;
      selectStart = selection.index + 5;
      selectEnd = selectStart + 2;
    }
    return {
      value,
      selectStart,
      selectEnd
    };
  }

  // 引用
  quote(text: string, selection: MdSelection): ResTrans {
    let value = '';
    let selectStart = 1;
    let selectEnd = 0;
    const arrs = text.split('\n');
    if (arrs[selection.rowNum - 1] || arrs[selection.rowNum - 1] === '') {
      arrs[selection.rowNum - 1] = `>${arrs[selection.rowNum - 1]}`;
    }
    value = arrs.join('\n');
    arrs.forEach((e, index) => {
      if (index < selection.rowNum - 1) {
        selectStart += e.length + 1;
      }
    });
    selectEnd = selectStart + arrs[selection.rowNum - 1].length;
    return {
      value,
      selectStart,
      selectEnd
    };
  }

  // 标题
  title(text: string, selection: MdSelection, level: number): ResTrans {
    const arrs = text.split('\n');
    let selectStart = level;
    let selectEnd = 0;
    if (arrs[selection.rowNum - 1]) {
      arrs[selection.rowNum - 1] = `${'#'.repeat(level)} ${arrs[selection.rowNum - 1]}`;
      arrs.forEach((e, index) => {
        index += 1;
        if (index < selection.rowNum) {
          selectStart += e.length + 1 + level + 1;
        }
      });
      selectEnd += selectStart + arrs[selection.rowNum - 1].length + 1;
    } else if (arrs[selection.rowNum - 1] === '') {
      arrs[selection.rowNum - 1] = `${'#'.repeat(level)} ${this.titleMap[level]}`;
      arrs.forEach((e, index) => {
        index += 1;
        if (index === selection.rowNum) {
          selectStart += 1;
        }
      });
      selectEnd += selectStart + 4;
    }
    const value = arrs.join('\n');

    return {
      value,
      selectStart,
      selectEnd
    };
  }

  // 行内代码块
  codeRow(text: string, selection: MdSelection): ResTrans {
    let value = '';
    let selectStart = 0;
    let selectEnd = 0;
    if (selection.text) {
      value = text.substring(0, selection.index) + '`' + selection.text + '`' +
        text.substring(selection.index + selection.text.length, text.length);
      selectStart = selection.index + 1;
      selectEnd = selectStart + selection.text.length;
    } else {
      value = text.substring(0, selection.index) + '`代码`' + text.substring(selection.index, text.length) + '';
      selectStart = selection.index + 1;
      selectEnd = selectStart + 2;
    }
    return {
      value,
      selectStart,
      selectEnd
    };
  }

  // 插入代码块
  code(text: string, selection: MdSelection): ResTrans {
    let value = '';
    let selectStart = 0;
    let selectEnd = 0;
    if (selection.text) {
      value = text.substring(0, selection.index) + '```' + selection.text + '```' +
        text.substring(selection.index + selection.text.length, text.length);
      selectStart = selection.index + 4;
      selectEnd = selectStart + selection.text.length;
    } else {
      value = text.substring(0, selection.index) + '```\n输入代码\n````' + text.substring(selection.index, text.length) + '';
      selectStart = selection.index + 4;
      selectEnd = selectStart + 4;
    }
    return {
      value,
      selectStart,
      selectEnd
    };
  }

  // 插入图片
  image(text: string, selection: MdSelection, data: any): ResTrans {
    const { desc, path } = data;
    let value = '';
    let selectStart = 0;
    let selectEnd = 0;
    if (selection.text) {
      value = `${text.substring(0, selection.index)}![${desc}](${path})${text.substring(selection.index + selection.text.length, text.length)}`;
      selectStart = selection.index + 4;
      selectEnd = selectStart + selection.text.length;
    } else {
      value = `${text.substring(0, selection.index)}![${desc || '描述'}](${path})${text.substring(selection.index, text.length)}`;
      selectStart = selection.index + 4;
      selectEnd = selectStart + 2;
    }
    return {
      value,
      selectStart,
      selectEnd
    };
  }

  // 插入链接
  link(text: string, selection: MdSelection, data: any): ResTrans {
    const { desc, path } = data;
    let value = '';
    let selectStart = 0;
    let selectEnd = 0;
    if (selection.text) {
      value = `${text.substring(0, selection.index)}[${desc}](${path})${text.substring(selection.index + selection.text.length, text.length)}`;
      selectStart = selection.index + 3;
      selectEnd = selectStart + selection.text.length;
    } else {
      value = `${text.substring(0, selection.index)}[${desc || '描述'}](${path})${text.substring(selection.index, text.length)}`;
      selectStart = selection.index + 3;
      selectEnd = selectStart + 2;
    }
    return {
      value,
      selectStart,
      selectEnd
    };
  }

  // 插入表格
  table(text: string, selection: MdSelection): ResTrans {
    let value = '';
    let selectStart = 0;
    let selectEnd = 0;
    const defaultdata = `| 表列 A | 表列 B |
| ----- | ----- |
| 单元 1 | 单元 2 |
| 单元 3 | 单元 4 |`;
    if (selection.text) {
      value = `${text.substring(0, selection.index)}${defaultdata}${text.substring(selection.index + selection.text.length, text.length)}`;
    } else {
      value = `${text.substring(0, selection.index)}${defaultdata}${text.substring(selection.index, text.length)}`;
    }
    selectStart = selection.index;
    selectEnd = selectStart + defaultdata.length;
    return {
      value,
      selectStart,
      selectEnd
    };
  }

  // 插入流程图
  liuchengtu(text: string, selection: MdSelection, value: string): ResTrans {
    const defaultData = lctDefaultValue[value] || '';
    const values = `${text.substring(0, selection.index)}${defaultData}${text.substring(selection.index, text.length)}`;
    let selectStart = 0;
    let selectEnd = 0;
    selectStart = selection.index + 3;
    selectEnd = selectStart + defaultData.length - 7;
    return {
      value: values,
      selectStart,
      selectEnd
    };
  }

  // 插入公式
  gongshi(text: string, selection: MdSelection, value: string): ResTrans {
    let values = '';
    let selectStart = 0;
    let selectEnd = 0;
    if (value === 'inner') {
      if (selection.text) {
        values = text.substring(0, selection.index) + '\\\\(' + selection.text + '\\\\)' +
          text.substring(selection.index + selection.text.length, text.length);
        selectStart = selection.index + 4;
        selectEnd = selectStart + selection.text.length;
      } else {
        values = text.substring(0, selection.index) + '\\\\(公式\\\\)' + text.substring(selection.index, text.length) + '';
        selectStart = selection.index + 3;
        selectEnd = selectStart + 2;
      }
    } else if (value === 'padding') {
      if (selection.text) {
        values = text.substring(0, selection.index) + '$$\n' + selection.text + '\n$$' +
          text.substring(selection.index + selection.text.length, text.length);
        selectStart = selection.index + 3;
        selectEnd = selectStart + selection.text.length;
      } else {
        values = text.substring(0, selection.index) + '$$\n公式\n$$' + text.substring(selection.index, text.length) + '';
        selectStart = selection.index + 3;
        selectEnd = selectStart + 2;
      }
    }

    return {
      value: values,
      selectStart,
      selectEnd
    };
  }

  // 插入可视化编辑器生成的内容
  visualInsert(text: string, selection: MdSelection, payload: VisualInsertPayload): ResTrans {
    const content = (payload.content || '').trim();
    if (!content) {
      return {
        value: text,
        selectStart: selection.index,
        selectEnd: selection.index
      };
    }

    const start = selection.index;
    const end = selection.index + selection.text.length;
    let inserted = '';
    if (payload.kind === 'inline-formula') {
      inserted = `$${content}$`;
    } else if (payload.kind === 'block-formula') {
      inserted = `$$\n${content}\n$$`;
    } else if (payload.kind === 'mermaid') {
      inserted = '```mermaid\n' + content + '\n```';
    }

    return {
      value: text.substring(0, start) + inserted + text.substring(end),
      selectStart: start,
      selectEnd: start + inserted.length
    };
  }

  // 有序列表
  olList(text: string, selection: MdSelection): ResTrans {
    let value = '';
    let selectStart = 3;
    let selectEnd = 0;
    const arrs = text.split('\n');
    if (arrs[selection.rowNum - 1] || arrs[selection.rowNum - 1] === '') {
      arrs[selection.rowNum - 1] = `1. ${arrs[selection.rowNum - 1]}`;
    }
    value = arrs.join('\n');
    arrs.forEach((e, index) => {
      if (index < selection.rowNum - 1) {
        selectStart += e.length + 1;
      }
    });
    selectEnd = selectStart + arrs[selection.rowNum - 1].length;
    return {
      value,
      selectStart,
      selectEnd
    };
  }

  // 无序列表
  ulList(text: string, selection: MdSelection): ResTrans {
    let value = '';
    let selectStart = 2;
    let selectEnd = 0;
    const arrs = text.split('\n');
    if (arrs[selection.rowNum - 1] || arrs[selection.rowNum - 1] === '') {
      arrs[selection.rowNum - 1] = `- ${arrs[selection.rowNum - 1]}`;
    }
    value = arrs.join('\n');
    arrs.forEach((e, index) => {
      if (index < selection.rowNum - 1) {
        selectStart += e.length + 1;
      }
    });
    selectEnd = selectStart + arrs[selection.rowNum - 1].length;
    return {
      value,
      selectStart,
      selectEnd
    };
  }
}

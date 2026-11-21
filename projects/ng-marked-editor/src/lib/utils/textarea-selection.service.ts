import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { MdSelection } from '../types/editor';

@Injectable({
  providedIn: 'root'
})
export class TextareaSelectionService {
  private readonly document = inject(DOCUMENT);

  getSelection(el?: HTMLTextAreaElement): MdSelection {
    if (!el) {
      return { index: 0, text: '', rowNum: 1 };
    }
    const index = this.getTextAreaPos(el) || 0;
    const text = this.getSelected(el) || '';
    const rowNum = this.getTextAreaRowNum(el);
    return {
      index,
      text,
      rowNum
    };
  }

  // 字符位置
  private getTextAreaPos(el: HTMLTextAreaElement): number {
    let range: any;
    let textRange: any;
    let duplicate: any;
    el.focus();
    if (el.selectionStart) {
      return el.selectionStart;
    } else if ((this.document as any).selection) { // IE
      range = (this.document as any).selection.createRange();
      if (range == null) {
        return el.value.length;
      }
      textRange = (el as any).createTextRange();
      duplicate = textRange.duplicate();
      textRange.moveToBookmark(range.getBookmark());
      duplicate.setEndPoint('EndToStart', textRange);
      return duplicate.text.length;
    } else {
      return 0;
    }
  }

  getTextAreaRowNum(el: HTMLTextAreaElement): number {
    let range: any;
    let textRange: any;
    let duplicate: any;
    let index = 0;
    el.focus();
    if (el.selectionStart) {
      index = el.selectionStart;
    } else if ((this.document as any).selection) { // IE
      range = (this.document as any).selection.createRange();
      if (range == null) {
        return el.value.length;
      }
      textRange = (el as any).createTextRange();
      duplicate = textRange.duplicate();
      textRange.moveToBookmark(range.getBookmark());
      duplicate.setEndPoint('EndToStart', textRange);
      index = duplicate.text.length;
    }
    const ed = el.value.substring(0, index).split('\n');
    const fontSize = this.getFontSize(el);
    let lineNum = 0;
    for (const e of ed) {
      if (e && e.trim()) {
        lineNum += this.countChartLength(e, el.clientWidth, Number(fontSize));
      }
    }
    return ed.length + lineNum;
  }

  textSelect(textarea: any, start: number, end: number): void {
    if (!textarea) {
      return;
    }
    if (textarea.setSelectionRange) {
      textarea.setSelectionRange(start, end);
    } else if (textarea.createTextRange) {
      const rang = textarea.createTextRange();
      rang.collapse(true);
      rang.moveStart('character', start);
      rang.moveEnd('character', end - start);
      rang.select();
    }
  }

  private getSelected(textarea: any): string {
    if (textarea.selectionStart) {
      return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    } else if ((this.document as any).selection) {
      return (this.document as any).selection.createRange().text;
    }
    return '';
  }

  getFontSize(el: HTMLElement): string {
    if (el.style.fontSize) {
      return el.style.fontSize;
    } else if (el.parentElement) {
      return this.getFontSize(el.parentElement);
    } else {
      return '16';
    }
  }

  // 计算字符串长度（按双字节字符估算换行）
  countChartLength(text: string, width: number, fontsize: number): number {
    let length = 0;
    Array.from(text).forEach((char) => {
      if (char.charCodeAt(0) > 255) { // 双字节字符
        length += 2;
      } else {
        length++;
      }
    });
    if ((length * fontsize / 2) > width) {
      const num = -~(length * fontsize / width / 2);
      return num - 1;
    } else {
      return 0;
    }
  }
}

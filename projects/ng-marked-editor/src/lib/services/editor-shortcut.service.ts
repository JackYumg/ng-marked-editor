import { Injectable } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import {
  EditorShortcutAction,
  EditorShortcutBinding,
  EditorShortcutMap,
  resolveShortcutMap
} from '../types/editor';

// 解析后的单个键位
interface ParsedShortcut {
  action: EditorShortcutAction;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  alt: boolean;
  token: string;
}

@Injectable()
export class EditorShortcutService {
  // SSR 安全：无 navigator 时按非 macOS 处理
  private readonly mac = typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || '');

  get isMac(): boolean {
    return this.mac;
  }

  // 监听键盘事件并派发命中的动作
  // mergeDefaults 为 false 时只解析传入的键位，不合并默认键位（用于 window 等全局监听）
  bind(
    target: EventTarget,
    overrides: EditorShortcutMap | undefined,
    handler: (action: EditorShortcutAction, event: KeyboardEvent) => boolean | void,
    options?: { mergeDefaults?: boolean }
  ): Subscription {
    const bindings = this.parseMap(overrides, options?.mergeDefaults !== false);
    return fromEvent<KeyboardEvent>(target as any, 'keydown').subscribe((event) => {
      // 输入法组合中不触发
      if (event.isComposing) {
        return;
      }
      const binding = bindings.find((item) => this.matches(item, event));
      if (!binding) {
        return;
      }
      // handler 返回 false 时保留浏览器默认行为
      if (handler(binding.action, event) !== false) {
        event.preventDefault();
      }
    });
  }

  // 修饰键必须完全相等，主键匹配 key / code
  private matches(binding: ParsedShortcut, event: KeyboardEvent): boolean {
    if (
      event.ctrlKey !== binding.ctrl ||
      event.metaKey !== binding.meta ||
      event.shiftKey !== binding.shift ||
      event.altKey !== binding.alt
    ) {
      return false;
    }
    const key = (event.key || '').toLowerCase();
    const code = (event.code || '').toLowerCase();
    return key === binding.token ||
      code === binding.token ||
      code === `key${binding.token}` ||
      code === `digit${binding.token}`;
  }

  // 把配置合并后解析成扁平列表
  private parseMap(overrides?: EditorShortcutMap, mergeDefaults = true): ParsedShortcut[] {
    const map = mergeDefaults ? resolveShortcutMap(overrides) : (overrides || {});
    const result: ParsedShortcut[] = [];
    (Object.keys(map) as EditorShortcutAction[]).forEach((action) => {
      this.parseBinding(action, map[action], result);
    });
    return result;
  }

  private parseBinding(
    action: EditorShortcutAction,
    binding: EditorShortcutBinding | undefined,
    result: ParsedShortcut[]
  ): void {
    // null 表示禁用该动作
    if (binding === null || binding === undefined) {
      return;
    }
    const list: readonly string[] = typeof binding === 'string' ? [binding] : binding;
    list.forEach((combo) => {
      const parsed = this.parseCombo(action, combo);
      if (parsed) {
        result.push(parsed);
      }
    });
  }

  // 解析形如 mod+shift+z 的键位
  private parseCombo(action: EditorShortcutAction, combo: string): ParsedShortcut | null {
    if (!combo) {
      return null;
    }
    const tokens = combo.toLowerCase().split('+').map((item) => item.trim()).filter(Boolean);
    if (!tokens.length) {
      return null;
    }
    const parsed: ParsedShortcut = {
      action,
      ctrl: false,
      meta: false,
      shift: false,
      alt: false,
      token: ''
    };
    tokens.forEach((token) => {
      switch (token) {
        case 'mod':
          if (this.mac) {
            parsed.meta = true;
          } else {
            parsed.ctrl = true;
          }
          break;
        case 'ctrl':
        case 'control':
          parsed.ctrl = true;
          break;
        case 'cmd':
        case 'command':
        case 'meta':
          parsed.meta = true;
          break;
        case 'shift':
          parsed.shift = true;
          break;
        case 'alt':
        case 'option':
          parsed.alt = true;
          break;
        default:
          parsed.token = token;
      }
    });
    return parsed.token ? parsed : null;
  }
}

import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * 平台判断服务。
 * 组件库内所有浏览器 API（window / document / localStorage / navigator）
 * 必须经过该服务判断后再访问，保证 SSR 下可安全渲染。
 */
@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly isBrowser = isPlatformBrowser(this.platformId);

  get window(): Window | null {
    return this.isBrowser ? window : null;
  }

  get localStorage(): Storage | null {
    if (!this.isBrowser) {
      return null;
    }
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }
}

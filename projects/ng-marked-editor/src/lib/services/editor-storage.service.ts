import { EventEmitter, inject, Injectable } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { audit } from 'rxjs/operators';
import { PlatformService } from '../core/platform.service';

@Injectable()
export class EditorStorageService {
  private readonly platform = inject(PlatformService);

  config = {
    appkey: '',
    timer: 10000 // 默认十秒钟
  };

  saveEvent: EventEmitter<string> = new EventEmitter();

  private saveSub?: Subscription;

  loadConfig(appkey: string): Promise<boolean> {
    this.config.appkey = appkey;
    return Promise.resolve(true);
  }

  start(): void {
    // SSR 环境没有 localStorage，直接跳过自动保存
    if (!this.platform.localStorage || this.saveSub) {
      return;
    }
    this.saveSub = this.saveEvent
      .pipe(audit(() => interval(this.config.timer)))
      .subscribe((value: string) => this.save(value));
  }

  private save(value: string): void {
    this.platform.localStorage?.setItem(`savePath_${this.config.appkey}`, value);
  }

  destory(): void {
    this.platform.localStorage?.removeItem(`savePath_${this.config.appkey}`);
    this.saveSub?.unsubscribe();
    this.saveSub = undefined;
  }

  saveImidet(value: string): void {
    this.save(value);
  }

  clearAll(): void {
    const storage = this.platform.localStorage;
    if (!storage) {
      return;
    }
    const keys = Object.keys(storage);
    keys.forEach((key) => {
      if (/^savePath/.test(key)) {
        storage.removeItem(key);
      }
    });
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WebsiteAlertNotification {
  id: string;
  title: string;
  message: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  txId: string;
  amount: number;
  score: number;
  timestamp: string;
}

export class NotificationService {
  private static instance: NotificationService;
  private audioCtx: AudioContext | null = null;
  private listeners: Set<(notification: WebsiteAlertNotification) => void> = new Set();
  private recentNotifications: WebsiteAlertNotification[] = [];

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public subscribe(fn: (notification: WebsiteAlertNotification) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public getRecentNotifications(): WebsiteAlertNotification[] {
    return [...this.recentNotifications];
  }

  public clearRecentNotifications(): void {
    this.recentNotifications = [];
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification('FRAUDGUARD AI: Website Notifications Active', {
            body: 'Real-time alert notifications enabled for intercepted payment risk events.',
            icon: '/favicon.ico',
          });
          return true;
        }
      } catch (err) {
        console.warn('Notification permission request error:', err);
      }
    }
    return false;
  }

  public isPermissionGranted(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    );
  }

  public playAlertSound(severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const baseFreq = severity === 'CRITICAL' ? 880 : severity === 'HIGH' ? 660 : 520;
      osc.type = severity === 'CRITICAL' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.3);
    } catch {
      // Audio playback fails silently if user has not interacted with DOM yet
    }
  }

  public sendAlertNotification(data: {
    txId: string;
    amount: number;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    reason: string;
    score: number;
    decision: 'BLOCKED' | 'FLAGGED';
  }): void {
    const title =
      data.decision === 'BLOCKED'
        ? `🚨 FRAUD BLOCKED: ${data.txId}`
        : `⚠️ SUSPICIOUS PAYMENT FLAGGED: ${data.txId}`;
    const body = `Risk Score ${data.score}/100 • $${data.amount.toLocaleString()} • ${data.reason}`;

    // 1. Native HTML5 Web Browser Notification
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: data.txId,
        });
      } catch (err) {
        console.warn('Native notification trigger failed:', err);
      }
    }

    // 2. Audible notification tone
    this.playAlertSound(data.severity);

    // 3. Emit in-app website notification banner
    const notification: WebsiteAlertNotification = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      message: body,
      severity: data.severity,
      txId: data.txId,
      amount: data.amount,
      score: data.score,
      timestamp: new Date().toISOString(),
    };

    this.recentNotifications.unshift(notification);
    if (this.recentNotifications.length > 20) this.recentNotifications.pop();

    this.listeners.forEach((fn) => {
      try {
        fn(notification);
      } catch (err) {
        console.error('Error invoking notification listener:', err);
      }
    });
  }
}

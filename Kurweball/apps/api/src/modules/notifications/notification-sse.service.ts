import { Injectable, MessageEvent } from '@nestjs/common';
import { Subject, Observable, merge, interval, map } from 'rxjs';

@Injectable()
export class NotificationSseService {
  private readonly clients = new Map<string, Subject<MessageEvent>>();

  subscribe(userId: string): Observable<MessageEvent> {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Subject<MessageEvent>());
    }

    const subject = this.clients.get(userId)!;
    const heartbeat$ = interval(30000).pipe(
      map(() => ({ data: 'heartbeat', type: 'heartbeat' } as MessageEvent)),
    );

    console.log(`[NotificationSSE] Client subscribed: ${userId}`);

    return new Observable<MessageEvent>((subscriber) => {
      const sub = merge(subject.asObservable(), heartbeat$).subscribe(subscriber);

      // Cleanup when client disconnects
      return () => {
        sub.unsubscribe();
        this.removeClient(userId);
      };
    });
  }

  pushToUser(userId: string, notification: Record<string, any>): void {
    const subject = this.clients.get(userId);
    if (subject) {
      subject.next({
        data: JSON.stringify(notification),
        type: 'notification',
      } as MessageEvent);
      console.log(`[NotificationSSE] Pushed to user ${userId}`);
    }
  }

  removeClient(userId: string): void {
    const subject = this.clients.get(userId);
    if (subject) {
      subject.complete();
      this.clients.delete(userId);
      console.log(`[NotificationSSE] Client removed: ${userId}`);
    }
  }
}

import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Comment } from '../../entities/comment/model/comment';
import { baseUrl } from '../../app.constants';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private stompClient: Client | undefined;
  private baseUrl = `${baseUrl}/ws`;
  private isConnected = false;
  private reconnectInterval = 5000;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.stompClient) {
        resolve();
        return;
      }

      const token = localStorage.getItem('token');
      const wsUrl = `${this.baseUrl}?token=${token}`;

      // Фабрика WebSocket — рекомендуемый способ для @stomp/stompjs + SockJS (без предупреждения Stomp.over).
      this.stompClient = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        reconnectDelay: 0
      });

      this.stompClient.onConnect = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      };

      this.stompClient.onStompError = (error) => {
        this.isConnected = false;
        this.handleDisconnect();
        reject(error);
      };

      this.stompClient.onDisconnect = () => {
        this.isConnected = false;
        this.handleDisconnect();
        reject();
      };

      this.stompClient.activate();
    });
  }

  private handleDisconnect(): void {
    this.isConnected = false;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`Reconnecting to WebSocket... Attempt ${this.reconnectAttempts + 1}`);
      this.reconnectAttempts++;
      void this.connect();
    } else {
      console.error('Max reconnect attempts reached. Giving up.');
    }
  }

  subscribeToJob(jobId: string, callback: (message: Comment) => void): void {
    if (this.stompClient && this.isConnected) {
      this.stompClient.subscribe(`/topic/job/${jobId}`, (message) => {
        callback(JSON.parse(message.body));
      });
    }
  }

  sendMessage(destination: string, message: unknown): void {
    if (this.stompClient && this.isConnected) {
      this.stompClient.publish({ destination, body: JSON.stringify(message) });
    }
  }

  disconnect(): void {
    if (this.stompClient) {
      void this.stompClient.deactivate();
      this.isConnected = false;
    }
  }
}

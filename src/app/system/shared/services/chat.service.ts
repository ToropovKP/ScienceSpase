import {Injectable} from '@angular/core';
import {Client, Stomp} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {Comment} from "../model/comment";
import {baseUrl} from "../../../app.constants";

@Injectable({providedIn: 'root'})
export class ChatService {
  private stompClient: Client | undefined;
  private baseUrl = `${baseUrl}/ws`;
  private isConnected: boolean = false;
  private reconnectInterval: number = 5000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 20;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.stompClient) {
        resolve();
        return;
      }

      const token = localStorage.getItem('token');
      const socket = new SockJS(this.baseUrl + '?token=' + token);
      this.stompClient = Stomp.over(socket);

      this.stompClient.onConnect = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      };

      this.stompClient.onStompError = (error) => {
        this.isConnected = false;
        this.handleDisconnect();
        reject(error);
      }

      this.stompClient.onDisconnect = () => {
        this.isConnected = false;
        this.handleDisconnect();
        reject();
      };

      this.stompClient.reconnectDelay = this.reconnectInterval;
      this.stompClient.activate();
    });
  }

  //TODO не работает
  private handleDisconnect(): void {
    this.isConnected = false;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(
          `Reconnecting to WebSocket... Attempt ${this.reconnectAttempts + 1}`
      );
      this.reconnectAttempts++;
      this.connect().then(); // Пытаемся подключиться заново
    } else {
      console.error('Max reconnect attempts reached. Giving up.');
    }
  }

  subscribeToJob(jobId: string, callback: (message: Comment) => void) {
    if (this.stompClient && this.isConnected) {
      this.stompClient.subscribe(`/topic/job/${jobId}`, (message) => {
        callback(JSON.parse(message.body));
      });
    }
  }

  sendMessage(destination: string, message: any) {
    if (this.stompClient && this.isConnected) {
      this.stompClient.publish({destination, body: JSON.stringify(message)});
    }
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.isConnected = false;
    }
  }
}
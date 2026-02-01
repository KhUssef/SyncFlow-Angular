import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io } from 'socket.io-client';

export interface ChatSummary {
  id: number;
  name: string;
  type: string;
  createdAt: string;
  messageCount?: number;
  lastMessage?: {
    content: string;
    senderUsername: string;
    createdAt: string;
  };
}

export interface MessageResponse {
  id: number;
  content: string;
  createdAt: string;
  sender: {
    id: number;
    username: string;
  };
}

export interface PaginatedQuery {
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/chat';

  getChats(query?: PaginatedQuery): Observable<ChatSummary[]> {
    let params = new HttpParams();
    if (query?.page !== undefined) params = params.set('page', query.page);
    if (query?.limit !== undefined) params = params.set('limit', query.limit);
    return this.http.get<ChatSummary[]>(this.baseUrl, { params });
  }

  getMessages(chatId: number, query?: PaginatedQuery): Observable<MessageResponse[]> {
    let params = new HttpParams();
    if (query?.page !== undefined) params = params.set('page', query.page);
    if (query?.limit !== undefined) params = params.set('limit', query.limit);
    return this.http.get<MessageResponse[]>(`${this.baseUrl}/${chatId}/messages`, { params });
  }

  createChat(payload: { name: string; type?: string }): Observable<ChatSummary> {
    return this.http.post<ChatSummary>(this.baseUrl, payload);
  }

  sendMessage(chatId: number, payload: { content: string }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/${chatId}/message`, payload);
  }

  deleteChat(chatId: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${chatId}`);
  }

  /**
   * Socket.io connector. Requires the `socket.io-client` dependency.
   * Example usage:
   * ```ts
   * const socket = await chatService.connectSocket({ chatId, token });
   * socket.on('newMessage', ...);
   * socket.emit('sendMessage', { content: 'Hello', chatId });
   * ```
   */
  async connectSocket(options: { chatId: number; token: string }) {
    const { chatId, token } = options;
    // Server expects token in auth and roomId as query
    return io('http://localhost:3000/chat', {
      auth: { token: `Bearer ${token}` },
      query: { roomId: chatId },
      transports: ['websocket']
    });
  }
}

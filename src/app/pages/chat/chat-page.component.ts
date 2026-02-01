import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ChatService, ChatSummary, MessageResponse } from '../../services/chat.service';
import { Socket } from 'socket.io-client';
import { Observable, shareReplay, tap, Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.css']
})
export class ChatPageComponent implements OnInit, OnDestroy {
  user: any = null;
  isManager = false;

  chats$: Observable<ChatSummary[]> | null = null;

  messages = signal<MessageResponse[]>([]);

  selectedChat = signal<ChatSummary | null>(null);
  newMessage = '';
  newChatName = '';
  showCreateChat = false;
  connectedUsers = signal<Array<{ userId: number; username: string }>>([]);

  private socket: Socket | null = null;
  private currentRoomId: number | null = null;
  private userSub?: Subscription;
  private managerSub?: Subscription;

  constructor(private auth: AuthService, private chatService: ChatService) {}

  ngOnInit(): void {
    this.auth.checkauthstatus();
    this.userSub = this.auth.user$.subscribe((u) => {
      this.user = u;
    });
    this.managerSub = this.auth.isManager$.subscribe((v) => {
      this.isManager = v;
    });
    this.loadChats();
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.managerSub?.unsubscribe();
    this.disconnectSocket();
  }

  loadChats(): void {
    this.chats$ = this.chatService.getChats().pipe(
      tap((chats) => {
        const selected = this.selectedChat();
        if (!selected && chats.length) {
          this.selectChat(chats[0]);
          return;
        }
        if (selected && !chats.find((c) => c.id === selected.id)) {
          this.selectedChat.set(null);
          this.messages.set([]);
          this.disconnectSocket();
        }
      }),
      shareReplay(1)
    );
  }

  selectChat(chat: ChatSummary): void {
    this.selectedChat.set(chat);
    this.loadMessages(chat.id);
    this.connectSocket(chat.id);
  }

  loadMessages(chatId: number): void {
    this.chatService.getMessages(chatId).subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        setTimeout(() => this.scrollToBottom(), 0);
      },
      error: (err) => console.error('Failed to load messages', err)
    });
    
  }

  async connectSocket(chatId: number): Promise<void> {

    const token = localStorage.getItem('accessToken');
    if (!token) return;


    if (this.socket && this.socket.connected && this.currentRoomId === chatId) {
      console.log('Already connected to the desired chat socket');
      return;
    }
    console.log('Connecting to chat socket for chatId:', chatId);
    this.socket?.disconnect();

    try {
      this.socket = await this.chatService.connectSocket({ chatId, token });


      this.socket.onAny((event, ...args) => {
        console.log(`Socket event: ${event}`, args);
      });

      this.socket.on('connect', () => {
        console.log('Connected to chat socket');
        this.currentRoomId = chatId;
      });

      this.socket.on('connect_error', (err) => {
        console.error('Socket connect_error', err);
      });

      this.socket.on('error', (err) => {
        console.error('Socket error', err);
      });

      this.socket.on('disconnect', (reason) => {
        console.warn('Socket disconnected', reason);
      });

      this.socket.io.on('reconnect_attempt', (attempt) => {
        console.warn('Socket reconnect attempt', attempt);
      });

      this.socket.on('connectedUsers', (users: Array<{ userId: number; username: string }>) => {
        console.log('Connected users:', users);
        this.connectedUsers.set(users);
      });

      this.socket.on('userOnline', (user) => {
        if (!this.connectedUsers().find((u) => u.userId === user.userId)) {
          this.connectedUsers.update((prev) => [...prev, user]);
        }
      });

      this.socket.on('userOffline', (user) => {
        this.connectedUsers.update((prev) => prev.filter((u) => u.userId !== user.userId));
      });

      this.socket.on('newMessage', (payload: { chatId: number; message: MessageResponse }) => {
        if (payload.chatId !== this.selectedChat()?.id) return;
        if (this.messageExists(payload.message.id)) {
          return; // ignore duplicate delivery
        }
        this.messages.update((prev) => [...prev, payload.message]);
        this.updateChatPreview(payload.chatId, payload.message);
        setTimeout(() => this.scrollToBottom(), 0);
      });

    } catch (err) {
      console.error('Failed to connect socket', err);
    }
  }

  disconnectSocket(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentRoomId = null;
  }

  createChat(): void {
    const name = this.newChatName.trim();
    if (!name) return;

    this.chatService.createChat({ name }).subscribe({
      next: (chat) => {
        this.newChatName = '';
        this.showCreateChat = false;
        this.selectChat(chat);
        this.loadChats();
      },
      error: (err) => console.error('Failed to create chat', err)
    });
  }

  deleteChat(chatId: number): void {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    this.chatService.deleteChat(chatId).subscribe({
      next: () => {
        if (this.selectedChat()?.id === chatId) {
          this.selectedChat.set(null);
          this.messages.set([]);
          this.disconnectSocket();
        }
        this.loadChats();
      },
      error: (err) => console.error('Failed to delete chat', err)
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedChat()) return;
    const content = this.newMessage.trim();
    const chatId = this.selectedChat()!.id;

    if (this.socket && this.socket.connected) {
      this.socket.emit('sendMessage', { content, chatId });
      // optimistic clear
      this.newMessage = '';
      return;
    }

    // Fallback to HTTP if socket not ready
    this.chatService.sendMessage(chatId, { content }).subscribe({
      next: (message) => {
        this.messages.update((prev) => [...prev, message]);
        this.updateChatPreview(chatId, message);
        this.newMessage = '';
        setTimeout(() => this.scrollToBottom(), 0);
      },
      error: (err) => console.error('Failed to send message', err)
    });
  }

  private updateChatPreview(chatId: number, message: MessageResponse): void {
    // Refresh list to keep preview/counts in sync
    this.loadChats();
  }

  private messageExists(id: number): boolean {
    return this.messages().some((m) => m.id === id);
  }

  scrollToBottom(): void {
    const el = document.querySelector('.messagesContainer');
    if (el) el.scrollTop = el.scrollHeight;
  }
}

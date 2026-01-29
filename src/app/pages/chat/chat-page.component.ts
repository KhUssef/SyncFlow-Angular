import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface Chat {
  id: number;
  name: string;
  lastMessage?: { senderUsername: string; content: string };
  messageCount: number;
}

interface Message {
  id: number;
  chatId: number;
  sender: { id: string; username: string };
  content: string;
  createdAt: string;
}

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.css']
})
export class ChatPageComponent {
  user = this.auth.getCurrentUser();
  isManager = this.auth.getIsManager();

  chats: Chat[] = [
    { id: 1, name: 'General', lastMessage: { senderUsername: 'Alice', content: 'Welcome!' }, messageCount: 3 },
    { id: 2, name: 'Project X', lastMessage: { senderUsername: 'Bob', content: 'Status update' }, messageCount: 2 }
  ];

  messages: Message[] = [];
  messagesByChat = new Map<number, Message[]>([
    [1, [
      { id: 1, chatId: 1, sender: { id: '2', username: 'Alice' }, content: 'Welcome!', createdAt: new Date().toISOString() },
      { id: 2, chatId: 1, sender: { id: '1', username: this.user?.username || 'You' }, content: 'Thanks!', createdAt: new Date().toISOString() }
    ]],
    [2, [
      { id: 3, chatId: 2, sender: { id: '3', username: 'Bob' }, content: 'Status update', createdAt: new Date().toISOString() }
    ]]
  ]);

  selectedChat: Chat | null = null;
  newMessage = '';
  newChatName = '';
  showCreateChat = false;
  connectedUsers = [
    { userId: '1', username: this.user?.username || 'You' },
    { userId: '2', username: 'Alice' },
    { userId: '3', username: 'Bob' }
  ];

  constructor(private auth: AuthService) {}

  selectChat(chat: Chat) {
    this.selectedChat = chat;
    this.messages = this.messagesByChat.get(chat.id) ?? [];
  }

  createChat() {
    const name = this.newChatName.trim();
    if (!name) return;
    const id = Math.max(0, ...this.chats.map(c => c.id)) + 1;
    const newChat: Chat = { id, name, messageCount: 0 };
    this.chats = [newChat, ...this.chats];
    this.messagesByChat.set(id, []);
    this.newChatName = '';
    this.showCreateChat = false;
    this.selectChat(newChat);
  }

  deleteChat(chatId: number) {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    this.chats = this.chats.filter(c => c.id !== chatId);
    this.messagesByChat.delete(chatId);
    if (this.selectedChat?.id === chatId) {
      this.selectedChat = null;
      this.messages = [];
    }
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedChat) return;
    const chatId = this.selectedChat.id;
    const list = this.messagesByChat.get(chatId) ?? [];
    const id = Math.max(0, ...Array.from(this.messagesByChat.values()).flat().map(m => m.id)) + 1;
    const message: Message = {
      id,
      chatId,
      sender: { id: this.user?.id ?? '0', username: this.user?.username ?? 'You' },
      content: this.newMessage.trim(),
      createdAt: new Date().toISOString()
    };
    list.push(message);
    this.messagesByChat.set(chatId, list);
    this.messages = list;

    // Update chat preview
    this.chats = this.chats.map(c => c.id === chatId ? { ...c, lastMessage: { senderUsername: message.sender.username, content: message.content }, messageCount: (c.messageCount || 0) + 1 } : c);

    this.newMessage = '';
    setTimeout(() => this.scrollToBottom(), 0);
  }

  scrollToBottom() {
    const el = document.querySelector('.messagesContainer');
    if (el) el.scrollTop = el.scrollHeight;
  }
}

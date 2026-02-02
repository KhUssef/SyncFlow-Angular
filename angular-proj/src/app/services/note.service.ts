import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface NoteInfo {
  id: number;
  title: string;
  lineCount: number;
  company?: { id: number } | number | string;
}

export interface NoteLine {
  id: number;
  lineNumber: number;
  content?: string;
}

export interface CreateNoteDto {
  title: string;
}

@Injectable({ providedIn: 'root' })
export class NoteService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/note';
  private readonly wsNamespace = 'http://localhost:3000/whiteboard';

  getAllNoteIds(params?: { start?: number; limit?: number }): Observable<number[]> {
    let httpParams = new HttpParams();
    if (params?.start !== undefined) httpParams = httpParams.set('start', params.start);
    if (params?.limit !== undefined) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<number[]>(`${this.baseUrl}/allIds`, { params: httpParams });
  }

  getNotesInfo(params?: { start?: number; limit?: number }): Observable<NoteInfo[]> {
    let httpParams = new HttpParams();
    if (params?.start !== undefined) httpParams = httpParams.set('start', params.start);
    if (params?.limit !== undefined) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<NoteInfo[]>(`${this.baseUrl}/info`, { params: httpParams });
  }

  getNoteLines(noteId: number, options?: { start?: number; limit?: number }): Observable<NoteLine[]> {
    let httpParams = new HttpParams();
    if (options?.start !== undefined) httpParams = httpParams.set('start', options.start);
    if (options?.limit !== undefined) httpParams = httpParams.set('limit', options.limit);
    return this.http.get<NoteLine[]>(`${this.baseUrl}/${noteId}/lines`, { params: httpParams });
  }

  createNote(dto: CreateNoteDto): Observable<NoteInfo> {
    return this.http.post<NoteInfo>(this.baseUrl, dto);
  }

  createLines(noteId: number, count = 10): Observable<NoteLine[]> {
    // backend creates 10 by default; count is kept for clarity
    return this.http.post<NoteLine[]>(`${this.baseUrl}/${noteId}/create-lines`, {});
  }

  /**
   * Socket.io connector for the whiteboard namespace.
   * Server expects auth.token (Bearer ...) and query.noteId.
   */
  connectWhiteboard(options: { noteId: number; token: string }): Socket {
    const { noteId, token } = options;
    return io(this.wsNamespace, {
      auth: { token: `Bearer ${token}` },
      query: { noteId },
      transports: ['websocket']
    });
  }
}

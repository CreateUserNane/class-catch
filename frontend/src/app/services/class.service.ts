import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClassJoinRequest, SchoolClass } from '../models/class';
import { Lesson } from '../models/lesson';
import { LessonFile } from '../models/lesson-file';
import { AiSummary } from '../models/ai-summary';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class ClassService {
  private readonly apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private readonly http: HttpClient) {}

  getClasses(): Observable<SchoolClass[]> {
    return this.http.get<SchoolClass[]>(`${this.apiUrl}/classes`, {
      headers: this.authHeaders(),
    });
  }

  getClass(classId: number): Observable<SchoolClass> {
    return this.http.get<SchoolClass>(`${this.apiUrl}/classes/${classId}`, {
      headers: this.authHeaders(),
    });
  }

  getJoinedClasses(): Observable<SchoolClass[]> {
    return this.http.get<SchoolClass[]>(`${this.apiUrl}/classes/joined`, {
      headers: this.authHeaders(),
    });
  }

  getClassMembers(classId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/classes/${classId}/students`, {
      headers: this.authHeaders(),
    });
  }

  assignRepresentative(classId: number, studentId: number): Observable<SchoolClass> {
    return this.http.put<SchoolClass>(
      `${this.apiUrl}/classes/${classId}/representative`,
      { student_id: studentId },
      { headers: this.authHeaders() },
    );
  }

  createClass(payload: { name: string; description?: string }): Observable<SchoolClass> {
    return this.http.post<SchoolClass>(`${this.apiUrl}/classes`, payload, {
      headers: this.authHeaders(),
    });
  }

  joinClass(code: string): Observable<{ message: string; status: 'pending' }> {
    return this.http.post<{ message: string; status: 'pending' }>(
      `${this.apiUrl}/classes/join`,
      { code },
      { headers: this.authHeaders() },
    );
  }

  getJoinRequests(classId: number): Observable<ClassJoinRequest[]> {
    return this.http.get<ClassJoinRequest[]>(`${this.apiUrl}/classes/${classId}/join-requests`, {
      headers: this.authHeaders(),
    });
  }

  approveJoinRequest(classId: number, membershipId: number): Observable<ClassJoinRequest> {
    return this.http.post<ClassJoinRequest>(
      `${this.apiUrl}/classes/${classId}/join-requests/${membershipId}/approve`,
      {},
      { headers: this.authHeaders() },
    );
  }

  rejectJoinRequest(classId: number, membershipId: number): Observable<ClassJoinRequest> {
    return this.http.post<ClassJoinRequest>(
      `${this.apiUrl}/classes/${classId}/join-requests/${membershipId}/reject`,
      {},
      { headers: this.authHeaders() },
    );
  }

  getLessons(classId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/classes/${classId}/lessons`, {
      headers: this.authHeaders(),
    });
  }

  createLesson(classId: number, payload: { title: string; description?: string }): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.apiUrl}/classes/${classId}/lessons`, payload, {
      headers: this.authHeaders(),
    });
  }

  updateLesson(lessonId: number, payload: { title: string; description?: string }): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.apiUrl}/lessons/${lessonId}`, payload, {
      headers: this.authHeaders(),
    });
  }

  deleteLesson(lessonId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/lessons/${lessonId}`, {
      headers: this.authHeaders(),
    });
  }

  getLesson(lessonId: number): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.apiUrl}/lessons/${lessonId}`, {
      headers: this.authHeaders(),
    });
  }

  getLessonFiles(lessonId: number): Observable<LessonFile[]> {
    return this.http.get<LessonFile[]>(`${this.apiUrl}/lessons/${lessonId}/files`, {
      headers: this.authHeaders(),
    });
  }

  uploadMaterial(lessonId: number, file: File): Observable<LessonFile> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<LessonFile>(`${this.apiUrl}/lessons/${lessonId}/files`, formData, {
      headers: this.authHeaders(),
    });
  }

  uploadPhoto(lessonId: number, file: File): Observable<LessonFile> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<LessonFile>(`${this.apiUrl}/lessons/${lessonId}/photos`, formData, {
      headers: this.authHeaders(),
    });
  }

  deleteFile(lessonFileId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/lesson-files/${lessonFileId}`, {
      headers: this.authHeaders(),
    });
  }

  moderatePhoto(lessonFileId: number, status: 'approved' | 'rejected'): Observable<LessonFile> {
    return this.http.patch<LessonFile>(
      `${this.apiUrl}/lesson-files/${lessonFileId}/moderation`,
      { status },
      { headers: this.authHeaders() },
    );
  }

  getSummary(lessonId: number): Observable<AiSummary> {
    return this.http.get<AiSummary>(`${this.apiUrl}/lessons/${lessonId}/summary`, {
      headers: this.authHeaders(),
    });
  }

  generateSummary(lessonId: number): Observable<AiSummary> {
    return this.http.post<AiSummary>(`${this.apiUrl}/lessons/${lessonId}/summary`, {}, {
      headers: this.authHeaders(),
    });
  }

  getExplanation(lessonFileId: number): Observable<AiSummary> {
    return this.http.get<AiSummary>(`${this.apiUrl}/lesson-files/${lessonFileId}/explanation`, {
      headers: this.authHeaders(),
    });
  }

  generateExplanation(lessonFileId: number): Observable<AiSummary> {
    return this.http.post<AiSummary>(`${this.apiUrl}/lesson-files/${lessonFileId}/explanation`, {}, {
      headers: this.authHeaders(),
    });
  }

  private authHeaders(): Record<string, string> {
    const token = localStorage.getItem('classcatch_token');

    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

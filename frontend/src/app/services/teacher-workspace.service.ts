import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ClassJoinRequest, SchoolClass } from '../models/class';
import { Lesson } from '../models/lesson';
import { ClassService } from './class.service';

export interface TeacherLessonEntry {
  lesson: Lesson;
  schoolClass: SchoolClass;
}

export interface TeacherJoinRequestEntry {
  request: ClassJoinRequest;
  schoolClass: SchoolClass;
}

export interface TeacherWorkspaceData {
  classes: SchoolClass[];
  lessons: TeacherLessonEntry[];
  joinRequests: TeacherJoinRequestEntry[];
}

@Injectable({ providedIn: 'root' })
export class TeacherWorkspaceService {
  private readonly classService = inject(ClassService);

  load(): Observable<TeacherWorkspaceData> {
    return this.classService.getClasses().pipe(
      switchMap((classes) => {
        if (classes.length === 0) return of({ classes, lessons: [], joinRequests: [] });
        return forkJoin(classes.map((schoolClass) => forkJoin({
          lessons: this.classService.getLessons(schoolClass.id).pipe(
            map((lessons) => lessons.map((lesson) => ({ lesson, schoolClass }))),
            catchError(() => of([] as TeacherLessonEntry[])),
          ),
          requests: this.classService.getJoinRequests(schoolClass.id).pipe(
            map((requests) => requests.map((request) => ({ request, schoolClass }))),
            catchError(() => of([] as TeacherJoinRequestEntry[])),
          ),
        }))).pipe(
          map((groups) => ({
            classes,
            lessons: groups.flatMap((group) => group.lessons),
            joinRequests: groups.flatMap((group) => group.requests),
          })),
          switchMap((workspace) => {
            if (workspace.lessons.length === 0) return of(workspace);
            return forkJoin(workspace.lessons.map((entry) =>
              this.classService.getLesson(entry.lesson.id).pipe(
                map((lesson) => ({ ...entry, lesson })),
                catchError(() => of(entry)),
              ),
            )).pipe(map((lessons) => ({ ...workspace, lessons })));
          }),
        );
      }),
    );
  }
}

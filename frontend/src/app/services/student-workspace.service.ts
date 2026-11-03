import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SchoolClass } from '../models/class';
import { Lesson } from '../models/lesson';
import { ClassService } from './class.service';

export interface StudentLessonEntry {
  lesson: Lesson;
  schoolClass: SchoolClass;
}

export interface StudentWorkspaceData {
  classes: SchoolClass[];
  lessons: StudentLessonEntry[];
}

@Injectable({ providedIn: 'root' })
export class StudentWorkspaceService {
  private readonly classService = inject(ClassService);

  load(): Observable<StudentWorkspaceData> {
    return this.loadWorkspace();
  }

  private loadWorkspace(): Observable<StudentWorkspaceData> {
    return this.classService.getJoinedClasses().pipe(
      switchMap((classes) => {
        const approvedClasses = classes.filter((schoolClass) => schoolClass.membership_status === 'approved');
        if (approvedClasses.length === 0) {
          return of({ classes, lessons: [] as StudentLessonEntry[] });
        }

        return forkJoin(approvedClasses.map((schoolClass) =>
          this.classService.getLessons(schoolClass.id).pipe(
            map((lessons) => lessons.map((lesson) => ({ lesson, schoolClass }))),
            catchError(() => of([] as StudentLessonEntry[])),
          ),
        )).pipe(
          map((groups) => groups.flat()),
          switchMap((entries) => {
            if (entries.length === 0) return of({ classes, lessons: [] as StudentLessonEntry[] });
            return forkJoin(entries.map((entry) =>
              this.classService.getLesson(entry.lesson.id).pipe(
                map((lesson) => ({ ...entry, lesson })),
                catchError(() => of(entry)),
              ),
            )).pipe(map((lessons) => ({ classes, lessons })));
          }),
        );
      }),
    );
  }
}

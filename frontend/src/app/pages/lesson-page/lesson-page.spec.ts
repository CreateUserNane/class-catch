import { EnvironmentInjector, WritableSignal, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { NEVER } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { ClassService } from '../../services/class.service';
import { RecentLessonsService } from '../../services/recent-lessons.service';
import { RealtimeService } from '../../services/realtime.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Lesson } from '../../models/lesson';
import { LessonPage } from './lesson-page';

interface LessonPageUploadHarness {
  lesson: WritableSignal<Lesson | null>;
  uploadPowerPoint(event: Event): void;
  confirmPowerPointUpload(): void;
  cancelPowerPointUpload(): void;
}

describe('LessonPage PowerPoint upload confirmation', () => {
  let page: LessonPageUploadHarness;
  let uploadMaterialWithProgress: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    uploadMaterialWithProgress = vi.fn(() => NEVER);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: NEVER } },
        { provide: AuthService, useValue: { user: signal(null) } },
        { provide: ClassService, useValue: { uploadMaterialWithProgress } },
        { provide: RecentLessonsService, useValue: { record: vi.fn() } },
        { provide: RealtimeService, useValue: { watchClass: vi.fn(() => NEVER) } },
        { provide: ToastService, useValue: { show: vi.fn() } },
      ],
    });

    const injector = TestBed.inject(EnvironmentInjector);
    page = runInInjectionContext(injector, () => new LessonPage()) as unknown as LessonPageUploadHarness;
    page.lesson.set({
      id: 17,
      class_id: 4,
      teacher_id: 2,
      title: 'Fractions',
      description: null,
      created_at: '',
      updated_at: '',
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('waits for teacher confirmation before uploading the selected PowerPoint', () => {
    const file = new File(['slides'], 'fractions.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });

    page.uploadPowerPoint(createFileSelectionEvent(file));

    expect(uploadMaterialWithProgress).not.toHaveBeenCalled();

    page.confirmPowerPointUpload();

    expect(uploadMaterialWithProgress).toHaveBeenCalledOnce();
    expect(uploadMaterialWithProgress).toHaveBeenCalledWith(17, file);
  });

  it('does not upload when the teacher cancels the confirmation', () => {
    const file = new File(['slides'], 'fractions.ppt', { type: 'application/vnd.ms-powerpoint' });

    page.uploadPowerPoint(createFileSelectionEvent(file));
    page.cancelPowerPointUpload();
    page.confirmPowerPointUpload();

    expect(uploadMaterialWithProgress).not.toHaveBeenCalled();
  });
});

function createFileSelectionEvent(file: File): Event {
  return {
    target: {
      files: [file],
      value: 'C:\\fakepath\\presentation.pptx',
    },
  } as unknown as Event;
}

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FileSizePipe } from '../pipes/file-size';
import { ClassService } from '../../services/class.service';
import { LessonFile } from '../../models/lesson-file';
import { ToastService } from '../toast/toast.service';

export interface PhotoLessonOption {
  id: number;
  title: string;
}

@Component({
  selector: 'app-upload-photo-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, FileSizePipe],
  templateUrl: './upload-photo-modal.html',
  styleUrl: './upload-photo-modal.css',
})
export class UploadPhotoModal {
  private readonly classService = inject(ClassService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly open = input<boolean>(false);
  readonly lessons = input<PhotoLessonOption[]>([]);
  readonly defaultLessonId = input<number | null>(null);

  readonly dismissed = output<void>();
  readonly uploaded = output<LessonFile>();

  protected readonly lessonId = signal<number | null>(null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly uploading = signal(false);
  protected readonly error = signal('');

  private readonly maxBytes = 5 * 1024 * 1024;

  constructor() {
    effect(() => {
      if (this.open()) {
        this.reset();
        this.lessonId.set(this.defaultLessonId() ?? null);
      }
    });

    this.destroyRef.onDestroy(() => this.revokePreview());
  }

  protected lessonTitle(): string {
    const current = this.lessonId();
    return this.lessons().find((lesson) => lesson.id === current)?.title ?? 'Select a lesson';
  }

  private reset(): void {
    this.selectedFile.set(null);
    this.revokePreview();
    this.error.set('');
    this.uploading.set(false);
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.previewUrl.set(null);
    }
  }

  protected onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.acceptFile(input.files?.[0] ?? null);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.acceptFile(event.dataTransfer?.files?.[0] ?? null);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private acceptFile(file: File | null): void {
    if (!file) {
      return;
    }

    const type = file.type.toLowerCase();
    const allowed = /^(image\/jpeg|image\/jpg|image\/png|image\/webp|image\/gif)$/;

    if (!allowed.test(type)) {
      this.error.set('Only JPG, JPEG, PNG, WEBP and GIF photos are allowed.');
      return;
    }

    if (file.size > this.maxBytes) {
      this.error.set('Photo is too large (maximum 5 MB).');
      return;
    }

    this.error.set('');
    this.selectedFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  protected removeFile(): void {
    this.selectedFile.set(null);
    this.revokePreview();
  }

  protected upload(): void {
    const lesson = this.lessonId();
    const file = this.selectedFile();

    if (!lesson || !file) {
      return;
    }

    this.uploading.set(true);
    this.error.set('');

    this.classService.uploadPhoto(lesson, file).subscribe({
      next: (uploaded) => {
        this.uploading.set(false);
        this.revokePreview();
        this.toast.show('Classroom photo uploaded — AI will process it shortly.');
        this.uploaded.emit(uploaded);
        this.dismissed.emit();
      },
      error: (err) => {
        this.uploading.set(false);
        this.error.set(err?.error?.message || 'Could not upload the photo.');
      },
    });
  }

  protected close(): void {
    this.revokePreview();
    this.dismissed.emit();
  }
}

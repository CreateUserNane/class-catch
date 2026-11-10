import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
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
  protected readonly confirmationOpen = signal(false);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly uploading = signal(false);
  protected readonly uploadProgress = signal(0);
  protected readonly error = signal('');

  private readonly maxBytes = 5 * 1024 * 1024;

  constructor() {
    effect(() => {
      if (this.open()) {
        const defaultLessonId = this.defaultLessonId();
        untracked(() => this.reset());
        this.lessonId.set(defaultLessonId ?? null);
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
    this.confirmationOpen.set(false);
    this.revokePreview();
    this.error.set('');
    this.uploading.set(false);
    this.uploadProgress.set(0);
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
    const file = input.files?.[0] ?? null;
    input.value = '';
    this.acceptFile(file);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.acceptFile(event.dataTransfer?.files?.[0] ?? null);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private async acceptFile(file: File | null): Promise<void> {
    if (!file || this.uploading()) {
      return;
    }

    this.selectedFile.set(null);
    this.revokePreview();
    this.error.set('');

    const type = file.type.toLowerCase();
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/webp', 'image/gif']);
    const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);

    if (file.size > this.maxBytes) {
      this.error.set('Photo is too large (maximum 5 MB).');
      return;
    }

    if (!allowedTypes.has(type) && !allowedExtensions.has(extension) && !(await this.hasSupportedImageSignature(file))) {
      this.error.set('Only JPG, JPEG, PNG, WEBP and GIF photos are allowed.');
      return;
    }

    this.selectedFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
    this.confirmationOpen.set(true);
  }

  private async hasSupportedImageSignature(file: File): Promise<boolean> {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const startsWith = (...signature: number[]): boolean => signature.every((byte, index) => bytes[index] === byte);
    const isJpeg = startsWith(0xff, 0xd8, 0xff);
    const isPng = startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    const isGif = startsWith(0x47, 0x49, 0x46, 0x38);
    const isWebp = startsWith(0x52, 0x49, 0x46, 0x46) &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

    return isJpeg || isPng || isGif || isWebp;
  }

  protected removeFile(): void {
    this.selectedFile.set(null);
    this.confirmationOpen.set(false);
    this.revokePreview();
  }

  protected cancelConfirmation(): void {
    this.confirmationOpen.set(false);
  }

  protected confirmUpload(): void {
    this.confirmationOpen.set(false);
    this.upload();
  }

  protected chooseOrReviewPhoto(fileInput: HTMLInputElement): void {
    if (this.selectedFile()) {
      this.confirmationOpen.set(true);
      return;
    }

    fileInput.click();
  }

  protected upload(): void {
    const lesson = this.lessonId();
    const file = this.selectedFile();

    if (!lesson || !file) {
      return;
    }

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.error.set('');

    this.classService.uploadPhotoWithProgress(lesson, file).pipe(
      finalize(() => this.uploading.set(false)),
    ).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((event.loaded / event.total) * 100));
        } else if (event.type === HttpEventType.Response && event.body) {
          this.uploadProgress.set(100);
          this.revokePreview();
          this.toast.show(event.body.status === 'pending'
            ? 'Photo uploaded. It will be published after teacher approval.'
            : 'Photo uploaded and published to the class.');
          this.uploaded.emit(event.body);
          this.dismissed.emit();
        }
      },
      error: (err) => {
        this.uploading.set(false);
        this.error.set(err?.error?.message || 'Could not upload the photo.');
      },
    });
  }

  protected close(): void {
    if (this.uploading()) return;
    this.revokePreview();
    this.dismissed.emit();
  }
}

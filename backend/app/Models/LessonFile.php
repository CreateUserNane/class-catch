<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable(['lesson_id', 'uploaded_by', 'type', 'original_name', 'path', 'mime_type', 'size', 'status'])]
class LessonFile extends Model
{
    use HasFactory;

    protected $table = 'lesson_files';

    protected $appends = ['url'];

    protected $hidden = ['path'];

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class, 'lesson_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /** URL to view/download the stored file. */
    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->path);
    }
}

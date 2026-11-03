<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['lesson_id', 'lesson_file_id', 'type', 'content'])]
class AiSummary extends Model
{
    use HasFactory;

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class, 'lesson_id');
    }

    public function lessonFile(): BelongsTo
    {
        return $this->belongsTo(LessonFile::class, 'lesson_file_id');
    }
}

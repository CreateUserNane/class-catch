<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['class_id', 'teacher_id', 'title', 'description'])]
class Lesson extends Model
{
    use HasFactory;

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function files(): HasMany
    {
        return $this->hasMany(LessonFile::class, 'lesson_id');
    }

    public function summary(): HasOne
    {
        return $this->hasOne(AiSummary::class, 'lesson_id')
            ->where('type', 'summary')
            ->orderByDesc('ai_summaries.id');
    }

    public function explanations(): HasMany
    {
        return $this->hasMany(AiSummary::class, 'lesson_id')->where('type', 'explanation');
    }
}

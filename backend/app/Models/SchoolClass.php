<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['teacher_id', 'name', 'description', 'code', 'representative_id'])]
class SchoolClass extends Model
{
    use HasFactory;

    protected $table = 'classes';

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function representative(): BelongsTo
    {
        return $this->belongsTo(User::class, 'representative_id');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class, 'class_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(ClassMembership::class, 'class_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(ClassMembership::class, 'class_id');
    }
}

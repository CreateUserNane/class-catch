<?php

use App\Models\ClassMembership;
use App\Models\SchoolClass;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('class.{classId}', function ($user, int $classId): bool {
    $schoolClass = SchoolClass::find($classId);

    if (! $schoolClass) {
        return false;
    }

    if ($user->role === 'teacher') {
        return $schoolClass->teacher_id === $user->id;
    }

    return $user->role === 'student' && ClassMembership::where('class_id', $schoolClass->id)
        ->where('student_id', $user->id)
        ->whereIn('status', ['pending', 'approved'])
        ->exists();
});

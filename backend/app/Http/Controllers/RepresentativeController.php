<?php

namespace App\Http\Controllers;

use App\Events\ClassUpdated;
use App\Models\ClassMembership;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\Request;

class RepresentativeController extends Controller
{
    public function assign(Request $request, SchoolClass $schoolClass)
    {
        $user = $request->user();

        if ($user->role !== 'teacher' || $schoolClass->teacher_id !== $user->id) {
            abort(403, 'Only the class teacher can assign a representative.');
        }

        $validated = $request->validate([
            'student_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $student = User::findOrFail($validated['student_id']);

        $isMember = ClassMembership::where('class_id', $schoolClass->id)
            ->where('student_id', $student->id)
            ->where('status', 'approved')
            ->exists();

        if (! $isMember) {
            return response()->json([
                'message' => 'The selected student must be a member of this class.',
                'errors' => ['student_id' => ['The selected student must be a member of this class.']],
            ], 422);
        }

        $schoolClass->update(['representative_id' => $student->id]);

        ClassUpdated::dispatch($schoolClass->id, 'representative.changed');

        return response()->json($schoolClass->load('teacher', 'representative'));
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\ClassMembership;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\Request;

class ClassMembershipController extends Controller
{
    public function join(Request $request)
    {
        $user = $request->user();
        $this->ensureStudent($user);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:32'],
        ]);

        $code = strtoupper(trim($validated['code']));
        $schoolClass = SchoolClass::where('code', $code)->first();

        if (! $schoolClass) {
            return response()->json([
                'message' => 'The class code is invalid.',
                'errors' => ['code' => ['The class code is invalid.']],
            ], 422);
        }

        $alreadyJoined = ClassMembership::where('class_id', $schoolClass->id)
            ->where('student_id', $user->id)
            ->exists();

        if ($alreadyJoined) {
            return response()->json([
                'message' => 'You have already joined this class.',
                'errors' => ['code' => ['You have already joined this class.']],
            ], 422);
        }

        ClassMembership::create([
            'class_id' => $schoolClass->id,
            'student_id' => $user->id,
        ]);

        return response()->json($schoolClass->load('teacher'), 201);
    }

    public function joined(Request $request)
    {
        $user = $request->user();
        $this->ensureStudent($user);

        $classes = $user->classMemberships()
            ->with(['schoolClass.teacher', 'schoolClass.representative'])
            ->get()
            ->map(fn (ClassMembership $membership) => $membership->schoolClass)
            ->filter();

        return response()->json($classes->values());
    }

    public function members(Request $request, SchoolClass $schoolClass)
    {
        $user = $request->user();

        $isTeacher = $user->role === 'teacher' && $schoolClass->teacher_id === $user->id;
        $isMember = $user->role === 'student' && ClassMembership::where('class_id', $schoolClass->id)
            ->where('student_id', $user->id)
            ->exists();

        if (! $isTeacher && ! $isMember) {
            abort(403, 'You cannot view the members of this class.');
        }

        $members = ClassMembership::where('class_id', $schoolClass->id)
            ->with('student')
            ->get()
            ->pluck('student');

        return response()->json($members->values());
    }

    private function ensureStudent(User $user): void
    {
        if ($user->role !== 'student') {
            abort(403, 'Only students can join classes.');
        }
    }
}

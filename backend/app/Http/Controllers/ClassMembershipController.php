<?php

namespace App\Http\Controllers;

use App\Events\ClassUpdated;
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

        $membership = ClassMembership::where('class_id', $schoolClass->id)
            ->where('student_id', $user->id)
            ->first();

        if ($membership?->status === 'approved') {
            return response()->json([
                'message' => 'You have already joined this class.',
                'errors' => ['code' => ['You have already joined this class.']],
            ], 422);
        }

        if ($membership) {
            if ($membership->status === 'rejected') {
                $membership->update(['status' => 'pending']);

                ClassUpdated::dispatch($schoolClass->id, 'join-request.created');

                return response()->json([
                    'message' => 'Your new request to join this class is pending teacher approval.',
                    'status' => 'pending',
                ], 201);
            }

            return response()->json([
                'message' => 'Your request to join this class is pending approval.',
                'status' => $membership->status,
            ]);
        }

        $membership = ClassMembership::create([
            'class_id' => $schoolClass->id,
            'student_id' => $user->id,
            'status' => 'pending',
        ]);

        ClassUpdated::dispatch($schoolClass->id, 'join-request.created');

        return response()->json([
            'message' => 'Your request to join this class is pending approval.',
            'status' => $membership->status,
        ], 201);
    }

    public function joined(Request $request)
    {
        $user = $request->user();
        $this->ensureStudent($user);

        $classes = $user->classMemberships()
            ->with(['schoolClass.teacher', 'schoolClass.representative'])
            ->get()
            ->map(function (ClassMembership $membership) {
                $schoolClass = $membership->schoolClass;

                if ($schoolClass) {
                    $schoolClass->setAttribute('membership_status', $membership->status);
                }

                return $schoolClass;
            })
            ->filter();

        return response()->json($classes->values());
    }

    public function joinRequests(Request $request, SchoolClass $schoolClass)
    {
        $this->ensureClassTeacher($request->user(), $schoolClass);

        return response()->json(
            ClassMembership::where('class_id', $schoolClass->id)
                ->where('status', 'pending')
                ->with('student')
                ->oldest()
                ->get(),
        );
    }

    public function approve(Request $request, SchoolClass $schoolClass, int $membership)
    {
        $this->ensureClassTeacher($request->user(), $schoolClass);

        $joinRequest = ClassMembership::where('class_id', $schoolClass->id)
            ->whereKey($membership)
            ->where('status', 'pending')
            ->firstOrFail();

        $joinRequest->update(['status' => 'approved']);

        ClassUpdated::dispatch($schoolClass->id, 'membership.approved');

        return response()->json($joinRequest->load('student'));
    }

    public function reject(Request $request, SchoolClass $schoolClass, int $membership)
    {
        $this->ensureClassTeacher($request->user(), $schoolClass);

        $joinRequest = ClassMembership::where('class_id', $schoolClass->id)
            ->whereKey($membership)
            ->where('status', 'pending')
            ->firstOrFail();

        $joinRequest->update(['status' => 'rejected']);

        ClassUpdated::dispatch($schoolClass->id, 'join-request.rejected');

        return response()->json($joinRequest->load('student'));
    }

    public function members(Request $request, SchoolClass $schoolClass)
    {
        $user = $request->user();

        $isTeacher = $user->role === 'teacher' && $schoolClass->teacher_id === $user->id;
        $isMember = $user->role === 'student' && ClassMembership::where('class_id', $schoolClass->id)
            ->where('student_id', $user->id)
            ->where('status', 'approved')
            ->exists();

        if (! $isTeacher && ! $isMember) {
            abort(403, 'You cannot view the members of this class.');
        }

        $members = ClassMembership::where('class_id', $schoolClass->id)
            ->where('status', 'approved')
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

    private function ensureClassTeacher(User $user, SchoolClass $schoolClass): void
    {
        if ($user->role !== 'teacher' || $schoolClass->teacher_id !== $user->id) {
            abort(403, 'Only the class teacher can manage join requests.');
        }
    }
}

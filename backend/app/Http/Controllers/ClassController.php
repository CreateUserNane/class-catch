<?php

namespace App\Http\Controllers;

use App\Models\ClassMembership;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $this->ensureTeacher($user);

        return response()->json($user->classes()
            ->with(['teacher', 'representative'])
            ->withCount(['memberships as students_count' => fn ($query) => $query->where('status', 'approved')])
            ->withCount(['memberships as pending_requests_count' => fn ($query) => $query->where('status', 'pending')])
            ->latest()
            ->get());
    }

    public function show(Request $request, SchoolClass $schoolClass)
    {
        $user = $request->user();

        if ($user->role === 'teacher' && $schoolClass->teacher_id !== $user->id) {
            abort(403, 'Only the class teacher can view this class.');
        }

        if ($user->role === 'student' &&
            ! ClassMembership::where('class_id', $schoolClass->id)
                ->where('student_id', $user->id)
                ->where('status', 'approved')
                ->exists()) {
            abort(403, 'You must be a member of this class.');
        }

        $schoolClass->load([
            'teacher',
            'representative',
            'members' => fn ($query) => $query->where('status', 'approved')->with('student'),
        ]);

        return response()->json($schoolClass);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $this->ensureTeacher($user);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $class = SchoolClass::create([
            'teacher_id' => $user->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'code' => $this->generateUniqueCode(),
            'representative_id' => null,
        ]);

        return response()->json($class, 201);
    }

    private function ensureTeacher(User $user): void
    {
        if ($user->role !== 'teacher') {
            abort(403, 'Only teachers can create classes.');
        }
    }

    private function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (SchoolClass::where('code', $code)->exists());

        return $code;
    }
}

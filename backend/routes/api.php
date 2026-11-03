<?php

use App\Http\Controllers\AiExplanationController;
use App\Http\Controllers\AiSummaryController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\ClassMembershipController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\LessonFileController;
use App\Http\Controllers\RepresentativeController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/classes', [ClassController::class, 'index']);
    Route::post('/classes', [ClassController::class, 'store']);

    Route::post('/classes/join', [ClassMembershipController::class, 'join']);
    Route::get('/classes/joined', [ClassMembershipController::class, 'joined']);
    Route::get('/classes/{schoolClass}', [ClassController::class, 'show']);

    Route::get('/classes/{schoolClass}/students', [ClassMembershipController::class, 'members']);

    Route::put('/classes/{schoolClass}/representative', [RepresentativeController::class, 'assign']);

    Route::get('/classes/{schoolClass}/lessons', [LessonController::class, 'index']);
    Route::post('/classes/{schoolClass}/lessons', [LessonController::class, 'store']);
    Route::get('/lessons/{lesson}', [LessonController::class, 'show']);
    Route::put('/lessons/{lesson}', [LessonController::class, 'update']);
    Route::delete('/lessons/{lesson}', [LessonController::class, 'destroy']);

    Route::get('/lessons/{lesson}/files', [LessonFileController::class, 'index']);
    Route::post('/lessons/{lesson}/files', [LessonFileController::class, 'uploadMaterial']);
    Route::post('/lessons/{lesson}/photos', [LessonFileController::class, 'uploadPhoto']);
    Route::delete('/lesson-files/{lessonFile}', [LessonFileController::class, 'destroy']);

    Route::post('/lessons/{lesson}/summary', [AiSummaryController::class, 'generate']);
    Route::get('/lessons/{lesson}/summary', [AiSummaryController::class, 'index']);

    Route::post('/lesson-files/{lessonFile}/explanation', [AiExplanationController::class, 'generate']);
    Route::get('/lesson-files/{lessonFile}/explanation', [AiExplanationController::class, 'index']);
});

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lesson_files', function (Blueprint $table) {
            // Previously uploaded files stay visible; new representative photos are pending.
            $table->string('status')->default('approved')->index();
        });
    }

    public function down(): void
    {
        Schema::table('lesson_files', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};

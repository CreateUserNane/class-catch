<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('class_memberships', function (Blueprint $table) {
            // Existing memberships remain active; new requests are created as pending.
            $table->string('status')->default('approved')->index();
        });
    }

    public function down(): void
    {
        Schema::table('class_memberships', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_follow_ups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('incident_reports');
            $table->foreignId('reporter_id')->constrained('users');
            $table->text('description')->nullable();
            $table->unsignedInteger('version');
            $table->timestampTz('created_at');
            $table->unique(['report_id', 'version']);
        });
        Schema::table('report_evidence', function (Blueprint $table) {
            $table->foreignId('follow_up_id')->nullable()->constrained('report_follow_ups');
        });
    }

    public function down(): void
    {
        Schema::table('report_evidence', function (Blueprint $table) {
            $table->dropConstrainedForeignId('follow_up_id');
        });
        Schema::dropIfExists('report_follow_ups');
    }
};

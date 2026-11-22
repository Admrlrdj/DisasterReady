<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_analysis_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('incident_reports');
            $table->string('model_identifier');
            $table->string('prompt_version');
            $table->string('input_hash', 64);
            $table->string('status');
            $table->json('output_json')->nullable();
            $table->string('error_code')->nullable();
            $table->unsignedInteger('latency_ms')->nullable();
            $table->unsignedInteger('token_usage')->default(0);
            $table->decimal('estimated_cost', 12, 6)->default(0);
            $table->timestampTz('started_at');
            $table->timestampTz('completed_at')->nullable();
            $table->unique(['report_id', 'input_hash', 'model_identifier', 'prompt_version'], 'ai_run_identity');
        });
        Schema::create('ai_analysis_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('analysis_run_id')->constrained('ai_analysis_runs');
            $table->string('status');
            $table->string('error_code')->nullable();
            $table->timestampTz('started_at');
            $table->timestampTz('completed_at')->nullable();
        });
        Schema::create('ai_report_suggestions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('analysis_run_id')->constrained('ai_analysis_runs');
            $table->string('field_name');
            $table->json('suggested_value_json')->nullable();
            $table->text('evidence_span')->nullable();
            $table->string('review_status')->default('UNREVIEWED');
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestampTz('reviewed_at')->nullable();
            $table->unique(['analysis_run_id', 'field_name']);
        });
        Schema::create('ai_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('suggestion_id')->constrained('ai_report_suggestions');
            $table->foreignId('reviewer_id')->constrained('users');
            $table->string('decision');
            $table->json('corrected_json')->nullable();
            $table->text('reason');
            $table->timestampTz('created_at');
        });
        Schema::create('report_duplicate_candidates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('incident_reports');
            $table->foreignId('candidate_report_id')->constrained('incident_reports');
            $table->string('method_version');
            $table->double('geo_distance_m');
            $table->double('time_delta_minutes');
            $table->double('text_score')->nullable();
            $table->string('reviewer_decision')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users');
            $table->timestampTz('reviewed_at')->nullable();
            $table->unique(['report_id', 'candidate_report_id']);
        });
        Schema::create('operational_settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->boolean('enabled');
        });
    }

    public function down(): void
    {
        foreach (['operational_settings', 'report_duplicate_candidates', 'ai_feedback', 'ai_report_suggestions', 'ai_analysis_attempts', 'ai_analysis_runs'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('reporter');
            $table->string('status')->default('active');
        });
        Schema::create('incident_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->restrictOnDelete();
            $table->string('category')->nullable();
            $table->text('description');
            $table->timestampTz('observed_at')->index();
            $table->decimal('latitude', 9, 6);
            $table->decimal('longitude', 10, 6);
            $table->string('status')->default('PENDING')->index();
            $table->unsignedInteger('version')->default(1);
            $table->string('analysis_status')->default('QUEUED')->index();
            $table->string('duplicate_status')->default('QUEUED')->index();
            $table->timestampTz('privacy_consented_at');
            $table->timestampTz('photo_consented_at')->nullable();
            $table->timestampsTz();
        });
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS postgis');
            DB::statement('ALTER TABLE incident_reports ADD COLUMN geom geography(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision),4326)::geography) STORED');
            DB::statement('CREATE INDEX incident_reports_geom_gist ON incident_reports USING GIST (geom)');
        }
        Schema::create('report_evidence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('incident_reports')->cascadeOnDelete();
            $table->string('disk');
            $table->string('storage_key');
            $table->string('sha256', 64);
            $table->timestampsTz();
        });
        Schema::create('report_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('incident_reports');
            $table->foreignId('reviewer_id')->constrained('users');
            $table->string('decision');
            $table->text('reason');
            $table->unsignedInteger('version');
            $table->timestampsTz();
            $table->unique(['report_id', 'version']);
        });
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users');
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id');
            $table->string('action');
            $table->json('before_json')->nullable();
            $table->json('after_json');
            $table->timestampTz('created_at');
            $table->index(['entity_type', 'entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('report_reviews');
        Schema::dropIfExists('report_evidence');
        Schema::dropIfExists('incident_reports');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['role', 'status']));
    }
};

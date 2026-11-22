<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sources', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('agency');
            $table->string('name');
            $table->string('endpoint');
            $table->text('attribution');
            $table->text('license')->nullable();
            $table->unsignedInteger('freshness_sla')->default(3600);
            $table->boolean('enabled')->default(false);
            $table->timestampTz('last_success_at')->nullable();
            $table->string('sync_status')->default('UNAVAILABLE');
            $table->timestampsTz();
        });
        Schema::create('hazard_types', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('label');
        });
        foreach (['flood' => 'Banjir', 'earthquake' => 'Gempa', 'tsunami' => 'Tsunami', 'volcano' => 'Gunung api', 'landslide' => 'Longsor', 'extreme_weather' => 'Cuaca ekstrem', 'other' => 'Lainnya'] as $slug => $label) {
            DB::table('hazard_types')->insert(['slug' => $slug, 'label' => $label]);
        }
        foreach (['disaster_events', 'official_alerts', 'forecasts'] as $name) {
            Schema::create($name, function (Blueprint $table) use ($name) {
                $table->id();
                $table->foreignId('source_id')->constrained('sources');
                $table->foreignId('hazard_type_id')->nullable()->constrained('hazard_types');
                $table->string('external_id');
                $table->string('title');
                $table->text('message')->nullable();
                $table->string('source_url');
                $table->timestampTz('source_time');
                $table->timestampTz('fetched_at');
                $table->timestampTz('expires_at')->nullable();
                $table->boolean('synthetic')->default(false);
                $table->json('payload_json');
                $table->decimal('latitude', 9, 6)->nullable();
                $table->decimal('longitude', 10, 6)->nullable();
                $table->json('geometry_json')->nullable();
                if ($name === 'official_alerts') {
                    $table->string('message_type')->default('Alert');
                    $table->json('references_json')->nullable();
                    $table->timestampTz('superseded_at')->nullable();
                    $table->timestampTz('effective_at');
                    $table->string('severity');
                    $table->string('certainty');
                }
                if ($name === 'forecasts') {
                    $table->string('region_code')->index();
                    $table->timestampTz('forecast_at')->index();
                }
                $table->unique(['source_id', 'external_id']);
                $table->index('source_time');
            });
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("ALTER TABLE {$name} ADD COLUMN geom geometry(Geometry,4326) GENERATED ALWAYS AS (CASE WHEN geometry_json IS NOT NULL THEN ST_SetSRID(ST_GeomFromGeoJSON(geometry_json::text),4326) WHEN longitude IS NOT NULL AND latitude IS NOT NULL THEN ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision),4326) ELSE NULL END) STORED");
                DB::statement("CREATE INDEX {$name}_geom_gist ON {$name} USING GIST (geom)");
            }
        }
        Schema::create('ingestion_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_id')->constrained('sources');
            $table->string('status');
            $table->unsignedInteger('count')->default(0);
            $table->string('error_code')->nullable();
            $table->timestampTz('started_at');
            $table->timestampTz('finished_at')->nullable();
        });
        Schema::create('hazard_layers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_id')->constrained('sources');
            $table->foreignId('hazard_type_id')->constrained('hazard_types');
            $table->string('name');
            $table->string('layer_url');
            $table->string('temporal_scope')->default('historical_modelled');
            $table->json('legend');
            $table->string('crs');
            $table->text('limitations');
            $table->boolean('publication_approved')->default(false);
            $table->timestampTz('reviewed_at')->nullable();
        });
        Schema::create('preparedness_guides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hazard_type_id')->constrained('hazard_types');
            $table->string('title');
            $table->text('content');
            $table->json('checklist')->nullable();
            $table->json('family_plan')->nullable();
            $table->json('emergency_contacts')->nullable();
            $table->string('official_reference');
            $table->timestampTz('reviewed_at');
            $table->boolean('published')->default(false);
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        foreach (['preparedness_guides', 'hazard_layers', 'ingestion_runs', 'forecasts', 'official_alerts', 'disaster_events', 'hazard_types', 'sources'] as $name) {
            Schema::dropIfExists($name);
        }
    }
};

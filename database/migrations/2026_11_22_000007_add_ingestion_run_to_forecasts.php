<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('forecasts', function (Blueprint $table) {
            $table->foreignId('ingestion_run_id')->nullable()->constrained()->nullOnDelete();
            $table->index(['region_code', 'ingestion_run_id']);
        });
    }

    public function down(): void
    {
        Schema::table('forecasts', function (Blueprint $table) {
            $table->dropIndex(['region_code', 'ingestion_run_id']);
            $table->dropConstrainedForeignId('ingestion_run_id');
        });
    }
};

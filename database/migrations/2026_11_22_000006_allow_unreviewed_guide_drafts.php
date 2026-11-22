<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('preparedness_guides', function (Blueprint $table): void {
            $table->timestampTz('reviewed_at')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('preparedness_guides', function (Blueprint $table): void {
            $table->timestampTz('reviewed_at')->nullable(false)->change();
        });
    }
};

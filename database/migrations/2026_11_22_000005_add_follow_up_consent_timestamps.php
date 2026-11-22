<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_follow_ups', function (Blueprint $table) {
            $table->timestampTz('privacy_consented_at')->nullable();
            $table->timestampTz('photo_consented_at')->nullable();
        });
        // The initial endpoint already required consent; retain its creation time.
        DB::table('report_follow_ups')->update(['privacy_consented_at' => DB::raw('created_at')]);
        DB::table('report_follow_ups')->whereIn('id', DB::table('report_evidence')->whereNotNull('follow_up_id')->select('follow_up_id'))->update(['photo_consented_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        Schema::table('report_follow_ups', fn (Blueprint $table) => $table->dropColumn(['privacy_consented_at', 'photo_consented_at']));
    }
};

<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class Audit
{
    /**
     * @param  array<string, mixed>  $before
     * @param  array<string, mixed>  $after
     */
    public static function record(?int $actor, string $entity, int $id, string $action, array $before, array $after): void
    {
        DB::table('audit_logs')->insert([
            'actor_id' => $actor, 'entity_type' => $entity, 'entity_id' => $id, 'action' => $action,
            'before_json' => json_encode($before, JSON_THROW_ON_ERROR),
            'after_json' => json_encode($after, JSON_THROW_ON_ERROR), 'created_at' => now(),
        ]);
    }
}

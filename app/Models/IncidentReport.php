<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $reporter_id
 * @property string|null $category
 * @property string $description
 * @property Carbon $observed_at
 * @property string $latitude
 * @property string $longitude
 * @property string $status
 * @property int $version
 * @property string $analysis_status
 * @property string $duplicate_status
 */
class IncidentReport extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['latitude', 'longitude', 'geom', 'reporter_id', 'privacy_consented_at', 'photo_consented_at'];

    protected function casts(): array
    {
        return ['observed_at' => 'datetime', 'version' => 'integer', 'latitude' => 'decimal:6', 'longitude' => 'decimal:6'];
    }
}

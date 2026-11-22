<?php

namespace App\Policies;

use App\Models\IncidentReport;
use App\Models\User;

class IncidentReportPolicy
{
    public function view(User $user, IncidentReport $report): bool
    {
        return $user->status === 'active' && ($user->id === $report->reporter_id || $user->can('moderate'));
    }

    public function review(User $user, IncidentReport $report): bool
    {
        return $user->can('moderate') && $user->id !== $report->reporter_id;
    }
}

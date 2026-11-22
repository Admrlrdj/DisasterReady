<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->status === 'active';
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'category' => ['nullable', 'in:flood,earthquake,tsunami,volcano,landslide,extreme_weather,other'],
            'description' => ['required', 'string', 'min:10', 'max:5000'],
            'observed_at' => ['required', 'date', 'regex:/T.*(?:Z|[+-]\d{2}:\d{2})$/', 'before_or_equal:now'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'privacy_consent' => ['required', 'accepted'],
            'photo_consent' => ['exclude_without:photo', 'required_with:photo', 'accepted'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png', 'max:5120', 'dimensions:max_width=6000,max_height=6000'],
        ];
    }
}

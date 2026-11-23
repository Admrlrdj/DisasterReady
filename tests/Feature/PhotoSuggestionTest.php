<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PhotoSuggestionTest extends TestCase
{
    use RefreshDatabase;

    public function test_photo_suggestion_requires_consent_and_does_not_submit_a_report(): void
    {
        config(['disaster.ai_enabled' => true, 'disaster.gemini_key' => 'test-key']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [['content' => ['parts' => [['text' => '{"category":"flood"}']]]]],
        ])]);
        $this->actingAs(User::factory()->create());
        $this->postJson('/reports/photo-suggestion', ['photo' => UploadedFile::fake()->image('photo.png')])
            ->assertUnprocessable()->assertJsonValidationErrors('consent');
        Http::assertNothingSent();

        $this->postJson('/reports/photo-suggestion', ['photo' => UploadedFile::fake()->image('photo.png'), 'consent' => true])
            ->assertOk()->assertExactJson(['category' => 'flood']);
        Http::assertSent(function (Request $request) {
            $part = $request['contents'][0]['parts'][1]['inlineData'];
            $image = getimagesizefromstring(base64_decode($part['data'], true));

            return $request->hasHeader('x-goog-api-key', 'test-key')
                && $image['mime'] === 'image/jpeg';
        });
        $this->assertDatabaseCount('incident_reports', 0);
    }

    public function test_unknown_photo_returns_no_category(): void
    {
        config(['disaster.ai_enabled' => true, 'disaster.gemini_key' => 'test-key']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [['content' => ['parts' => [['text' => '{"category":"unknown"}']]]]],
        ])]);

        $this->actingAs(User::factory()->create())
            ->postJson('/reports/photo-suggestion', ['photo' => UploadedFile::fake()->image('photo.jpg'), 'consent' => '1'])
            ->assertOk()->assertExactJson(['category' => null]);
    }

    public function test_report_can_be_submitted_with_a_photo_instead_of_a_description(): void
    {
        Queue::fake();
        Storage::fake('local');
        $this->actingAs(User::factory()->create());
        $report = [
            'category' => 'flood', 'observed_at' => now()->subMinute()->toIso8601String(),
            'latitude' => -6.22, 'longitude' => 106.87, 'privacy_consent' => true,
        ];
        $this->postJson('/reports', $report)->assertUnprocessable()->assertJsonValidationErrors('description');
        $this->postJson('/reports', $report + ['photo' => UploadedFile::fake()->image('photo.jpg'), 'photo_consent' => true])
            ->assertCreated()->assertJsonPath('data.status', 'PENDING');
        $this->assertDatabaseCount('report_evidence', 1);
    }
}

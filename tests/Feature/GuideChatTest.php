<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class GuideChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_gemini_answers_the_question_with_a_trusted_source(): void
    {
        config(['disaster.ai_enabled' => true, 'disaster.gemini_key' => 'test-key', 'disaster.gemini_model' => 'gemini-3.5-flash-lite']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [['content' => ['parts' => [['text' => json_encode([
                'kind' => 'education', 'answer' => 'Tsunami dapat dipicu oleh pergeseran dasar laut.',
                'source' => 'tsunami', 'href' => 'https://untrusted.example/',
            ])]]]]],
        ])]);

        $previous = ['Apa itu tsunami?'];
        $question = 'Bisa terjadi karena apa?';
        $this->postJson('/data/guide-chat', compact('question', 'previous'))
            ->assertOk()
            ->assertJsonPath('text', 'Tsunami dapat dipicu oleh pergeseran dasar laut.')
            ->assertJsonPath('href', 'https://gaia.bmkg.go.id/edukasi-mkg/mengenal-fenomena-tsunami-dan-langkah-mitigasi-di-indonesia');
        Http::assertSent(function (Request $request) use ($question, $previous) {
            $payload = json_decode($request['contents'][0]['parts'][0]['text'], true);

            return $payload['pertanyaan'] === $question
                && $payload['pertanyaan_sebelumnya'] === $previous
                && $request['generationConfig']['thinkingConfig'] === ['thinkingLevel' => 'minimal'];
        });
    }

    public function test_emergency_routing_uses_fixed_copy_instead_of_the_model_answer(): void
    {
        config(['disaster.ai_enabled' => true, 'disaster.gemini_key' => 'test-key']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [['content' => ['parts' => [['text' => '{"kind":"help","answer":"Raw model text","source":"none"}']]]]],
        ])]);

        $this->postJson('/data/guide-chat', ['question' => 'Rumah saya mulai terendam, tolong'])
            ->assertOk()->assertJsonPath('href', '/bantuan')->assertDontSee('Raw model text');
    }

    public function test_temporary_provider_error_is_retried_once(): void
    {
        config(['disaster.ai_enabled' => true, 'disaster.gemini_key' => 'test-key']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::sequence()
            ->push(['error' => ['status' => 'UNAVAILABLE']], 503)
            ->push(['candidates' => [['content' => ['parts' => [['text' => '{"kind":"education","answer":"SINTETIS jawaban uji.","source":"flood"}']]]]]])]);

        $this->postJson('/data/guide-chat', ['question' => 'Bagaimana cara bersiap menghadapi banjir?'])
            ->assertOk()->assertJsonPath('text', 'SINTETIS jawaban uji.');

        Http::assertSentCount(2);
        $this->assertSame(2, RateLimiter::attempts('guide-chat:'.now('UTC')->toDateString()));
    }

    public function test_connection_failure_retries_until_budget_is_exhausted(): void
    {
        config(['disaster.ai_enabled' => true, 'disaster.gemini_key' => 'test-key', 'disaster.ai_daily_limit' => 1]);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::sequence()->pushFailedConnection()]);

        $this->postJson('/data/guide-chat', ['question' => 'Apa itu banjir?'])->assertTooManyRequests();
        $this->assertSame(1, RateLimiter::attempts('guide-chat:'.now('UTC')->toDateString()));
    }

    public function test_provider_permission_error_is_not_retried(): void
    {
        config(['disaster.ai_enabled' => true, 'disaster.gemini_key' => 'test-key']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response(['error' => ['status' => 'PERMISSION_DENIED']], 403)]);

        $this->postJson('/data/guide-chat', ['question' => 'Apa itu banjir?'])->assertServiceUnavailable();
        Http::assertSentCount(1);
    }
}

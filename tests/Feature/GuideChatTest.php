<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GuideChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_gemini_answers_the_question_with_a_trusted_source(): void
    {
        config(['disaster.ai_enabled' => true, 'disaster.gemini_key' => 'test-key']);
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

            return $payload['pertanyaan'] === $question && $payload['pertanyaan_sebelumnya'] === $previous;
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
}

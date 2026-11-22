<?php

namespace Tests\Feature;

use App\Services\AI\AiProviderInterface;
use App\Services\AI\HttpAiProvider;
use App\Services\AI\StubAiProvider;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class HttpAiProviderTest extends TestCase
{
    public function test_http_provider_is_opt_in_and_requires_secure_configuration(): void
    {
        $this->assertInstanceOf(StubAiProvider::class, app(AiProviderInterface::class));
        config(['disaster.ai_provider' => 'http', 'disaster.ai_api_base' => 'http://ai.example.test/v1']);
        $this->assertInstanceOf(StubAiProvider::class, app(AiProviderInterface::class));
    }

    public function test_chat_and_embedding_validate_output_and_redact_common_sensitive_patterns(): void
    {
        $provider = $this->provider();
        Http::preventStrayRequests();
        Http::fake([
            'ai.example.test/v1/chat/completions' => Http::response(['choices' => [['message' => ['content' => '{"water_depth_cm":{"value":40,"evidence":"40 cm"}}']]]]),
            'ai.example.test/v1/embeddings' => Http::response(['data' => [
                ['index' => 2, 'embedding' => [0, 1]], ['index' => 0, 'embedding' => [1, 0]], ['index' => 1, 'embedding' => [2, 0]],
            ]]),
        ]);
        $text = 'Banjir 40 cm, kontak nama@example.test 081234567891, titik -6.12345, 106.12345; 1234567890123456';
        $this->assertSame(40, $provider->analyze($text)['water_depth_cm']['value']);
        $this->assertSame([1.0, 0.0], $provider->similarities($text, ['Banjir di jalan', 'Gempa']));
        Http::assertSentCount(2);
        foreach (Http::recorded() as [$request]) {
            /** @var Request $request */
            foreach (['nama@example.test', '081234567891', '106.12345', '1234567890123456'] as $secret) {
                $this->assertStringNotContainsString($secret, $request->body());
            }
            $this->assertStringContainsString('[REDACTED]', $request->body());
            $this->assertTrue($request->hasHeader('Authorization', 'Bearer synthetic-key'));
        }
    }

    public function test_provider_errors_hide_response_body(): void
    {
        Http::fake(['ai.example.test/*' => Http::response('sensitive response', 503)]);
        $this->expectExceptionMessage('AI_PROVIDER_UNAVAILABLE');
        $this->provider()->analyze('Banjir 40 cm.');
    }

    private function provider(): HttpAiProvider
    {
        config([
            'disaster.ai_provider' => 'http', 'disaster.ai_api_base' => 'https://ai.example.test/v1',
            'disaster.ai_api_key' => 'synthetic-key', 'disaster.ai_chat_model' => 'test-chat',
            'disaster.ai_embedding_model' => 'test-embedding',
        ]);
        $provider = app(AiProviderInterface::class);
        $this->assertInstanceOf(HttpAiProvider::class, $provider);

        return $provider;
    }
}

<?php

namespace Tests\Feature;

use Aws\MockHandler;
use Aws\Result;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SupabaseStorageTest extends TestCase
{
    public function test_private_supabase_s3_upload_omits_unsupported_acl_header(): void
    {
        $handler = new MockHandler([new Result]);
        config(['filesystems.disks.s3' => [
            'driver' => 'supabase-s3',
            'key' => 'synthetic-test-key',
            'secret' => 'synthetic-test-secret',
            'region' => 'ap-southeast-1',
            'bucket' => 'incident-evidence',
            'endpoint' => 'https://storage.example.test/storage/v1/s3',
            'use_path_style_endpoint' => true,
            'throw' => true,
            'handler' => $handler,
        ]]);

        $this->assertTrue(Storage::disk('s3')->put('incident-photos/example.jpg', 'synthetic bytes', 'private'));
        $request = $handler->getLastRequest();
        $this->assertNotNull($request);
        $this->assertSame('/storage/v1/s3/incident-evidence/incident-photos/example.jpg', $request->getUri()->getPath());
        $this->assertFalse($request->hasHeader('x-amz-acl'));
    }
}

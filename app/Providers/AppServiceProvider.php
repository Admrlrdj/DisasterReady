<?php

namespace App\Providers;

use App\Models\User;
use App\Services\AI\AiProviderInterface;
use App\Services\AI\HttpAiProvider;
use App\Services\AI\StubAiProvider;
use Aws\CommandInterface;
use Aws\Middleware;
use Carbon\CarbonImmutable;
use Illuminate\Filesystem\AwsS3V3Adapter;
use Illuminate\Filesystem\FilesystemManager;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(AiProviderInterface::class, fn (): AiProviderInterface => HttpAiProvider::configured() ?? new StubAiProvider);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        Storage::extend('supabase-s3', function ($app, array $config): AwsS3V3Adapter {
            $disk = $app->make(FilesystemManager::class)->createS3Driver($config + [
                'request_checksum_calculation' => 'when_required',
                'response_checksum_validation' => 'when_required',
            ]);
            if (! $disk instanceof AwsS3V3Adapter) {
                throw new \LogicException('SUPABASE_S3_ADAPTER_REQUIRED');
            }
            $disk->getClient()->getHandlerList()->appendInit(Middleware::mapCommand(
                static function (CommandInterface $command): CommandInterface {
                    unset($command['ACL']);

                    return $command;
                }
            ), 'supabase-omit-unsupported-acl');

            return $disk;
        });
        Gate::define('moderate', fn (User $user): bool => $user->status === 'active' && in_array($user->role, ['moderator', 'admin'], true));
        Gate::define('administer', fn (User $user): bool => $user->status === 'active' && $user->role === 'admin');
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}

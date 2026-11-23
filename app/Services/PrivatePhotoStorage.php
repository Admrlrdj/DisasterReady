<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PrivatePhotoStorage
{
    /** @return array{disk: string, storage_key: string, sha256: string} */
    public function store(UploadedFile $photo): array
    {
        $clean = $this->cleanJpeg($photo);
        $disk = (string) config('disaster.photo_disk');
        $key = 'incident-photos/'.Str::uuid().'.jpg';
        if (! Storage::disk($disk)->put($key, $clean, 'private')) {
            throw new \RuntimeException('PHOTO_STORAGE_FAILED');
        }

        return ['disk' => $disk, 'storage_key' => $key, 'sha256' => hash('sha256', $clean)];
    }

    public function cleanJpeg(UploadedFile $photo): string
    {
        $bytes = file_get_contents($photo->getRealPath());
        $image = $bytes === false ? false : @imagecreatefromstring($bytes);
        if ($image === false) {
            throw ValidationException::withMessages(['photo' => 'Foto tidak dapat diproses.']);
        }
        ob_start();
        imagejpeg($image, null, 85);
        $clean = ob_get_clean();
        imagedestroy($image);
        if ($clean === false) {
            throw new \RuntimeException('PHOTO_ENCODING_FAILED');
        }

        return $clean;
    }
}

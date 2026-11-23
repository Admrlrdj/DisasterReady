<!DOCTYPE html>
<html lang="id" style="color-scheme: {{ $appearance ?? 'light' }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <style>
            html {
                background-color: oklch(1 0 0);
            }
        </style>

        <link rel="icon" href="/assets/figma/15-58-imgFrame.svg" type="image/svg+xml">
        <meta name="theme-color" content="#0C3B2E">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'DisasterReady') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>

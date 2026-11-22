param(
    [ValidateSet('start', 'status', 'stop')]
    [string] $Action = 'status'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pgControl = Join-Path $projectRoot '.tools/pgsql/bin/pg_ctl.exe'
$pgData = Join-Path $projectRoot '.tools/pg-data'
$pgLog = Join-Path $projectRoot '.tools/pg-server.log'

if (-not (Test-Path -LiteralPath $pgControl) -or -not (Test-Path -LiteralPath (Join-Path $pgData 'PG_VERSION'))) {
    throw 'Instance PostGIS lokal proyek belum disiapkan. Lihat docs/FRONTEND_PROGRESS.md.'
}

if ($Action -eq 'start') {
    & $pgControl -D $pgData status *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Output 'Instance PostGIS proyek sudah berjalan di localhost:55432.'
        exit 0
    }
    & $pgControl -D $pgData -l $pgLog -o '-h 127.0.0.1 -p 55432' -w start
} elseif ($Action -eq 'stop') {
    & $pgControl -D $pgData -m fast -w stop
} else {
    & $pgControl -D $pgData status
}

exit $LASTEXITCODE

param([string]$JsonPath, [string]$OutputPath)
$json = Get-Content $JsonPath -Raw | ConvertFrom-Json
if ($json.success) {
    $bytes = [Convert]::FromBase64String($json.data.base64)
    [System.IO.File]::WriteAllBytes($OutputPath, $bytes)
    Write-Host "Saved: $($json.data.width)x$($json.data.height)"
} else {
    Write-Host "Error: $($json.error)"
}

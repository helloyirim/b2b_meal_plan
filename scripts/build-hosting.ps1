$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$publicDirectory = [System.IO.Path]::GetFullPath((Join-Path $projectRoot "public"))
$expectedPublicDirectory = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($projectRoot, "public"))

if ($publicDirectory -ne $expectedPublicDirectory) {
  throw "Unexpected public directory: $publicDirectory"
}

if (Test-Path -LiteralPath $publicDirectory) {
  Remove-Item -LiteralPath $publicDirectory -Recurse -Force
}

New-Item -ItemType Directory -Path $publicDirectory | Out-Null
New-Item -ItemType Directory -Path (Join-Path $publicDirectory "js") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $publicDirectory "css") | Out-Null

Copy-Item -LiteralPath (Join-Path $projectRoot "index.html") -Destination (Join-Path $publicDirectory "index.html")

$copiedFiles = @("index.html")

Get-ChildItem -LiteralPath (Join-Path $projectRoot "js") -File -Filter "*.js" |
  Sort-Object Name |
  ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path (Join-Path $publicDirectory "js") $_.Name)
    $script:copiedFiles += "js/$($_.Name)"
  }

Get-ChildItem -LiteralPath (Join-Path $projectRoot "css") -File -Filter "*.css" |
  Sort-Object Name |
  ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path (Join-Path $publicDirectory "css") $_.Name)
    $script:copiedFiles += "css/$($_.Name)"
  }

Write-Output "Firebase Hosting artifact created: $publicDirectory"
$copiedFiles | Sort-Object | ForEach-Object { Write-Output "  $_" }

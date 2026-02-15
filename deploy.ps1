# deploy.ps1 — Run this from PowerShell in the project folder
# Usage: .\deploy.ps1 -ProjectRef your-project-ref

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectRef
)

$ErrorActionPreference = "Stop"
$ProjectDir = $PSScriptRoot

Write-Host "=== Care Call AI — Deploy Edge Functions ===" -ForegroundColor Cyan
Write-Host "Project ref: $ProjectRef"
Write-Host "Project dir: $ProjectDir"
Write-Host ""

# Check for supabase CLI
$supabase = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabase) {
    Write-Host "Supabase CLI not found. Installing..." -ForegroundColor Yellow
    $release = Invoke-RestMethod "https://api.github.com/repos/supabase/cli/releases/latest"
    $asset = $release.assets | Where-Object { $_.name -like "*windows*amd64*" } | Select-Object -First 1
    $tmpZip = "$env:TEMP\supabase_cli.tar.gz"
    $tmpDir = "$env:TEMP\supabase_cli_extract"
    Invoke-WebRequest $asset.browser_download_url -OutFile $tmpZip
    New-Item -ItemType Directory $tmpDir -Force | Out-Null
    tar -xzf $tmpZip -C $tmpDir
    $exe = Get-ChildItem $tmpDir -Filter "supabase.exe" -Recurse | Select-Object -First 1
    $binPath = "$env:LOCALAPPDATA\supabase\supabase.exe"
    New-Item -ItemType Directory (Split-Path $binPath) -Force | Out-Null
    Copy-Item $exe.FullName $binPath -Force
    $env:PATH = "$env:LOCALAPPDATA\supabase;$env:PATH"
    Write-Host "Installed: $binPath" -ForegroundColor Green
}

Write-Host "Logging in to Supabase..." -ForegroundColor Cyan
supabase login

Write-Host "Linking project..." -ForegroundColor Cyan
Set-Location $ProjectDir
supabase link --project-ref $ProjectRef

Write-Host ""
Write-Host "Running SQL migration..." -ForegroundColor Cyan
$sql = Get-Content "$ProjectDir\supabase\migrations\002_ai_conversations.sql" -Raw
Write-Host "Please run this SQL in your Supabase Dashboard -> SQL Editor:" -ForegroundColor Yellow
Write-Host "  (or press Enter to skip if already done)"
Write-Host $sql -ForegroundColor Gray
Read-Host "Press Enter to continue"

Write-Host ""
Write-Host "Deploying invokeLLM..." -ForegroundColor Cyan
supabase functions deploy invokeLLM --no-verify-jwt

Write-Host "Deploying generateDocument..." -ForegroundColor Cyan
supabase functions deploy generateDocument --no-verify-jwt

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host "Make sure OPENAI_API_KEY is set in Supabase Dashboard -> Settings -> Edge Functions -> Secrets"

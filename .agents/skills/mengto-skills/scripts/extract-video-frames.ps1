<#
.SYNOPSIS
    Extracts representative keyframes and technical metadata from a reference video for Video-to-Superprompt analysis.

.DESCRIPTION
    Runs ffprobe to retrieve duration, dimensions, and frame rate, then uses ffmpeg to export 1 frame per second
    into an output directory.
#>

param (
    [Parameter(Mandatory=$true)]
    [string]$VideoPath,

    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "./video-frames",

    [Parameter(Mandatory=$false)]
    [int]$Fps = 1
)

if (-not (Test-Path $VideoPath)) {
    Write-Error "Video file not found at: $VideoPath"
    exit 1
}

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

Write-Host "Analyzing video metadata with ffprobe..." -ForegroundColor Cyan
ffprobe -v error -show_entries format=duration,size:stream=width,height,r_frame_rate -of json "$VideoPath"

Write-Host "Extracting frames at $Fps fps into $OutputDir..." -ForegroundColor Cyan
ffmpeg -y -i "$VideoPath" -vf "fps=$Fps" "$OutputDir/frame-%03d.jpg"

$frameCount = (Get-ChildItem -Path $OutputDir -Filter "*.jpg").Count
Write-Host "Successfully extracted $frameCount frames to $OutputDir" -ForegroundColor Green


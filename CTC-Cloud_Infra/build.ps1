# This script packages the Lambda function and its dependencies into a single ZIP file for AWS deployment.

$ErrorActionPreference = "Stop"

$BuildDir = ".\lambda_package"
$ZipFile = ".\lambda_deployment.zip"

Write-Host "Cleaning up old build files..." -ForegroundColor Cyan
if (Test-Path $BuildDir) {
    Remove-Item -Recurse -Force $BuildDir
}
if (Test-Path $ZipFile) {
    Remove-Item -Force $ZipFile
}

Write-Host "Creating build directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $BuildDir | Out-Null

Write-Host "Installing python dependencies (google-genai) for AWS Linux..." -ForegroundColor Cyan
# boto3 is already included in AWS Lambda runtime, so we only need google-genai
# We MUST specify the linux platform, otherwise pip downloads Windows binaries which crash Lambda
pip install google-genai -t $BuildDir --platform manylinux2014_x86_64 --python-version 3.10 --only-binary=:all:

Write-Host "Copying Lambda function code..." -ForegroundColor Cyan
Copy-Item -Path ".\ctc-ai-analyser.py" -Destination "$BuildDir\lambda_function.py"

Write-Host "Zipping the package..." -ForegroundColor Cyan
Compress-Archive -Path "$BuildDir\*" -DestinationPath $ZipFile -Force

Write-Host "Cleaning up build directory..." -ForegroundColor Cyan
Remove-Item -Recurse -Force $BuildDir

Write-Host "Build complete! You can now upload '$ZipFile' to your AWS Lambda function." -ForegroundColor Green

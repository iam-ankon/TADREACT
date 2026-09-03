<#
.SYNOPSIS
  One-time setup helper for the TAD Password Vault Chrome/Edge extension on
  a single, unmanaged PC (no Google Workspace / no Active Directory).

  Run this on each employee PC. It copies the extension to a fixed local
  folder and opens the browser to the right page. Chrome/Edge does not allow
  any script to flip on Developer Mode or pick the folder for you -- those
  two clicks are a manual, one-time step by design (a security guard against
  extensions silently installing themselves).

.USAGE
  Copy this whole TAD-VAULT-EXTENSION folder (e.g. from a shared drive or a
  USB stick) onto the PC, then right-click install.ps1 -> Run with PowerShell.
#>

$ErrorActionPreference = "Stop"

$sourceDir = $PSScriptRoot
$installDir = Join-Path $env:LOCALAPPDATA "TADPasswordVaultExtension"

Write-Host "Installing TAD Password Vault extension to:" -ForegroundColor Cyan
Write-Host "  $installDir`n"

if (Test-Path $installDir) {
    Remove-Item -Path $installDir -Recurse -Force
}
Copy-Item -Path $sourceDir -Destination $installDir -Recurse -Force

# Put the path on the clipboard so step 4 below is a paste, not typing.
Set-Clipboard -Value $installDir

Write-Host "Done. The folder path is now on your clipboard." -ForegroundColor Green
Write-Host ""
Write-Host "Now in Chrome (or Edge):" -ForegroundColor Yellow
Write-Host "  1. A new tab will open at chrome://extensions"
Write-Host "  2. Turn on 'Developer mode' (top-right toggle)"
Write-Host "  3. Click 'Load unpacked'"
Write-Host "  4. Paste the path (Ctrl+V) into the folder picker and select it"
Write-Host ""

try {
    Start-Process "chrome://extensions"
} catch {
    Write-Host "Could not open Chrome automatically - open it yourself and go to chrome://extensions" -ForegroundColor Yellow
}

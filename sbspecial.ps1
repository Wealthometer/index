# Configuration
$sslCert = "C:/Users/USER/Downloads/github.crt"
$commitMessage = "randoms"

# Define specific dates to process (year-month-day format)
$specificDates = @(
    (Get-Date "2025-03-13")
    (Get-Date "2025-07-10")
    (Get-Date "2025-07-29")
)

$totalDays = $specificDates.Count
$currentDay = 0

foreach ($currentDate in $specificDates) {
    $currentDay++
    $dateStr = $currentDate.ToString("MM-dd-yyyy")
    $fileName = "script-$($currentDate.ToString("yyyy-MM-dd")).txt"
    
    Write-Host "[$currentDay/$totalDays] Processing $dateStr - File: $fileName" -ForegroundColor Cyan
    
    # Set system date (requires admin privileges)
    try {
        Set-Date -Date $currentDate | Out-Null
    } catch {
        Write-Host "Error setting date. Make sure you're running as Administrator." -ForegroundColor Red
        exit
    }
    
    # Create the file (or touch it if it exists)
    if (-not (Test-Path $fileName)) {
        New-Item -ItemType File -Name $fileName -Force | Out-Null
        "Content for $dateStr" | Set-Content $fileName
    } else {
        # Touch existing file
        (Get-Item $fileName).LastWriteTime = Get-Date
    }
    
    # Git add and commit
    git add $fileName
    if ($LASTEXITCODE -eq 0) {
        git commit -m "$commitMessage"
        
        if ($LASTEXITCODE -eq 0) {
            # Configure SSL and push
            git config --global http.sslCAInfo "$sslCert"
            git push
            git config --global http.sslCAInfo "$sslCert"
            
            Write-Host "Successfully committed and pushed for $dateStr" -ForegroundColor Green
        } else {
            Write-Host "Commit failed for $dateStr" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Add failed for $fileName" -ForegroundColor Yellow
    }
    
    # Small delay to avoid overwhelming the system
    Start-Sleep -Milliseconds 500
}

Write-Host "`nBackfill complete! Restoring today's date..." -ForegroundColor Green
Set-Date -Date (Get-Date) 
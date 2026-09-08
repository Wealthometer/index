# Configuration
$commitMessage = "Auto-generated commit"
$delaySeconds = 5  # Delay between iterations

# Function to generate random content
function Get-RandomContent {
    $contentTypes = @("code", "text", "json")
    $type = Get-Random $contentTypes
    
    switch ($type) {
        "code" {
            return @"
// Random code generated at $(Get-Date)
function randomFunction$((Get-Random -Maximum 9999))() {
    const result = $((Get-Random -Maximum 100));
    return result * $((Get-Random -Maximum 10));
}
export default randomFunction$((Get-Random -Maximum 9999));
"@
        }
        "text" {
            $lines = @()
            for ($i = 0; $i -lt (Get-Random -Minimum 3 -Maximum 10); $i++) {
                $lines += "Random line $i with content: $(-join ((97..122) + (65..90) | Get-Random -Count 10 | ForEach-Object {[char]$_}))"
            }
            return ($lines -join "`n")
        }
        "json" {
            return @"
{
    "id": $((Get-Random -Maximum 1000)),
    "timestamp": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')",
    "data": "$((-join ((97..122) + (65..90) | Get-Random -Count 20 | ForEach-Object {[char]$_})))",
    "value": $((Get-Random -Maximum 100))
}
"@
        }
    }
}

# Main endless loop
while ($true) {
    try {
        # Generate timestamp-based filename
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $fileName = "auto-$timestamp.txt"
        
        Write-Host "Creating file: $fileName" -ForegroundColor Cyan
        
        # Create file with random content
        Get-RandomContent | Set-Content $fileName
        
        # Git operations
        Write-Host "Adding file to Git..." -ForegroundColor Yellow
        git add $fileName
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Committing changes..." -ForegroundColor Yellow
            git commit -m "$commitMessage - $timestamp"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Pushing to remote..." -ForegroundColor Yellow
                git push
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Successfully pushed $fileName" -ForegroundColor Green
                } else {
                    Write-Host "Push failed for $fileName" -ForegroundColor Red
                }
            } else {
                Write-Host "Commit failed for $fileName" -ForegroundColor Red
            }
        } else {
            Write-Host "Add failed for $fileName" -ForegroundColor Red
        }
        
        # Wait before next iteration
        Write-Host "Waiting $delaySeconds seconds before next iteration..." -ForegroundColor Blue
        Start-Sleep -Seconds $delaySeconds
        
    } catch {
        Write-Host "Error occurred: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Continuing in $delaySeconds seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds $delaySeconds
    }
}
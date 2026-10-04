# ============================================
# GitHub Workflow Automation with Code Review
# FIXED VERSION - Proper string handling
# ============================================

# Configuration
$commitMessage = "Auto-generated commit"
$delaySeconds = 8
$enableAutoMerge = $false
$simulateReviewRounds = $true

# Review personas
$reviewerPersonas = @(
    @{
        Name = "senior-dev"
        Style = "thorough"
        ApprovalRate = 0.3
        CommentTemplates = @(
            "Consider adding error handling here.",
            "This could benefit from unit tests.",
            "LGTM overall, just a minor suggestion.",
            "Have we considered edge cases?",
            "Performance looks acceptable.",
            "Naming could be more descriptive."
        )
    },
    @{
        Name = "tech-lead"
        Style = "critical"
        ApprovalRate = 0.2
        CommentTemplates = @(
            "This needs refactoring before merge.",
            "Security concern: validate inputs.",
            "Please add documentation.",
            "Breaking change - needs migration guide.",
            "Consider impact on existing clients.",
            "Not aligned with our architecture standards."
        )
    },
    @{
        Name = "peer-reviewer"
        Style = "casual"
        ApprovalRate = 0.5
        CommentTemplates = @(
            "Nice work! Just a nitpick.",
            "Could we simplify this?",
            "Works for me 👍",
            "Small typo in comment.",
            "Consider using const instead of let.",
            "Missing semicolon here."
        )
    }
)

function Test-GitHubCLI {
    $ghAuth = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "GitHub CLI not authenticated. Run: gh auth login" -ForegroundColor Red
        exit 1
    }
    Write-Host "GitHub CLI authenticated ✓" -ForegroundColor Green
}

function Get-RandomBranchName {
    $adjectives = @("feature", "bugfix", "hotfix", "release", "chore", "refactor", "update", "enhance", "optimize")
    $nouns = @("module", "component", "handler", "service", "utils", "config", "api", "ui", "database", "cache", "middleware")
    $verbs = @("fix", "add", "remove", "update", "implement", "optimize", "rework", "migrate", "integrate", "refactor")
    
    $adj = Get-Random $adjectives
    $noun = Get-Random $nouns
    $verb = Get-Random $verbs
    $id = Get-Random -Minimum 1000 -Maximum 9999
    
    return "$adj/$verb-$noun-$id"
}

# Generate random content - FIXED with proper escaping
function Get-RandomContent {
    param([string]$Quality = "standard")
    
    $contentTypes = @("code", "text", "json", "markdown", "yaml")
    $type = Get-Random $contentTypes
    
    $hasBug = ($Quality -eq "buggy" -and (Get-Random -Maximum 10) -lt 7)
    $bugComment = if ($hasBug) { "TODO: Fix this later`n" } else { "" }
    $currentBranch = git branch --show-current 2>$null
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    
    switch ($type) {
        "code" {
            $funcName = "func_$(-join ((97..122) | Get-Random -Count 8 | ForEach-Object {[char]$_}))"
            
            if ($Quality -eq "excellent") {
                $errorHandling = "    if (!input) throw new Error('Invalid input');`n"
            } else {
                $errorHandling = "    // FIXME: Add validation`n"
            }
            
            # Build code string piece by piece to avoid parsing issues
            $codeLines = @()
            $codeLines += "// $bugComment"
            $codeLines += "// Generated: $timestamp"
            $codeLines += "// Branch: $currentBranch"
            $codeLines += "// Quality: $Quality"
            $codeLines += ""
            $codeLines += "function $funcName(input) {"
            $codeLines += $errorHandling
            $codeLines += "    const data = {"
            $codeLines += "        id: $((Get-Random -Maximum 9999)),"
            $codeLines += "        timestamp: Date.now(),"
            $codeLines += "        value: input || $((Get-Random -Maximum 100))"
            $codeLines += "    };"
            $codeLines += "    "
            $codeLines += "    console.log('Processing:', data);"
            $codeLines += "    return data.value * $((Get-Random -Maximum 10));"
            $codeLines += "}"
            $codeLines += ""
            
            if ($Quality -eq "excellent") {
                $codeLines += "module.exports = { $funcName };"
            } else {
                $codeLines += "// export missing"
            }
            
            return $codeLines -join "`n"
        }
        
        "text" {
            $lines = @()
            $lineCount = Get-Random -Minimum 5 -Maximum 15
            $statuses = @('OK', 'PENDING', 'COMPLETE', 'SKIPPED', 'ERROR')
            
            for ($i = 0; $i -lt $lineCount; $i++) {
                $randomWord = -join ((97..122) | Get-Random -Count (Get-Random -Minimum 5 -Maximum 12) | ForEach-Object {[char]$_})
                $status = $statuses | Get-Random
                $time = Get-Date -Format 'HH:mm:ss'
                $lines += "[$i] $time - $randomWord - $status"
            }
            return ($lines -join "`n")
        }
        
        "json" {
            $missingField = ($Quality -eq "buggy" -and (Get-Random -Maximum 2) -eq 0)
            $statusField = if (-not $missingField) { "`"status`": `"$(Get-Random @('active', 'inactive'))`"" } else { "INVALID_JSON_HERE" }
            
            $jsonLines = @()
            $jsonLines += "{"
            $jsonLines += "    `"metadata`": {"
            $jsonLines += "        `"generated`": `"$timestamp`","
            $jsonLines += "        `"branch`": `"$currentBranch`","
            $jsonLines += "        `"version`": `"1.$((Get-Random -Maximum 100)).$((Get-Random -Maximum 10))`","
            $jsonLines += "        `"quality`": `"$Quality`""
            $jsonLines += "    },"
            $jsonLines += "    `"data`": {"
            $jsonLines += "        `"id`": $((Get-Random -Maximum 10000)),"
            $jsonLines += "        `"type`": `"$(Get-Random @('user', 'system', 'event', 'metric'))`","
            $jsonLines += "        `"payload`": `"$(-join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_}))`","
            $jsonLines += "        `"priority`": $((Get-Random -Maximum 5))"
            
            if (-not $missingField) {
                $jsonLines += ","
                $jsonLines += "        $statusField"
            }
            
            $jsonLines += "    }"
            $jsonLines += "}"
            
            return $jsonLines -join "`n"
        }
        
        "markdown" {
            $docType = Get-Random @('Documentation', 'Changelog', 'Notes', 'Report')
            $status = Get-Random @('Active', 'Draft', 'Review', 'Complete')
            $priority = Get-Random -Maximum 5
            
            $mdLines = @()
            $mdLines += "# $docType - $(Get-Date -Format 'yyyy-MM-dd')"
            $mdLines += ""
            $mdLines += "## Overview"
            $mdLines += "Generated automatically for branch: ``$currentBranch``"
            $mdLines += ""
            $mdLines += "## Details"
            $mdLines += "- **ID**: $((Get-Random -Maximum 10000))"
            $mdLines += "- **Quality**: $Quality"
            $mdLines += "- **Status**: $status"
            $mdLines += "- **Priority**: $priority/5"
            $mdLines += ""
            $mdLines += "## Changes"
            
            $changeCount = Get-Random -Minimum 2 -Maximum 6
            for ($i = 1; $i -le $changeCount; $i++) {
                $changeText = -join ((97..122) | Get-Random -Count 8 | ForEach-Object {[char]$_})
                $mdLines += "- Item $i`: $changeText"
            }
            
            if ($Quality -eq "buggy") {
                $mdLines += ""
                $mdLines += "## Known Issues"
                $mdLines += "- Tests failing"
                $mdLines += "- Needs review"
            } else {
                $mdLines += ""
                $mdLines += "## Testing"
                $mdLines += "- All tests passing ✓"
            }
            
            $mdLines += ""
            $mdLines += "---"
            $mdLines += "*Auto-generated by workflow script*"
            
            return $mdLines -join "`n"
        }
        
        "yaml" {
            $env = Get-Random @('development', 'staging', 'production')
            $debug = Get-Random @('true', 'false')
            $timeout = Get-Random -Minimum 10 -Maximum 60
            $retries = Get-Random -Minimum 1 -Maximum 5
            $serviceName = -join ((97..122) | Get-Random -Count 8 | ForEach-Object {[char]$_})
            $port = 3000 + (Get-Random -Maximum 1000)
            $replicas = Get-Random -Minimum 1 -Maximum 5
            
            $yamlLines = @()
            $yamlLines += "# Configuration generated: $timestamp"
            $yamlLines += "version: '1.$((Get-Random -Maximum 100))'"
            $yamlLines += "environment: $env"
            $yamlLines += ""
            $yamlLines += "service:"
            $yamlLines += "  name: $serviceName"
            $yamlLines += "  port: $port"
            $yamlLines += "  replicas: $replicas"
            
            if ($Quality -eq "buggy") {
                $yamlLines += "  port: 'INVALID'"
            }
            
            $yamlLines += ""
            $yamlLines += "settings:"
            $yamlLines += "  debug: $debug"
            $yamlLines += "  timeout: $timeout"
            $yamlLines += "  retries: $retries"
            $yamlLines += "  quality: $Quality"
            
            return $yamlLines -join "`n"
        }
    }
}

function Get-RandomIssue {
    $issueTypes = @("Bug", "Feature", "Task", "Refactor", "Documentation", "Test")
    $type = Get-Random $issueTypes
    
    $titles = @{
        "Bug" = @("Fix memory leak", "Resolve race condition", "Fix null pointer", "Address performance issue", "Fix error handling")
        "Feature" = @("Add new data format support", "Implement caching", "Add auth flow", "Create API endpoint", "Add logging")
        "Task" = @("Update dependencies", "Clean up code", "Optimize queries", "Refactor config", "Improve errors")
        "Refactor" = @("Restructure architecture", "Extract utilities", "Simplify logic", "Remove duplicates", "Improve organization")
        "Documentation" = @("Update API docs", "Add comments", "Create setup guide", "Document config", "Add examples")
        "Test" = @("Add unit tests", "Increase coverage", "Add integration tests", "Create fixtures", "Fix flaky tests")
    }
    
    $bodies = @("Needs attention for stability.", "Required for release.", "Maintenance task.", "From code review.", "Technical debt.", "New functionality.", "Monitoring alert.")
    
    return @{
        Title = "[$(Get-Random -Maximum 9999)] $(Get-Random $titles[$type])"
        Body = "$(Get-Random $bodies)`n`n**Type**: $type`n**Priority**: $(Get-Random -Maximum 5)/5`n**Generated**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        Type = $type
    }
}

function New-FeatureBranch {
    $branchName = Get-RandomBranchName
    
    Write-Host "`n=== Creating Branch ===" -ForegroundColor Cyan
    Write-Host "Branch: $branchName" -ForegroundColor White
    
    git fetch origin main 2>&1 | Out-Null
    git checkout -b $branchName origin/main 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Created: $branchName" -ForegroundColor Green
        return $branchName
    }
    return $null
}

function New-Commit {
    param(
        [string]$BranchName,
        [string]$Quality = "standard"
    )
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $extensions = @(".txt", ".js", ".json", ".md", ".yml", ".log")
    $extension = Get-Random $extensions
    $fileName = "auto-$Quality-$timestamp$extension"
    
    Write-Host "`n=== Creating File ($Quality) ===" -ForegroundColor Cyan
    Write-Host "File: $fileName" -ForegroundColor White
    
    $content = Get-RandomContent -Quality $Quality
    $content | Set-Content $fileName -Encoding UTF8
    
    git add $fileName | Out-Null
    
    $msg = "$commitMessage [$BranchName] - $timestamp"
    git commit -m $msg 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Committed" -ForegroundColor Green
        return $fileName
    }
    return $null
}

function New-PullRequest {
    param([string]$BranchName)
    
    Write-Host "`n=== Creating Pull Request ===" -ForegroundColor Cyan
    
    git push -u origin $BranchName 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        $prTitle = "Auto PR: $BranchName"
        $prBody = "Automated PR`n`n**Branch**: $branchName`n**Created**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`nReady for review."
        
        $prUrl = gh pr create --title $prTitle --body $prBody --base main --head $BranchName 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ PR created: $prUrl" -ForegroundColor Green
            return $prUrl
        }
    }
    return $null
}

function Get-PRNumber {
    param([string]$BranchName)
    
    $prInfo = gh pr view $BranchName --json number 2>&1 | ConvertFrom-Json
    return $prInfo.number
}

function Start-CodeReview {
    param(
        [string]$BranchName,
        [string]$PRUrl
    )
    
    Write-Host "`n=== Starting Code Review ===" -ForegroundColor Magenta
    
    $prNumber = Get-PRNumber -BranchName $BranchName
    
    if (-not $prNumber) {
        Write-Host "✗ Could not find PR number" -ForegroundColor Red
        return $null
    }
    
    Write-Host "PR #$prNumber found" -ForegroundColor Gray
    
    $persona = Get-Random $reviewerPersonas
    Write-Host "Reviewer: $($persona.Name) ($($persona.Style))" -ForegroundColor Cyan
    
    Write-Host "`n--- Reviewing Diff ---" -ForegroundColor Yellow
    $diff = gh pr diff $prNumber 2>&1
    
    $comments = @()
    $generalComment = Get-Random $persona.CommentTemplates
    $comments += $generalComment
    
    if ($diff -match "TODO|FIXME|BUG") {
        $comments += "Found TODO/FIXME comments - please resolve before merging."
    }
    if ($diff -match "console\.log") {
        $comments += "Remove debug console.log statements."
    }
    if ($diff -match "function.*function") {
        $comments += "Consider breaking this into smaller functions."
    }
    
    foreach ($comment in $comments) {
        $fullComment = "[$($persona.Name)] $comment"
        gh pr comment $prNumber --body $fullComment 2>&1 | Out-Null
        Write-Host "  Comment: $fullComment" -ForegroundColor Gray
        Start-Sleep -Milliseconds 500
    }
    
    $roll = Get-Random -Maximum 100
    $action = if ($roll -lt ($persona.ApprovalRate * 100)) { 
        "APPROVE" 
    } elseif ($roll -lt 70) { 
        "REQUEST_CHANGES" 
    } else { 
        "COMMENT" 
    }
    
    Write-Host "`n--- Submitting Review ---" -ForegroundColor Yellow
    Write-Host "Action: $action" -ForegroundColor White
    
    $reviewBody = switch ($action) {
        "APPROVE" { "Approved by $($persona.Name). Changes look good!" }
        "REQUEST_CHANGES" { "Changes requested by $($persona.Name). Please address comments." }
        "COMMENT" { "Reviewed by $($persona.Name). See comments above." }
    }
    
    gh pr review $prNumber --$($action.ToLower()) --body $reviewBody 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Review submitted: $action" -ForegroundColor Green
        
        return @{
            PRNumber = $prNumber
            Action = $action
            Persona = $persona.Name
            Comments = $comments
        }
    }
    
    return $null
}

function Start-MultiRoundReview {
    param([string]$BranchName)
    
    Write-Host "`n=== Multi-Round Review Process ===" -ForegroundColor Magenta
    
    $round = 0
    $approved = $false
    $maxRounds = 3
    
    while (-not $approved -and $round -lt $maxRounds) {
        $round++
        Write-Host "`n--- Review Round $round ---" -ForegroundColor Yellow
        
        $prNumber = Get-PRNumber -BranchName $BranchName
        
        $persona = $reviewerPersonas[($round - 1) % $reviewerPersonas.Count]
        Write-Host "Reviewer: $($persona.Name)" -ForegroundColor Cyan
        
        $comments = @()
        $commentCount = Get-Random -Minimum 1 -Maximum 4
        
        for ($i = 0; $i -lt $commentCount; $i++) {
            $comments += Get-Random $persona.CommentTemplates
        }
        
        foreach ($comment in $comments) {
            $fullComment = "[$($persona.Name) - Round $round] $comment"
            gh pr comment $prNumber --body $fullComment 2>&1 | Out-Null
            Write-Host "  → $fullComment" -ForegroundColor Gray
            Start-Sleep -Milliseconds 300
        }
        
        $action = if ($round -eq $maxRounds) { 
            "APPROVE"
        } else { 
            Get-Random @("COMMENT", "REQUEST_CHANGES")
        }
        
        $reviewBody = switch ($action) {
            "APPROVE" { "LGTM! Approved after $round round(s) of review." }
            "REQUEST_CHANGES" { "Please address the feedback and re-request review." }
            "COMMENT" { "Review round $round complete. See comments." }
        }
        
        gh pr review $prNumber --$($action.ToLower()) --body $reviewBody 2>&1 | Out-Null
        Write-Host "→ Action: $action" -ForegroundColor $(if ($action -eq "APPROVE") { "Green" } else { "Yellow" })
        
        if ($action -eq "APPROVE") {
            $approved = $true
            Write-Host "✓ PR Approved after $round round(s)!" -ForegroundColor Green
        } else {
            Write-Host "Addressing feedback with fix commit..." -ForegroundColor Blue
            $fixFile = "fix-round$round-$(Get-Date -Format 'HHmmss').md"
            "# Fix for Round $round Review`n`nAddressed reviewer feedback." | Set-Content $fixFile
            git add $fixFile
            git commit -m "Address review feedback - Round $round" | Out-Null
            git push origin $BranchName | Out-Null
            Write-Host "✓ Pushed fixes" -ForegroundColor Green
            
            Start-Sleep -Seconds 2
        }
    }
    
    return $approved
}

function New-GitHubIssue {
    param([string]$BranchName)
    
    Write-Host "`n=== Creating Issue ===" -ForegroundColor Cyan
    
    $issue = Get-RandomIssue
    $label = $issue.Type.ToLower()
    
    $issueUrl = gh issue create --title $issue.Title --body $issue.Body --label $label 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $issueNumber = $issueUrl.Split('/')[-1]
        Write-Host "✓ Created issue #$issueNumber" -ForegroundColor Green
        return @{ Number = $issueNumber; Url = $issueUrl; Title = $issue.Title }
    }
    return $null
}

function Close-GitHubIssue {
    param([string]$IssueNumber)
    
    Write-Host "`n=== Closing Issue #$IssueNumber ===" -ForegroundColor Cyan
    gh issue close $IssueNumber --comment "Resolved in automated workflow." 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Closed" -ForegroundColor Green
        return $true
    }
    return $false
}

function New-FollowUpCommit {
    param(
        [string]$BranchName,
        [string]$IssueNumber
    )
    
    Write-Host "`n=== Follow-up Commit ===" -ForegroundColor Cyan
    
    $fileName = "fix-$IssueNumber-$(Get-Date -Format 'HHmmss').md"
    "# Fix #$IssueNumber`n`nResolved: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Set-Content $fileName
    
    git add $fileName | Out-Null
    git commit -m "Fix #$IssueNumber - Resolution" | Out-Null
    git push origin $BranchName 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Follow-up committed" -ForegroundColor Green
        return $fileName
    }
    return $null
}

function Merge-PullRequest {
    param([string]$BranchName)
    
    Write-Host "`n=== Merging PR ===" -ForegroundColor Magenta
    
    gh pr merge $BranchName --squash --delete-branch --subject "Auto-merge: $BranchName" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Merged and deleted: $BranchName" -ForegroundColor Green
        return $true
    }
    Write-Host "✗ Merge failed" -ForegroundColor Red
    return $false
}

function Start-FullWorkflow {
    $iteration = 0
    
    while ($true) {
        $iteration++
        Write-Host "`n========================================" -ForegroundColor Magenta
        Write-Host "  WORKFLOW ITERATION #$iteration" -ForegroundColor Magenta
        Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Magenta
        Write-Host "========================================" -ForegroundColor Magenta
        
        try {
            $branch = New-FeatureBranch
            if (-not $branch) { throw "Branch failed" }
            
            $quality = Get-Random @("standard", "buggy", "excellent")
            $file1 = New-Commit -BranchName $branch -Quality $quality
            
            $prUrl = New-PullRequest -BranchName $branch
            if (-not $prUrl) { throw "PR failed" }
            
            if ($simulateReviewRounds) {
                $reviewResult = Start-MultiRoundReview -BranchName $branch
            } else {
                $reviewResult = Start-CodeReview -BranchName $branch -PRUrl $prUrl
            }
            
            $issue = New-GitHubIssue -BranchName $branch
            if ($issue) {
                Close-GitHubIssue -IssueNumber $issue.Number
                New-FollowUpCommit -BranchName $branch -IssueNumber $issue.Number
            }
            
            if ($enableAutoMerge -and $reviewResult -and ($reviewResult.Action -eq "APPROVE" -or $simulateReviewRounds)) {
                Merge-PullRequest -BranchName $branch
            }
            
            git checkout main 2>&1 | Out-Null
            
            Write-Host "`n========================================" -ForegroundColor Green
            Write-Host "  WORKFLOW COMPLETE ✓" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            
        } catch {
            Write-Host "`n========================================" -ForegroundColor Red
            Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "========================================" -ForegroundColor Red
            git checkout main 2>&1 | Out-Null
        }
        
        Write-Host "`nWaiting $delaySeconds seconds..." -ForegroundColor Blue
        Start-Sleep -Seconds $delaySeconds
    }
}

# ============================================
# ENTRY POINT
# ============================================

Write-Host @"
========================================
  GITHUB WORKFLOW + CODE REVIEW BOT
  FIXED VERSION
========================================

Features:
  ✓ Creates random branches & commits
  ✓ Opens Pull Requests
  ✓ Simulates code reviews with personas
  ✓ Multi-round review support
  ✓ Creates/closes issues
  ✓ Optional auto-merge

========================================
"@ -ForegroundColor Cyan

Test-GitHubCLI

if (-not (git rev-parse --git-dir 2>$null)) {
    Write-Host "Error: Not a git repository" -ForegroundColor Red
    exit 1
}

$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "Error: No origin remote" -ForegroundColor Red
    exit 1
}

Write-Host "Repository: $remote" -ForegroundColor Green
Write-Host "`nStarting in 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Start-FullWorkflow
$paths = @(".", "src")
$exclude = @(".git", "node_modules", "dist", "rename_script.ps1", ".env")

Get-ChildItem -Path "." -Recurse -File | ForEach-Object {
    $skip = $false
    foreach ($ex in $exclude) {
        if ($_.FullName -like "*\$ex\*" -or $_.FullName -like "*\$ex") {
            $skip = $true
            break
        }
    }
    
    if (!$skip) {
        $content = Get-Content $_.FullName -Raw
        if ($content -match "Truishop" -or $content -match "truishop") {
            $content = $content -replace "Truishop", "Bloomina"
            $content = $content -replace "truishop", "bloomina"
            Set-Content $_.FullName $content
            Write-Host "Updated: $($_.FullName)"
        }
    }
}

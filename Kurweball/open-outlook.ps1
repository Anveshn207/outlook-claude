try {
    Start-Process 'olk.exe'
    Write-Output "Launched olk.exe (new Outlook)"
} catch {
    try {
        Start-Process 'outlook.exe'
        Write-Output "Launched outlook.exe (classic Outlook)"
    } catch {
        # Try the Windows Store app
        Start-Process "shell:AppsFolder\Microsoft.OutlookForWindows_8wekyb3d8bbwe!Microsoft.OutlookforWindows"
        Write-Output "Launched Outlook Windows app"
    }
}

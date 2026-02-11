# List visible windows with title, handle, PID, and class name
# Usage: powershell -File uia-list-windows.ps1 [-Filter "title substring"]
param(
    [string]$Filter = ""
)

try {
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes

    $root = [System.Windows.Automation.AutomationElement]::RootElement
    $condition = [System.Windows.Automation.Condition]::TrueCondition
    $windows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $condition)

    $results = @()
    foreach ($win in $windows) {
        try {
            $name = $win.Current.Name
            $handle = $win.Current.NativeWindowHandle
            $procId = $win.Current.ProcessId
            $className = $win.Current.ClassName

            # Skip windows with no title
            if ([string]::IsNullOrWhiteSpace($name)) { continue }

            # Apply filter if provided
            if ($Filter -ne "" -and $name -notlike "*$Filter*") { continue }

            $results += @{
                title = $name
                handle = $handle
                processId = $procId
                className = $className
            }
        } catch {
            # Skip inaccessible windows
            continue
        }
    }

    $output = @{ success = $true; data = $results }
    $output | ConvertTo-Json -Depth 5 -Compress
} catch {
    @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
}

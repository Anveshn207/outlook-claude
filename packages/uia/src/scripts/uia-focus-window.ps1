# Focus/activate a window by title, handle, or PID
# Usage: powershell -File uia-focus-window.ps1 -Title "Notepad" | -Handle 12345 | -ProcessId 5678
param(
    [string]$Title = "",
    [int]$Handle = 0,
    [int]$ProcessId = 0
)

try {
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes

    $root = [System.Windows.Automation.AutomationElement]::RootElement
    $element = $null

    if ($Handle -ne 0) {
        $element = [System.Windows.Automation.AutomationElement]::FromHandle([IntPtr]$Handle)
    } elseif ($ProcessId -ne 0) {
        $condition = New-Object System.Windows.Automation.PropertyCondition(
            [System.Windows.Automation.AutomationElement]::ProcessIdProperty, $ProcessId
        )
        $element = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $condition)
    } elseif ($Title -ne "") {
        # Find by title substring
        $allWindows = $root.FindAll(
            [System.Windows.Automation.TreeScope]::Children,
            [System.Windows.Automation.Condition]::TrueCondition
        )
        foreach ($win in $allWindows) {
            try {
                if ($win.Current.Name -like "*$Title*") {
                    $element = $win
                    break
                }
            } catch { continue }
        }
    } else {
        throw "Must provide -Title, -Handle, or -ProcessId"
    }

    if ($null -eq $element) {
        throw "Window not found"
    }

    # Try to bring to foreground using WindowPattern
    try {
        $windowPattern = $element.GetCurrentPattern([System.Windows.Automation.WindowPattern]::Pattern)
        if ($windowPattern.Current.WindowVisualState -eq [System.Windows.Automation.WindowVisualState]::Minimized) {
            $windowPattern.SetWindowVisualState([System.Windows.Automation.WindowVisualState]::Normal)
        }
    } catch {
        # Not all windows support WindowPattern
    }

    # Set focus
    try {
        $element.SetFocus()
    } catch {
        # Fallback: use SetForegroundWindow via P/Invoke
        Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@
        [Win32]::SetForegroundWindow([IntPtr]$element.Current.NativeWindowHandle) | Out-Null
    }

    $output = @{
        success = $true
        data = @{
            title = $element.Current.Name
            handle = $element.Current.NativeWindowHandle
            processId = $element.Current.ProcessId
        }
    }
    $output | ConvertTo-Json -Depth 5 -Compress
} catch {
    @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
}

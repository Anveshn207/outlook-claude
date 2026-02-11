# Click a UI element by name/AutomationId within a window, or by screen coordinates
# Usage: powershell -File uia-click-element.ps1 -WindowTitle "Notepad" -Name "File" | -X 100 -Y 200
param(
    [string]$WindowTitle = "",
    [int]$WindowHandle = 0,
    [string]$Name = "",
    [string]$AutomationId = "",
    [int]$X = -1,
    [int]$Y = -1
)

try {
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes
    Add-Type @"
using System;
using System.Runtime.InteropServices;
public class MouseClick {
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, IntPtr dwExtraInfo);
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    public static void Click(int x, int y) {
        SetCursorPos(x, y);
        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, IntPtr.Zero);
        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, IntPtr.Zero);
    }
}
"@

    if ($X -ge 0 -and $Y -ge 0) {
        # Click at specific coordinates
        [MouseClick]::Click($X, $Y)
        @{
            success = $true
            data = @{ clicked = "coordinates"; x = $X; y = $Y }
        } | ConvertTo-Json -Depth 5 -Compress
        return
    }

    # Find element and click it
    $root = [System.Windows.Automation.AutomationElement]::RootElement

    $window = $null
    if ($WindowHandle -ne 0) {
        $window = [System.Windows.Automation.AutomationElement]::FromHandle([IntPtr]$WindowHandle)
    } elseif ($WindowTitle -ne "") {
        $allWindows = $root.FindAll(
            [System.Windows.Automation.TreeScope]::Children,
            [System.Windows.Automation.Condition]::TrueCondition
        )
        foreach ($win in $allWindows) {
            try {
                if ($win.Current.Name -like "*$WindowTitle*") {
                    $window = $win
                    break
                }
            } catch { continue }
        }
    } else {
        throw "Must provide -WindowTitle/-WindowHandle with -Name/-AutomationId, or -X/-Y coordinates"
    }

    if ($null -eq $window) { throw "Window not found" }

    # Build condition
    $condition = $null
    if ($AutomationId -ne "") {
        $condition = New-Object System.Windows.Automation.PropertyCondition(
            [System.Windows.Automation.AutomationElement]::AutomationIdProperty, $AutomationId
        )
    } elseif ($Name -ne "") {
        $condition = New-Object System.Windows.Automation.PropertyCondition(
            [System.Windows.Automation.AutomationElement]::NameProperty, $Name
        )
    } else {
        throw "Must provide -Name or -AutomationId to identify the element"
    }

    $element = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
    if ($null -eq $element) { throw "Element not found" }

    # Try InvokePattern first (for buttons, menu items)
    $clicked = $false
    try {
        $invokePattern = $element.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
        $invokePattern.Invoke()
        $clicked = $true
    } catch {}

    # Fallback: click at center of bounding rectangle
    if (-not $clicked) {
        $rect = $element.Current.BoundingRectangle
        $cx = [int]($rect.X + $rect.Width / 2)
        $cy = [int]($rect.Y + $rect.Height / 2)
        [MouseClick]::Click($cx, $cy)
    }

    @{
        success = $true
        data = @{
            clicked = $element.Current.Name
            automationId = $element.Current.AutomationId
            controlType = $element.Current.ControlType.ProgrammaticName
        }
    } | ConvertTo-Json -Depth 5 -Compress
} catch {
    @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
}

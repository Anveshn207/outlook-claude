# Capture screenshot of the entire screen, a specific window, or a region
# Output: base64-encoded PNG
# Usage: powershell -File uia-screenshot.ps1 [-WindowTitle "Notepad"] [-WindowHandle 12345] [-X 0 -Y 0 -Width 800 -Height 600]
param(
    [string]$WindowTitle = "",
    [int]$WindowHandle = 0,
    [int]$X = -1,
    [int]$Y = -1,
    [int]$Width = 0,
    [int]$Height = 0
)

try {
    Add-Type -AssemblyName System.Drawing
    Add-Type -AssemblyName System.Windows.Forms

    $captureX = 0
    $captureY = 0
    $captureWidth = 0
    $captureHeight = 0

    if ($X -ge 0 -and $Y -ge 0 -and $Width -gt 0 -and $Height -gt 0) {
        # Capture specific region
        $captureX = $X
        $captureY = $Y
        $captureWidth = $Width
        $captureHeight = $Height
    } elseif ($WindowTitle -ne "" -or $WindowHandle -ne 0) {
        # Capture specific window
        Add-Type -AssemblyName UIAutomationClient
        Add-Type -AssemblyName UIAutomationTypes
        Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WindowRect {
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
}
"@
        $root = [System.Windows.Automation.AutomationElement]::RootElement
        $window = $null

        if ($WindowHandle -ne 0) {
            $window = [System.Windows.Automation.AutomationElement]::FromHandle([IntPtr]$WindowHandle)
        } else {
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
        }

        if ($null -eq $window) { throw "Window not found" }

        $hwnd = [IntPtr]$window.Current.NativeWindowHandle
        $rect = New-Object WindowRect+RECT
        [WindowRect]::GetWindowRect($hwnd, [ref]$rect) | Out-Null

        $captureX = $rect.Left
        $captureY = $rect.Top
        $captureWidth = $rect.Right - $rect.Left
        $captureHeight = $rect.Bottom - $rect.Top

        if ($captureWidth -le 0 -or $captureHeight -le 0) {
            throw "Invalid window dimensions"
        }
    } else {
        # Full screen capture
        $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
        $captureX = $screen.X
        $captureY = $screen.Y
        $captureWidth = $screen.Width
        $captureHeight = $screen.Height
    }

    # Capture the screen region
    $bitmap = New-Object System.Drawing.Bitmap($captureWidth, $captureHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($captureX, $captureY, 0, 0, (New-Object System.Drawing.Size($captureWidth, $captureHeight)))
    $graphics.Dispose()

    # Convert to base64 PNG
    $stream = New-Object System.IO.MemoryStream
    $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
    $base64 = [Convert]::ToBase64String($stream.ToArray())
    $stream.Dispose()

    @{
        success = $true
        data = @{
            base64 = $base64
            width = $captureWidth
            height = $captureHeight
            x = $captureX
            y = $captureY
        }
    } | ConvertTo-Json -Depth 5 -Compress
} catch {
    @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
}

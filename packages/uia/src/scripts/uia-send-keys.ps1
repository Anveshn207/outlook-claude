# Send keyboard input to the focused window or a specific element
# Usage: powershell -File uia-send-keys.ps1 -Keys "Hello World" [-WindowTitle "Notepad"] [-Name "element"] [-AutomationId "id"]
param(
    [string]$Keys = "",
    [string]$WindowTitle = "",
    [int]$WindowHandle = 0,
    [string]$Name = "",
    [string]$AutomationId = ""
)

try {
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes
    Add-Type -AssemblyName System.Windows.Forms

    if ($Keys -eq "") { throw "Must provide -Keys parameter" }

    # If a window/element is specified, focus it first
    if ($WindowTitle -ne "" -or $WindowHandle -ne 0) {
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

        # Focus specific element if requested
        if ($Name -ne "" -or $AutomationId -ne "") {
            $condition = $null
            if ($AutomationId -ne "") {
                $condition = New-Object System.Windows.Automation.PropertyCondition(
                    [System.Windows.Automation.AutomationElement]::AutomationIdProperty, $AutomationId
                )
            } else {
                $condition = New-Object System.Windows.Automation.PropertyCondition(
                    [System.Windows.Automation.AutomationElement]::NameProperty, $Name
                )
            }
            $element = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
            if ($null -eq $element) { throw "Element not found" }
            try { $element.SetFocus() } catch {}
        } else {
            try { $window.SetFocus() } catch {}
        }

        Start-Sleep -Milliseconds 100
    }

    # Send keys using System.Windows.Forms.SendKeys
    [System.Windows.Forms.SendKeys]::SendWait($Keys)

    @{
        success = $true
        data = @{
            keysSent = $Keys
            target = if ($Name -ne "") { $Name } elseif ($AutomationId -ne "") { $AutomationId } elseif ($WindowTitle -ne "") { $WindowTitle } else { "active window" }
        }
    } | ConvertTo-Json -Depth 5 -Compress
} catch {
    @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
}

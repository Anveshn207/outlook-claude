# Read text from UI elements in a window
# Usage: powershell -File uia-read-text.ps1 -WindowTitle "Notepad" [-Name "element name"] [-AutomationId "id"] [-AllText]
param(
    [string]$WindowTitle = "",
    [int]$WindowHandle = 0,
    [string]$Name = "",
    [string]$AutomationId = "",
    [switch]$AllText
)

try {
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes
    Add-Type -AssemblyName System.Windows.Forms

    $root = [System.Windows.Automation.AutomationElement]::RootElement

    # Find target window
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
        throw "Must provide -WindowTitle or -WindowHandle"
    }

    if ($null -eq $window) { throw "Window not found" }

    function Get-ElementText($el) {
        $text = ""
        # Try ValuePattern (text boxes, combo boxes)
        try {
            $valuePattern = $el.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
            $text = $valuePattern.Current.Value
            if ($text -ne "") { return $text }
        } catch {}
        # Try TextPattern (rich text, document controls)
        try {
            $textPattern = $el.GetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern)
            $text = $textPattern.DocumentRange.GetText(-1)
            if ($text -ne "") { return $text }
        } catch {}
        # Fallback to Name property
        return $el.Current.Name
    }

    function Get-TextViaClipboard($el) {
        # Clipboard fallback for modern apps where UIA patterns return empty
        # Save current clipboard, select all in element, copy, read clipboard, restore
        try {
            $savedClip = $null
            try { $savedClip = [System.Windows.Forms.Clipboard]::GetText() } catch {}

            $el.SetFocus()
            Start-Sleep -Milliseconds 100
            [System.Windows.Forms.SendKeys]::SendWait("^a")
            Start-Sleep -Milliseconds 50
            [System.Windows.Forms.SendKeys]::SendWait("^c")
            Start-Sleep -Milliseconds 100

            $text = ""
            try { $text = [System.Windows.Forms.Clipboard]::GetText() } catch {}

            # Restore previous clipboard content
            if ($null -ne $savedClip -and $savedClip -ne "") {
                try { [System.Windows.Forms.Clipboard]::SetText($savedClip) } catch {}
            }

            # Deselect (press End key to move cursor to end)
            [System.Windows.Forms.SendKeys]::SendWait("{END}")

            return $text
        } catch {
            return ""
        }
    }

    if ($AllText) {
        # Read all text from the window
        $textElements = @()
        $condition = [System.Windows.Automation.Condition]::TrueCondition
        $elements = $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condition)
        $count = 0
        foreach ($el in $elements) {
            if ($count -ge 100) { break }
            try {
                $text = Get-ElementText $el
                if (-not [string]::IsNullOrWhiteSpace($text)) {
                    $textElements += @{
                        name = $el.Current.Name
                        automationId = $el.Current.AutomationId
                        controlType = $el.Current.ControlType.ProgrammaticName
                        text = $text
                    }
                    $count++
                }
            } catch { continue }
        }
        @{ success = $true; data = $textElements } | ConvertTo-Json -Depth 5 -Compress
    } else {
        # Find specific element
        $element = $null
        if ($AutomationId -ne "") {
            $condition = New-Object System.Windows.Automation.PropertyCondition(
                [System.Windows.Automation.AutomationElement]::AutomationIdProperty, $AutomationId
            )
            $element = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
        } elseif ($Name -ne "") {
            $condition = New-Object System.Windows.Automation.PropertyCondition(
                [System.Windows.Automation.AutomationElement]::NameProperty, $Name
            )
            $element = $window.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
        } else {
            # No specific element - try to read from the window's main document/edit control
            $element = $window
        }

        if ($null -eq $element) { throw "Element not found" }

        $text = Get-ElementText $element
        $method = "uia"

        # If UIA returned just the element name (no actual content), try clipboard fallback
        $isEditableControl = $false
        try {
            $ctName = $element.Current.ControlType.ProgrammaticName
            $isEditableControl = ($ctName -eq "ControlType.Document" -or $ctName -eq "ControlType.Edit")
        } catch {}

        if ($isEditableControl -and ($text -eq $element.Current.Name -or [string]::IsNullOrWhiteSpace($text))) {
            $clipText = Get-TextViaClipboard $element
            if (-not [string]::IsNullOrWhiteSpace($clipText)) {
                $text = $clipText
                $method = "clipboard"
            }
        }

        @{
            success = $true
            data = @{
                text = $text
                name = $element.Current.Name
                automationId = $element.Current.AutomationId
                controlType = $element.Current.ControlType.ProgrammaticName
                method = $method
            }
        } | ConvertTo-Json -Depth 5 -Compress
    }
} catch {
    @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
}

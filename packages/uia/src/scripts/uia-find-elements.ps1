# Find UI elements in a window by name, AutomationId, or ControlType
# Usage: powershell -File uia-find-elements.ps1 -WindowTitle "Notepad" [-Name "File"] [-AutomationId "MenuBar"] [-ControlType "Button"] [-MaxDepth 3]
param(
    [string]$WindowTitle = "",
    [int]$WindowHandle = 0,
    [string]$Name = "",
    [string]$AutomationId = "",
    [string]$ControlType = "",
    [int]$MaxResults = 50
)

try {
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes

    $root = [System.Windows.Automation.AutomationElement]::RootElement

    # Find the target window
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

    # Build search conditions
    $conditions = @()

    if ($Name -ne "") {
        $conditions += New-Object System.Windows.Automation.PropertyCondition(
            [System.Windows.Automation.AutomationElement]::NameProperty, $Name
        )
    }

    if ($AutomationId -ne "") {
        $conditions += New-Object System.Windows.Automation.PropertyCondition(
            [System.Windows.Automation.AutomationElement]::AutomationIdProperty, $AutomationId
        )
    }

    if ($ControlType -ne "") {
        $ctProp = [System.Windows.Automation.ControlType]::$ControlType
        if ($null -ne $ctProp) {
            $conditions += New-Object System.Windows.Automation.PropertyCondition(
                [System.Windows.Automation.AutomationElement]::ControlTypeProperty, $ctProp
            )
        }
    }

    $searchCondition = $null
    if ($conditions.Count -eq 0) {
        $searchCondition = [System.Windows.Automation.Condition]::TrueCondition
    } elseif ($conditions.Count -eq 1) {
        $searchCondition = $conditions[0]
    } else {
        $searchCondition = New-Object System.Windows.Automation.AndCondition($conditions)
    }

    $elements = $window.FindAll([System.Windows.Automation.TreeScope]::Descendants, $searchCondition)

    $results = @()
    $count = 0
    foreach ($el in $elements) {
        if ($count -ge $MaxResults) { break }
        try {
            $rect = $el.Current.BoundingRectangle
            $results += @{
                name = $el.Current.Name
                automationId = $el.Current.AutomationId
                controlType = $el.Current.ControlType.ProgrammaticName
                className = $el.Current.ClassName
                isEnabled = $el.Current.IsEnabled
                boundingRectangle = @{
                    x = [int]$rect.X
                    y = [int]$rect.Y
                    width = [int]$rect.Width
                    height = [int]$rect.Height
                }
            }
            $count++
        } catch { continue }
    }

    @{ success = $true; data = $results } | ConvertTo-Json -Depth 5 -Compress
} catch {
    @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
}

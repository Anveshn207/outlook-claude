Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Minimize all windows first, then bring the PDF viewer to front
$shell = New-Object -ComObject Shell.Application
$shell.MinimizeAll()
Start-Sleep -Seconds 1

# Re-open the PDF to bring it to front
Start-Process "C:\Users\E2 Training\Downloads\Sathvika Bachireddy DL copy.pdf"
Start-Sleep -Seconds 3

$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
$bmp.Save("C:\Outlook Claude\dl-screenshot2.png")
$g.Dispose()
$bmp.Dispose()
Write-Output "Screenshot saved"

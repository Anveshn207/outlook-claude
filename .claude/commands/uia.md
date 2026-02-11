You have access to Windows UI Automation tools via the windows-uia MCP server. Use these tools to interact with desktop applications — clicking buttons, reading text, navigating UI elements, and taking screenshots.

## Available Tools

### Window Management
- **uia_list_windows** - List visible windows (filter by title)
- **uia_focus_window** - Bring a window to the foreground by title, handle, or PID

### Element Discovery
- **uia_find_elements** - Search for UI elements by name, AutomationId, or ControlType (Button, Edit, MenuItem, ListItem, TreeItem, Text, etc.)
- **uia_get_element_tree** - Get all UI elements in a window to discover what's available

### Interaction
- **uia_click** - Click an element by name/AutomationId, or click at screen coordinates (x, y)
- **uia_read_text** - Read text from specific elements or all text in a window
- **uia_send_keys** - Send keyboard input using SendKeys syntax: `{ENTER}`, `{TAB}`, `^c` (Ctrl+C), `%{F4}` (Alt+F4)

### Visual
- **uia_screenshot** - Capture full screen, a specific window, or a region as PNG

## Typical Workflow
1. `uia_list_windows` - Find the target application window
2. `uia_focus_window` - Activate it
3. `uia_find_elements` or `uia_get_element_tree` - Discover UI elements
4. `uia_click` / `uia_send_keys` / `uia_read_text` - Interact with the application
5. `uia_screenshot` - Verify the result visually

## Guidelines
- Always list/focus the target window before interacting with its elements
- Use `uia_get_element_tree` first to understand what elements are available
- Prefer AutomationId over Name when both are available (more stable)
- Use `uia_screenshot` to verify actions completed correctly
- For text input, focus the target element first, then use `uia_send_keys`
- Always confirm with the user before performing destructive actions (deleting, closing)

$ARGUMENTS

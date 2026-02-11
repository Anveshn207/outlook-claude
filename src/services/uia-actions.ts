/**
 * UI actions: click, read text, send keys.
 */
import { runScript } from "./uia-powershell.js";

export interface ClickResult {
  clicked: string;
  automationId?: string;
  controlType?: string;
  x?: number;
  y?: number;
}

export interface TextResult {
  text: string;
  name?: string;
  automationId?: string;
  controlType?: string;
  source?: string;
}

export interface SendKeysResult {
  keysSent: string;
  target: string;
}

/**
 * Click a UI element by name/AutomationId, or at specific screen coordinates.
 */
export async function click(opts: {
  windowTitle?: string;
  windowHandle?: number;
  name?: string;
  automationId?: string;
  x?: number;
  y?: number;
}): Promise<ClickResult> {
  const args: Record<string, string | number> = {};
  if (opts.windowTitle) args.WindowTitle = opts.windowTitle;
  if (opts.windowHandle) args.WindowHandle = opts.windowHandle;
  if (opts.name) args.Name = opts.name;
  if (opts.automationId) args.AutomationId = opts.automationId;
  if (opts.x !== undefined) args.X = opts.x;
  if (opts.y !== undefined) args.Y = opts.y;

  const result = await runScript<ClickResult>("uia-click-element.ps1", args);
  if (!result.success) throw new Error(result.error ?? "Failed to click element");
  return result.data!;
}

/**
 * Read text from UI elements in a window.
 */
export async function readText(opts: {
  windowTitle?: string;
  windowHandle?: number;
  name?: string;
  automationId?: string;
  allText?: boolean;
}): Promise<TextResult | TextResult[]> {
  const args: Record<string, string | number | boolean> = {};
  if (opts.windowTitle) args.WindowTitle = opts.windowTitle;
  if (opts.windowHandle) args.WindowHandle = opts.windowHandle;
  if (opts.name) args.Name = opts.name;
  if (opts.automationId) args.AutomationId = opts.automationId;
  if (opts.allText) args.AllText = true;

  const result = await runScript<TextResult | TextResult[]>("uia-read-text.ps1", args);
  if (!result.success) throw new Error(result.error ?? "Failed to read text");
  return result.data!;
}

/**
 * Send keyboard input to the focused window or a specific element.
 * Uses SendKeys syntax: {ENTER}, {TAB}, ^c (Ctrl+C), %{F4} (Alt+F4), etc.
 */
export async function sendKeys(opts: {
  keys: string;
  windowTitle?: string;
  windowHandle?: number;
  name?: string;
  automationId?: string;
}): Promise<SendKeysResult> {
  const args: Record<string, string | number> = {};
  args.Keys = opts.keys;
  if (opts.windowTitle) args.WindowTitle = opts.windowTitle;
  if (opts.windowHandle) args.WindowHandle = opts.windowHandle;
  if (opts.name) args.Name = opts.name;
  if (opts.automationId) args.AutomationId = opts.automationId;

  const result = await runScript<SendKeysResult>("uia-send-keys.ps1", args);
  if (!result.success) throw new Error(result.error ?? "Failed to send keys");
  return result.data!;
}

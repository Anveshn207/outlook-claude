/**
 * Screenshot capture service.
 */
import { runScript } from "./uia-powershell.js";

export interface ScreenshotResult {
  base64: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

/**
 * Capture a screenshot of the screen, a window, or a specific region.
 * Returns base64-encoded PNG image data.
 */
export async function captureScreenshot(opts?: {
  windowTitle?: string;
  windowHandle?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}): Promise<ScreenshotResult> {
  const args: Record<string, string | number> = {};
  if (opts?.windowTitle) args.WindowTitle = opts.windowTitle;
  if (opts?.windowHandle) args.WindowHandle = opts.windowHandle;
  if (opts?.x !== undefined) args.X = opts.x;
  if (opts?.y !== undefined) args.Y = opts.y;
  if (opts?.width) args.Width = opts.width;
  if (opts?.height) args.Height = opts.height;

  const result = await runScript<ScreenshotResult>("uia-screenshot.ps1", args, 15_000);
  if (!result.success) throw new Error(result.error ?? "Failed to capture screenshot");
  return result.data!;
}

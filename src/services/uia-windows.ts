/**
 * Window operations: list and focus windows.
 */
import { runScript } from "./uia-powershell.js";

export interface WindowInfo {
  title: string;
  handle: number;
  processId: number;
  className: string;
}

/**
 * List visible windows, optionally filtered by title substring.
 */
export async function listWindows(filter?: string): Promise<WindowInfo[]> {
  const args: Record<string, string> = {};
  if (filter) args.Filter = filter;

  const result = await runScript<WindowInfo[]>("uia-list-windows.ps1", args);
  if (!result.success) throw new Error(result.error ?? "Failed to list windows");
  return result.data!;
}

/**
 * Focus/activate a window by title, handle, or PID.
 */
export async function focusWindow(opts: {
  title?: string;
  handle?: number;
  processId?: number;
}): Promise<WindowInfo> {
  const args: Record<string, string | number> = {};
  if (opts.title) args.Title = opts.title;
  if (opts.handle) args.Handle = opts.handle;
  if (opts.processId) args.ProcessId = opts.processId;

  const result = await runScript<WindowInfo>("uia-focus-window.ps1", args);
  if (!result.success) throw new Error(result.error ?? "Failed to focus window");
  return result.data!;
}

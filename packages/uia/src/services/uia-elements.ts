/**
 * Element discovery: find elements and get element trees.
 */
import { runScript } from "./uia-powershell.js";

export interface ElementInfo {
  name: string;
  automationId: string;
  controlType: string;
  className: string;
  isEnabled: boolean;
  boundingRectangle: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Find UI elements in a window by name, AutomationId, or ControlType.
 */
export async function findElements(opts: {
  windowTitle?: string;
  windowHandle?: number;
  name?: string;
  automationId?: string;
  controlType?: string;
  maxResults?: number;
}): Promise<ElementInfo[]> {
  const args: Record<string, string | number> = {};
  if (opts.windowTitle) args.WindowTitle = opts.windowTitle;
  if (opts.windowHandle) args.WindowHandle = opts.windowHandle;
  if (opts.name) args.Name = opts.name;
  if (opts.automationId) args.AutomationId = opts.automationId;
  if (opts.controlType) args.ControlType = opts.controlType;
  if (opts.maxResults) args.MaxResults = opts.maxResults;

  const result = await runScript<ElementInfo[]>("uia-find-elements.ps1", args);
  if (!result.success) throw new Error(result.error ?? "Failed to find elements");
  return result.data!;
}

/**
 * Get a hierarchical element tree of a window.
 * Uses findElements with no filter and returns all elements (up to maxResults).
 */
export async function getElementTree(opts: {
  windowTitle?: string;
  windowHandle?: number;
  maxResults?: number;
}): Promise<ElementInfo[]> {
  return findElements({
    windowTitle: opts.windowTitle,
    windowHandle: opts.windowHandle,
    maxResults: opts.maxResults ?? 100,
  });
}

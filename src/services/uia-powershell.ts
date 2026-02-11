/**
 * PowerShell execution engine for UI Automation scripts.
 * Runs .ps1 scripts via child_process with JSON output parsing and timeout.
 */
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.join(__dirname, "..", "scripts");
const TIMEOUT_MS = 10_000;

export interface PsResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Run a PowerShell script and return parsed JSON result.
 * @param scriptName - Name of the .ps1 file (without path)
 * @param args - Key-value pairs to pass as -Name Value parameters
 * @param timeoutMs - Timeout in milliseconds (default 10s)
 */
export function runScript<T = unknown>(
  scriptName: string,
  args: Record<string, string | number | boolean> = {},
  timeoutMs = TIMEOUT_MS
): Promise<PsResult<T>> {
  return new Promise((resolve) => {
    const scriptPath = path.join(SCRIPTS_DIR, scriptName);

    const psArgs = [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy", "Bypass",
      "-File", scriptPath,
    ];

    for (const [key, value] of Object.entries(args)) {
      if (value === undefined || value === null || value === "") continue;
      if (typeof value === "boolean") {
        if (value) psArgs.push(`-${key}`);
      } else {
        psArgs.push(`-${key}`, String(value));
      }
    }

    execFile("powershell.exe", psArgs, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, _stderr) => {
      if (error) {
        // Timeout or execution error
        const msg = error.killed
          ? `Script timed out after ${timeoutMs}ms`
          : error.message;
        resolve({ success: false, error: msg });
        return;
      }

      const output = stdout.trim();
      if (!output) {
        resolve({ success: false, error: "No output from script" });
        return;
      }

      try {
        const parsed = JSON.parse(output) as PsResult<T>;
        resolve(parsed);
      } catch {
        resolve({ success: false, error: `Invalid JSON output: ${output.slice(0, 200)}` });
      }
    });
  });
}

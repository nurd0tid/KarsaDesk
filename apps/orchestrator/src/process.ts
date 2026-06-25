import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function runFile(file: string, args: string[], cwd?: string, allowFailure = false) {
  try {
    const result = await execFileAsync(file, args, {
      cwd,
      windowsHide: true,
      maxBuffer: 20 * 1024 * 1024,
      encoding: "utf8",
    });
    return { stdout: result.stdout.trim(), stderr: result.stderr.trim(), exitCode: 0 };
  } catch (error) {
    const value = error as Error & { stdout?: string; stderr?: string; code?: number };
    if (!allowFailure) {
      throw new Error((value.stderr || value.stdout || value.message).trim());
    }
    return {
      stdout: (value.stdout || "").trim(),
      stderr: (value.stderr || value.message).trim(),
      exitCode: typeof value.code === "number" ? value.code : 1,
    };
  }
}

export async function runGit(args: string[], cwd: string, allowFailure = false) {
  return runFile("git", args, cwd, allowFailure);
}

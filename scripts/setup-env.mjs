import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const target = new URL("../.env.local", import.meta.url);
const example = new URL("../.env.example", import.meta.url);
let content = existsSync(target) ? readFileSync(target, "utf8") : readFileSync(example, "utf8");
const secret = randomBytes(32).toString("hex");

function upsertEnv(name, value, shouldReplace = (current) => !current) {
  const expression = new RegExp(`^${name}=.*$`, "m");
  if (expression.test(content)) {
    content = content.replace(expression, (line) => {
      const current = line.slice(`${name}=`.length).trim();
      return shouldReplace(current) ? `${name}=${value}` : line;
    });
  } else {
    content += `\n${name}=${value}\n`;
  }
}

upsertEnv("VK_WEB_PORT", "3456", (current) => !current || current === "3000");
upsertEnv(
  "VK_ALLOWED_ORIGINS",
  "http://127.0.0.1:3456,http://localhost:3456",
  (current) => !current || current.includes(":3000"),
);

if (/^VK_LOCAL_SECRET=.*$/m.test(content)) {
  content = content.replace(/^VK_LOCAL_SECRET=.*$/m, (line) => {
    const current = line.slice("VK_LOCAL_SECRET=".length).trim();
    return current && !current.includes("change") && current.length >= 32 ? line : `VK_LOCAL_SECRET=${secret}`;
  });
} else {
  content += `\nVK_LOCAL_SECRET=${secret}\n`;
}

writeFileSync(target, content, { encoding: "utf8", mode: 0o600 });
process.stdout.write("Local environment is ready.\n");

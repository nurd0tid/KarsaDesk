import fs from 'fs';
import path from 'path';

const CONFIG_DIR = path.join(process.cwd(), '.vibeforge');
const CONFIG_FILE = path.join(CONFIG_DIR, 'providers.local.json');

export interface LocalProviderConfig {
  directApiKey?: string;
  [key: string]: any;
}

export type LocalConfigMap = Record<string, LocalProviderConfig>;

export function getLocalConfig(): LocalConfigMap {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return {};
    }
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) || {};
  } catch (error) {
    console.error('Error reading local config:', error);
    return {};
  }
}

export function saveLocalConfig(config: LocalConfigMap): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving local config:', error);
  }
}

export function getProviderLocalConfig(providerId: string | number): LocalProviderConfig | null {
  const config = getLocalConfig();
  return config[String(providerId)] || null;
}

export function setProviderLocalConfig(providerId: string | number, data: LocalProviderConfig): void {
  const config = getLocalConfig();
  config[String(providerId)] = {
    ...config[String(providerId)],
    ...data,
  };
  saveLocalConfig(config);
}

export function deleteProviderLocalConfig(providerId: string | number): void {
  const config = getLocalConfig();
  delete config[String(providerId)];
  saveLocalConfig(config);
}

export function resolveApiKey(
  providerId: string | number,
  mode: string,
  envName?: string,
  directKey?: string
): string {
  if (mode === 'env') {
    return envName ? process.env[envName] || '' : '';
  }
  if (mode === 'direct-local') {
    const local = getProviderLocalConfig(providerId);
    return local?.directApiKey || '';
  }
  if (mode === 'temporary') {
    return directKey || '';
  }
  return '';
}

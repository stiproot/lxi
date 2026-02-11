// src/services/env.service.ts
import { EnvKeys } from '@/types/env-keys';

export const ENV_VAR = (key: EnvKeys): string => {
  const value = (window as any).envconfig[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

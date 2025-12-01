/**
 * Environment variable utilities
 * Provides safe access to environment variables with validation
 */

/**
 * Require an environment variable to be set
 * Throws an error if the variable is missing or empty
 * 
 * @param key - Environment variable key
 * @returns The environment variable value
 * @throws Error if the variable is missing or empty
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get an environment variable with a default value
 * Returns the default if the variable is missing or empty
 * 
 * @param key - Environment variable key
 * @param defaultValue - Default value to return if variable is missing
 * @returns The environment variable value or default
 */
export function getEnv(key: string, defaultValue: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    return defaultValue;
  }
  return value;
}

/**
 * Get an optional environment variable
 * Returns undefined if the variable is missing or empty
 * 
 * @param key - Environment variable key
 * @returns The environment variable value or undefined
 */
export function getOptionalEnv(key: string): string | undefined {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    return undefined;
  }
  return value;
}


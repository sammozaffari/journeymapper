/**
 * When USE_MOCK_AI=true, AI routes return mock data instead of calling the API.
 * This allows testing the full UI flow without any API costs.
 */
export function isMockMode(): boolean {
  return process.env.USE_MOCK_AI === "true";
}

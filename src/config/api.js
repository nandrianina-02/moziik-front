export const API = 'https://moozik-gft1.onrender.com';
export const ANTHROPIC_CONFIG = {
  API_KEY: import.meta.env.VITE_ANTHROPIC_API_KEY || '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',
  VERSION: '2023-06-01',
  BASE_URL: 'https://api.anthropic.com/v1/messages',
  DEFAULT_MODEL: 'claude-3-5-sonnet-20240620'
};
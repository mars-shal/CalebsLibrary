// ESLint — Expo flat config (Phase 7a). Run with `npm run lint`.
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'scripts/*', 'convex/_generated/*'],
  },
  {
    rules: {
      // Production gates: no dead async work, no stray console in UI code.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];

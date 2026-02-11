// eslint.config.js
import mantine from 'eslint-config-mantine';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...mantine,
  { 
    ignores: [
      '**/*.{mjs,cjs,js,d.ts,d.mts}', 
      './.storybook/main.ts',
      '**/dist/**', // This should be relative to the ESLint config file
    ],
  },
  {
    rules: {
      'no-console': 'off', 
    },
  },
);

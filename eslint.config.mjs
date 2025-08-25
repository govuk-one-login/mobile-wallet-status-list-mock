import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier, // Disables ESLint rules that conflict with Prettier
  {
    rules: {
      // Turn off base ESLint rule to avoid conflicts with TypeScript version
      'no-unused-vars': 'off',
      // Use TypeScript-aware unused variables rule instead
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_' // Allow unused params prefixed with underscore (e.g., _context)
        }
      ]
    }
  }
);
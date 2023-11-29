module.exports = {
    env: {
        es2021: true,
        node: true,
        jest: true,
    },
    extends: ['airbnb-base', 'prettier'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint', 'import'],
    rules: {
        '@typescript-eslint/no-unused-vars': 'error',
        'no-unused-vars': 'off',
        'no-shadow': 'off',
        'class-methods-use-this': 'off',
        'no-console': 'warn',
        '@typescript-eslint/no-shadow': ['error'],
        'import/prefer-default-export': 0,
        'import/no-extraneous-dependencies': 0,
        'import/no-cycle': 0,
        'import/extensions': [
            'error',
            'ignorePackages',
            {
                js: 'never',
                jsx: 'never',
                ts: 'never',
                tsx: 'never',
            },
        ],
    },
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
            alias: {
                map: [['@src', './src']],
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
        react: {
            version: 'latest',
        },
    },
};

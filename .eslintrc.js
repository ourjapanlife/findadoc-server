/* eslint-disable-next-line no-undef */
module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        extraFileExtensions: [
            '.json'
        ]
    },
    env: {
        node: true,
        es6: true,
        jest: true
    },
    plugins: [
        '@typescript-eslint',
        'eslint-plugin-json'
    ],
    extends: [
        'eslint:recommended'
    ],
    root: true,

    globals: {},

    overrides: [
        {
            files: [
                '*.ts'
            ],
            extends: [
                'plugin:@typescript-eslint/recommended'
            ],
            parserOptions: {
                project: [
                    './tsconfig.json'
                ]
            }
        }
    ],

    // 'off' or 0 - turn the rule off
    // 'warn' or 1 - turn the rule on as a warning (doesn’t affect exit code)
    // 'error' or 2 - turn the rule on as an error (exit code will be 1)
    rules: {
        'block-scoped-var': 'error',
        complexity: ['error', { max: 40 }],
        'consistent-return': 'error',
        curly: 'error',
        'dot-location': ['error', 'property'],
        'dot-notation': ['error', { allowPattern: '^[a-z]+(_[a-z]+)+$' }],
        'no-alert': 'error',
        'no-multi-spaces': 'error',
        'no-redeclare': 'error',
        'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
        'vars-on-top': 'off',
        yoda: ['error', 'never', { exceptRange: true }],
        'no-console': 'warn', // allow debugging

        // Stylistic Issues and Opinions
        'arrow-body-style': 'error',
        'array-bracket-spacing': ['error', 'never'],
        'arrow-parens': ['error', 'as-needed'],
        'arrow-spacing': 'error',
        'block-spacing': ['error', 'always'],
        'brace-style': ['error', '1tbs', { allowSingleLine: true }],
        camelcase: 'error',
        'comma-dangle': ['error', 'never'],
        'comma-spacing': ['error', { before: false, after: true }],
        'comma-style': 'error',
        'computed-property-spacing': ['error', 'never'],
        'function-paren-newline': ['error', 'consistent'],
        indent: [
            'error',
            4,
            {
                MemberExpression: 1,
                SwitchCase: 1,
                ArrayExpression: 'first',
                ObjectExpression: 1,
                FunctionDeclaration: { parameters: 'off' },
                VariableDeclarator: { var: 2, let: 2, const: 3 },
                CallExpression: { arguments: 'first' }
            }
        ],
        'key-spacing': ['error', { beforeColon: false, afterColon: true }],
        'keyword-spacing': ['error', { before: true, after: true }],
        'linebreak-style': ['error', 'unix'], // no carriage returns
        'max-len': ['error', { code: 120 }], // be friendly to laptops
        'newline-after-var': 'error',
        'require-atomic-updates': 'warn', // I'd prefer warn
        'no-constant-condition': 'error',
        'no-dupe-class-members': 'error',
        'no-lonely-if': 'error',
        'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }], // let my people push enter!
        // 'no-prototype-builtins': 'off', // why would we need this off?
        'no-underscore-dangle': 'error',
        'no-var': 'error',
        // 'object-curly-spacing': ['error', 'always'], // always is so wide T________T
        'object-curly-newline': ['error', { consistent: true }],
        'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
        'object-shorthand': ['error', 'methods'],
        'operator-linebreak': [0, 'before'],
        'padded-blocks': ['error', 'never'],
        // 🤨 why do we need more blank lines?
        // 'padding-line-between-statements': 
        // ['error',{ blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        // { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        // { blankLine: 'always', prev: '*', next: 'return' }],
        'prefer-arrow-callback': 'error',
        'prefer-const': 'error',
        'prefer-spread': 'error',
        'prefer-template': 'error',
        'quote-props': ['error', 'as-needed'],
        quotes: ['error', 'single', 'avoid-escape'],
        'semi-spacing': 'error',
        'space-before-blocks': 'error',
        'space-before-function-paren': ['error', { anonymous: 'never', named: 'never', asyncArrow: 'always' }],
        'space-in-parens': 'error',
        'space-infix-ops': 'error',
        semi: ['error'], // personally i like them and it's safer, but can discuss

        // Variables
        'no-shadow': 'error'
    },
    ignorePatterns: [
        'src/typeDefs/gqlTypes.ts'
    ]
};
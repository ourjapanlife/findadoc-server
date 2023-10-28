import globals from 'globals'
import ts from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import * as graphqlESLint from '@graphql-eslint/eslint-plugin'
import jsonPlugin from 'eslint-plugin-json'
import eslintJsPlugin from '@eslint/js'

const gqlSchemaPath = './src/typeDefs/schema.graphql'

export default [
    // GraphQL Linter for Operations and Fragments within code files
    {
        files: [
            '__tests__/*.ts',
            'src/*.ts'
        ],
        // Setup processor for operations/fragments definitions on code-files
        processor: graphqlESLint.processors.graphql,
        languageOptions: {
            parser: graphqlESLint,
            parserOptions: {
                schema: gqlSchemaPath
            }
        },
        plugins: {
            '@graphql-eslint': graphqlESLint
        },
        rules: {
            '@graphql-eslint/no-anonymous-operations': 'error',
            '@graphql-eslint/no-duplicate-fields': 'error',
            '@graphql-eslint/no-unreachable-types': 'error'
        },
        ...graphqlESLint.flatConfigs['operations-recommended']
    },
    // GraphQL Linter for Schema files
    {
        // Setup GraphQL Parser
        files: ['src/**/*.{graphql,gql}'],
        plugins: {
            '@graphql-eslint': graphqlESLint
        },
        languageOptions: {
            parser: graphqlESLint,
            parserOptions: {
                schema: gqlSchemaPath
            }
        },
        ...graphqlESLint.flatConfigs['schema-recommended']
    },
    // JSON Linter
    {
        ...jsonPlugin.configs.recommended,
        files: [
            '*.json'
        ],
        plugins: {
            jsonPlugin: jsonPlugin
        }
        // rules: {
        //     'json/*': [
        //         'error',
        //         {
        //             allowComments: true,
        //             allowTrailingCommas: true,
        //             allowTemplateLiterals: true
        //         }
        //     ]
        // }
    },
    // Typescript and JS Linter combined (for all the main code files)
    {
        languageOptions: {
            parser: tsParser,
            // sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.es6,
                ...globals.jest
            }
        },
        plugins: {
            '@typescript-eslint': ts,
            ts
        },
        ignores: [
            'src/typeDefs/gqlTypes.ts',
            'typesgeneratorconfig.ts',
            'dist'
        ],
        // 'off' or 0 - turn the rule off
        // 'warn' or 1 - turn the rule on as a warning (doesn’t affect exit code)
        // 'error' or 2 - turn the rule on as an error (exit code will be 1)
        rules: {
            // TS specific rules
            ...ts.configs['eslint-recommended'].rules,
            ...ts.configs.recommended.rules,
            '@typescript-eslint/no-shadow': 'error',

            // JS specific rules
            ...eslintJsPlugin.configs.recommended.rules,
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
            camelcase: ['error', { allow: ['639_3'] }],
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
            'max-len': ['error', {
                code: 120,
                ignoreComments: true,
                ignoreTrailingComments: true,
                ignoreUrls: true,
                ignoreStrings: true,
                ignoreTemplateLiterals: true,
                ignoreRegExpLiterals: true
            }], // be friendly to laptops
            'newline-after-var': 'error',
            'require-atomic-updates': 'warn',
            'no-constant-condition': 'error',
            'no-dupe-class-members': 'error',
            'no-lonely-if': 'error',
            'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
            'no-underscore-dangle': 'error',
            'no-var': 'error',
            'object-curly-newline': ['error', { consistent: true }],
            'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
            'object-shorthand': ['error', 'methods'],
            'operator-linebreak': [0, 'before'],
            'padded-blocks': ['error', 'never'],
            'prefer-arrow-callback': 'error',
            'prefer-const': 'error',
            'prefer-spread': 'error',
            'prefer-template': 'error',
            'quote-props': ['error', 'as-needed'],
            quotes: ['error', 'single', 'avoid-escape'],
            semi: ['error', 'never'],
            'semi-spacing': 'error',
            'space-before-blocks': 'error',
            'space-before-function-paren': ['error', { anonymous: 'never', named: 'never', asyncArrow: 'always' }],
            'space-in-parens': 'error',
            'space-infix-ops': 'error'
        }
    }
]

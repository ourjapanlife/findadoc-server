import esbuild from 'esbuild'

esbuild
    .build({
        entryPoints: ['./src/index.ts'],  // Your main TypeScript file
        outfile: 'dist/index.js',         // Output file
        bundle: true,                     // Bundle everything into a single file
        platform: 'node',                 // Target environment is Node.js
        format: 'esm',                    // Use ESM format
        loader: { '.node': 'file' },      // Handle .node files properly
        packages: 'external',             // Treat all node_modules packages as external
        conditions: ['node'],             // Ensure Node.js package conditions are used
    })
    .catch(() => process.exit(1))         // Exit on build error


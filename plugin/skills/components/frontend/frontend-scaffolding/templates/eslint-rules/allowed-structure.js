const allowedRootFiles = new Set([
  'index.ts',
  'main.tsx',
  'app.tsx',
  'vite-env.d.ts',
  'index.css',
]);

const allowedDirs = new Set([
  'components',
  'hooks',
  'lib',
  'pages',
  'routes',
  'services',
  'types',
]);

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce allowed src/ directory structure (D18)',
    },
    messages: {
      disallowed:
        'File is in a disallowed location. Allowed src/ subdirectories: components/, hooks/, lib/, pages/, routes/, services/, types/. Allowed root files: index.ts, main.tsx, app.tsx, vite-env.d.ts, index.css.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    const srcIndex = filename.lastIndexOf('/src/');
    if (srcIndex === -1) return {};

    const relativePath = filename.slice(srcIndex + 5);

    // Root-level file in src/?
    if (!relativePath.includes('/') && allowedRootFiles.has(relativePath)) {
      return {};
    }

    // In an allowed directory?
    const topDir = relativePath.split('/')[0];
    if (allowedDirs.has(topDir)) {
      return {};
    }

    return {
      Program(node) {
        context.report({ node, messageId: 'disallowed' });
      },
    };
  },
};

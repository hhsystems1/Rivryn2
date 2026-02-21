import fs from 'fs/promises';
import path from 'path';

type TemplateKind = 'react-ts' | 'react-js' | 'nextjs';

export async function scaffoldStarterProject(projectPath: string, template?: string): Promise<void> {
  await fs.mkdir(projectPath, { recursive: true });

  const normalized = normalizeTemplate(template);
  if (normalized === 'nextjs') {
    await writeNextProject(projectPath);
    return;
  }

  if (normalized === 'react-js') {
    await writeReactJsProject(projectPath);
    return;
  }

  await writeReactTsProject(projectPath);
}

function normalizeTemplate(template?: string): TemplateKind {
  const value = (template || '').toLowerCase();
  if (value.includes('next')) {
    return 'nextjs';
  }
  if (value.includes('react') && value.includes('js') && !value.includes('ts')) {
    return 'react-js';
  }
  return 'react-ts';
}

async function writeFiles(root: string, files: Record<string, string>): Promise<void> {
  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(root, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }
}

async function writeReactTsProject(root: string): Promise<void> {
  await writeFiles(root, {
    'package.json': `{
  "name": "app",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "typescript": "^5.6.3",
    "vite": "^5.4.8"
  }
}
`,
    'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
`,
    'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
    'src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    'src/App.tsx': `export default function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Welcome to your new React app</h1>
      <p>Start building in src/App.tsx.</p>
    </main>
  );
}
`,
    'src/index.css': `:root {
  color-scheme: dark;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
}
`,
    'README.md': `# Starter React TypeScript App

Run:

\`\`\`bash
npm install
npm run dev
\`\`\`
`
  });
}

async function writeReactJsProject(root: string): Promise<void> {
  await writeFiles(root, {
    'package.json': `{
  "name": "app",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.3",
    "vite": "^5.4.8"
  }
}
`,
    'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
    'vite.config.js': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
    'src/main.jsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    'src/App.jsx': `export default function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Welcome to your new React app</h1>
      <p>Start building in src/App.jsx.</p>
    </main>
  );
}
`
  });
}

async function writeNextProject(root: string): Promise<void> {
  await writeFiles(root, {
    'package.json': `{
  "name": "app",
  "private": true,
  "version": "0.0.1",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
`,
    'pages/index.tsx': `export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Welcome to your Next.js app</h1>
      <p>Edit pages/index.tsx to begin.</p>
    </main>
  );
}
`
  });
}

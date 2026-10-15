export interface TemplateFile {
  name: string;
  language: string;
  content: string;
}

export interface Template {
  id: string;
  label: string;
  files: TemplateFile[];
}

export const TEMPLATES: Record<string, Template> = {
  blank: {
    id: 'blank',
    label: 'Blank',
    files: [{ name: 'README.md', language: 'markdown', content: '# Welcome\n\nStart coding!' }],
  },
  node: {
    id: 'node',
    label: 'Node.js',
    files: [
      {
        name: 'index.js',
        language: 'javascript',
        content: "const express = require('express');\nconst app = express();\n\napp.get('/', (req, res) => res.send('Hello World'));\n\napp.listen(3000, () => console.log('Server on :3000'));\n",
      },
      { name: 'package.json', language: 'json', content: '{\n  "name": "app",\n  "version": "1.0.0",\n  "main": "index.js"\n}\n' },
      { name: 'README.md', language: 'markdown', content: '# Node.js App\n\nRun: `node index.js`\n' },
    ],
  },
  react: {
    id: 'react',
    label: 'React',
    files: [
      {
        name: 'App.jsx',
        language: 'javascript',
        content: "export default function App() {\n  return <h1>Hello React</h1>;\n}\n",
      },
      { name: 'index.jsx', language: 'javascript', content: "import { createRoot } from 'react-dom/client';\nimport App from './App';\n\ncreateRoot(document.getElementById('root')).render(<App />);\n" },
      { name: 'README.md', language: 'markdown', content: '# React App\n' },
    ],
  },
  python: {
    id: 'python',
    label: 'Python',
    files: [
      { name: 'main.py', language: 'python', content: 'def main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n' },
      { name: 'README.md', language: 'markdown', content: '# Python Project\n\nRun: `python main.py`\n' },
    ],
  },
};

export const getTemplate = (id?: string): Template => TEMPLATES[id || 'blank'] || TEMPLATES.blank;
export const listTemplates = () => Object.values(TEMPLATES).map((t) => ({ id: t.id, label: t.label }));

const fs = require('fs');
const path = './src/components/DocumentRenderer.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/background: \`radial-gradient/g, "backgroundImage: `radial-gradient");
fs.writeFileSync(path, content);

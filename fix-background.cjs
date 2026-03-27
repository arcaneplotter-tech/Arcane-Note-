const fs = require('fs');
const path = './src/components/DocumentRenderer.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/background: theme === 'prism' \? `linear-gradient/g, "backgroundImage: theme === 'prism' ? `linear-gradient");
content = content.replace(/background: isImportant && theme === 'prism' \? `linear-gradient/g, "backgroundImage: isImportant && theme === 'prism' ? `linear-gradient");
content = content.replace(/background: \`linear-gradient/g, "backgroundImage: `linear-gradient");
fs.writeFileSync(path, content);

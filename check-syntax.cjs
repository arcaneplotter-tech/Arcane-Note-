const fs = require('fs');
const html = fs.readFileSync('test.html', 'utf8');
const scriptMatch = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
if (scriptMatch) {
  const scriptContent = scriptMatch[1];
  try {
    const babel = require('@babel/core');
    babel.transformSync(scriptContent, { presets: ['@babel/preset-react'] });
    console.log('Syntax OK');
  } catch (e) {
    console.error('Syntax Error:', e.message);
  }
} else {
  console.log('No script found');
}

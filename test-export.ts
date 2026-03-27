import { generatePresentationHTML } from './src/utils/exportToHTML';
import fs from 'fs';

const items = [
  { TYPE: 'TITLE', CONTENT: 'Hello World' },
  { TYPE: 'CONCEPT', CONTENT: 'Test', TOPIC: 'Test' }
];

const html = generatePresentationHTML(items, 'modern');
fs.writeFileSync('test.html', html);
console.log('Done');

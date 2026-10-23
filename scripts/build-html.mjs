// Converte as páginas HTML em um módulo TypeScript (sem depender de ?raw do Vite).
import { readFileSync, writeFileSync } from 'node:fs';
const pages = { HOME: 'app/home.html', PROJECTS: 'app/projects.html', PRIVACY: 'app/privacy.html', JOURNEY: 'app/island.html' };
let out = '// Arquivo gerado por scripts/build-html.mjs a partir de app/*.html. Não edite à mão.\n';
for (const [name, file] of Object.entries(pages)) out += `export const ${name}: string = ${JSON.stringify(readFileSync(file, 'utf8'))};\n`;
writeFileSync('lib/html-pages.generated.ts', out);
console.log('html-pages.generated.ts atualizado');

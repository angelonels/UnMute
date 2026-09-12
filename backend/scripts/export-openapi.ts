import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from '../src/app';
import { openApiInfo } from '../src/core/openapi';

const spec = app.getOpenAPI31Document(openApiInfo);
const outFile = resolve(fileURLToPath(new URL('../openapi/openapi.json', import.meta.url)));

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(spec, null, 2) + '\n');
console.log('Wrote ' + outFile);

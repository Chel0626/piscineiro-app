#!/usr/bin/env node
/**
 * Script para verificar imports quebrados no projeto
 * 
 * Uso: node scripts/check-broken-imports.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Extrai imports de um arquivo
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    
    const importRegex = /import\s+.*?\s+from\s+['"](@\/[^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push({
        path: match[1],
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    return imports;
  } catch (e) {
    return [];
  }
}

// Verifica se import existe
function checkImportExists(importPath) {
  const actualPath = importPath.replace('@/', '');
  const fullPath = path.join(srcDir, actualPath);
  
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
  for (const ext of extensions) {
    if (fs.existsSync(fullPath + ext)) {
      return true;
    }
  }
  
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      for (const ext of extensions) {
        if (fs.existsSync(path.join(fullPath, 'index' + ext))) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Percorre diretório
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      callback(filePath);
    }
  });
}

console.log(`${colors.blue}=== Verificando Imports Quebrados ===${colors.reset}\n`);

let brokenCount = 0;
let totalCount = 0;

walkDir(srcDir, (filePath) => {
  const imports = extractImports(filePath);
  imports.forEach(({ path: importPath, line }) => {
    totalCount++;
    if (!checkImportExists(importPath)) {
      brokenCount++;
      const relPath = filePath.replace(srcDir, 'src');
      console.log(`${colors.red}QUEBRADO: ${relPath}:${line}${colors.reset}`);
      console.log(`  Import: ${importPath}\n`);
    }
  });
});

console.log(`${colors.blue}=== Resumo ===${colors.reset}`);
console.log(`Total de imports verificados: ${totalCount}`);
console.log(`Imports quebrados encontrados: ${brokenCount}\n`);

if (brokenCount === 0) {
  console.log(`${colors.green}✅ Todos os imports dos módulos estão conectados corretamente!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Alguns imports estão quebrados e precisam ser corrigidos!${colors.reset}\n`);
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Script para verificar dependências circulares no projeto
 * 
 * Uso: node scripts/check-circular-dependencies.js
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
      imports.push(match[1]);
    }
    
    return imports;
  } catch (e) {
    return [];
  }
}

// Resolve path de import para arquivo real
function resolveImport(importPath) {
  const actualPath = importPath.replace('@/', '');
  const fullPath = path.join(srcDir, actualPath);
  
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  for (const ext of extensions) {
    if (fs.existsSync(fullPath + ext)) {
      return fullPath + ext;
    }
  }
  
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      for (const ext of extensions) {
        const indexPath = path.join(fullPath, 'index' + ext);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }
  }
  
  return null;
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

// Constrói grafo de dependências
const depGraph = new Map();
walkDir(srcDir, (filePath) => {
  const imports = extractImports(filePath);
  const resolvedImports = imports
    .map(imp => resolveImport(imp))
    .filter(imp => imp !== null);
  depGraph.set(filePath, resolvedImports);
});

// Verifica dependências circulares
function findCircular(node, visited = new Set(), path = []) {
  if (path.includes(node)) {
    return path.slice(path.indexOf(node)).concat(node);
  }
  
  if (visited.has(node)) {
    return null;
  }
  
  visited.add(node);
  const deps = depGraph.get(node) || [];
  
  for (const dep of deps) {
    const circular = findCircular(dep, visited, [...path, node]);
    if (circular) {
      return circular;
    }
  }
  
  return null;
}

console.log(`${colors.blue}=== Verificando Dependências Circulares ===${colors.reset}\n`);

const circulars = new Set();
depGraph.forEach((deps, file) => {
  const circular = findCircular(file);
  if (circular) {
    const key = circular
      .map(f => f.replace(srcDir + '/', 'src/'))
      .sort()
      .join('->');
    circulars.add(key);
  }
});

if (circulars.size === 0) {
  console.log(`${colors.green}✅ Nenhuma dependência circular encontrada!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ Encontradas ${circulars.size} cadeias de dependências circulares:${colors.reset}\n`);
  circulars.forEach(chain => {
    console.log(`${colors.yellow}${chain}${colors.reset}\n`);
  });
  process.exit(1);
}

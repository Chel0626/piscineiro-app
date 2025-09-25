#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const apiBackupDir = path.join(process.cwd(), 'api-backup-temp');

function moveDirectory(source, destination) {
  if (fs.existsSync(source)) {
    // Criar diretório de destino se não existir
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    if (fs.existsSync(destination)) {
      fs.rmSync(destination, { recursive: true, force: true });
    }
    fs.renameSync(source, destination);
    console.log(`Moved ${source} to ${destination}`);
  }
}

// Diretorios adicionais para mover (rotas dinâmicas)
const dynamicRoutes = [
  {
    source: path.join(process.cwd(), 'src', 'app', 'dashboard', 'clientes', '[id]'),
    backup: path.join(process.cwd(), 'dynamic-backup-temp', 'dashboard-clientes-id')
  }
];

// Verificar se é para preparar ou restaurar
const action = process.argv[2];

if (action === 'prepare') {
  console.log('Preparando build mobile - movendo pasta api e rotas dinâmicas...');
  moveDirectory(apiDir, apiBackupDir);
  
  // Mover rotas dinâmicas
  dynamicRoutes.forEach(route => {
    moveDirectory(route.source, route.backup);
  });
} else if (action === 'restore') {
  console.log('Restaurando pasta api e rotas dinâmicas...');
  moveDirectory(apiBackupDir, apiDir);
  
  // Restaurar rotas dinâmicas
  dynamicRoutes.forEach(route => {
    moveDirectory(route.backup, route.source);
  });
} else {
  console.log('Uso: node prepare-mobile-build.js [prepare|restore]');
  process.exit(1);
}
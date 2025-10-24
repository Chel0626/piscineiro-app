#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const nextConfigPath = path.join(__dirname, '..', 'next.config.mjs');
const nextConfigBackupPath = path.join(__dirname, '..', 'next.config.mjs.backup');

const mobileConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
`;

const command = process.argv[2];

if (command === 'prepare') {
  console.log('📱 Preparando configuração para build mobile...');
  
  // Backup da configuração atual
  if (fs.existsSync(nextConfigPath)) {
    fs.copyFileSync(nextConfigPath, nextConfigBackupPath);
    console.log('✅ Backup do next.config.mjs criado');
  }
  
  // Sobrescreve com configuração mobile
  fs.writeFileSync(nextConfigPath, mobileConfig);
  console.log('✅ Configuração mobile aplicada');
  
} else if (command === 'restore') {
  console.log('🔄 Restaurando configuração original...');
  
  // Restaura backup
  if (fs.existsSync(nextConfigBackupPath)) {
    fs.copyFileSync(nextConfigBackupPath, nextConfigPath);
    fs.unlinkSync(nextConfigBackupPath);
    console.log('✅ Configuração original restaurada');
  } else {
    console.log('⚠️  Nenhum backup encontrado para restaurar');
  }
  
} else {
  console.error('❌ Comando inválido. Use: prepare ou restore');
  process.exit(1);
}

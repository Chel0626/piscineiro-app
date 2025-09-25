#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Ler package.json para obter a versão
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// Obter build number do GitHub Actions ou usar timestamp local
const buildNumber = process.env.GITHUB_RUN_NUMBER || Date.now().toString().slice(-6);

// Atualizar android/app/build.gradle com a versão
const gradlePath = path.join('android', 'app', 'build.gradle');

if (fs.existsSync(gradlePath)) {
  let gradleContent = fs.readFileSync(gradlePath, 'utf8');
  
  // Atualizar versionCode e versionName
  gradleContent = gradleContent.replace(
    /versionCode\s+\d+/,
    `versionCode ${buildNumber}`
  );
  
  gradleContent = gradleContent.replace(
    /versionName\s+"[^"]*"/,
    `versionName "${version}"`
  );
  
  fs.writeFileSync(gradlePath, gradleContent);
  console.log(`✅ Versão atualizada: ${version} (build ${buildNumber})`);
} else {
  console.log('⚠️  Arquivo build.gradle não encontrado');
}
# 🔧 Configuração do CI/CD para APK

## 🚀 O que foi configurado:

O pipeline automatiza:
- ✅ Build do APK a cada push na branch `main`
- ✅ Release automático no GitHub
- ✅ Versionamento baseado no package.json + build number
- ✅ Upload do APK para download

## 🔐 Secrets necessários no GitHub:

Vá em: **Repositório → Settings → Secrets and variables → Actions**

Adicione estes secrets:

```bash
FIREBASE_API_KEY=sua_firebase_api_key
FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
FIREBASE_PROJECT_ID=seu_projeto_id
FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
GEMINI_API_KEY=sua_gemini_api_key
```

## 📱 Como funciona:

### **1. Trigger automático:**
- Push na `main` → Build inicia automaticamente
- Também pode ser executado manualmente em Actions

### **2. Processo de build:**
```bash
npm run build:mobile  # Build estático Next.js
npx cap sync android  # Sincronizar com Android
./gradlew assembleDebug  # Gerar APK
```

### **3. Release automático:**
- Cria tag: `v0.1.0-build123`
- Anexa APK: `piscineiro-app-v0.1.0-build123.apk`
- Descrição com changelog automático

## 📥 Como baixar APK:

1. Vá em **Releases** no GitHub
2. Baixe o APK mais recente
3. Instale no Android

## 🛠️ Comandos úteis:

```bash
# Build local para testar
npm run build:mobile

# Executar pipeline manualmente
# GitHub → Actions → Build Android APK → Run workflow
```

## 🎯 Próximos passos:

1. **Configurar secrets** (acima)
2. **Fazer push** para testar
3. **Verificar release** gerado
4. **Baixar e testar APK**

---

## 🔄 Fluxo completo:

```
Push → GitHub Actions → Build → APK → Release → Download
  ↓         ↓            ↓       ↓       ↓         ↓
main    Ubuntu VM    Next.js  Android  v1.0.0   📱 Install
```
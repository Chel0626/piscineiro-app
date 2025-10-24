# 📱 Build de Apps Mobile - Piscineiro App

Este projeto usa GitHub Actions para buildar automaticamente APK (Android) e IPA (iOS).

## 🚀 Como funciona

### Build Automático
Toda vez que você faz push para `main`, o GitHub Actions:
1. Builda o Next.js para mobile
2. Gera APK para Android
3. Gera IPA para iOS (requer Mac)
4. Disponibiliza os arquivos para download

### Build Manual
Você pode rodar o workflow manualmente:
1. Vá para: **GitHub → Actions → Build Mobile Apps**
2. Clique em "**Run workflow**"
3. Aguarde o build terminar
4. Baixe os arquivos na seção "**Artifacts**"

## ⚙️ Configurar Secrets no GitHub

Para o build funcionar, você precisa adicionar as variáveis de ambiente no GitHub:

1. **Vá para:** `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

2. **Adicione cada secret:**

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDGKHR3euT4E3nbujQ3DWeFskYz-_uPDVo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=piscineiro-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=piscineiro-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=piscineiro-app.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=848192279894
NEXT_PUBLIC_FIREBASE_APP_ID=1:848192279894:web:bc544e22456fe278d9b2f7
```

## 📥 Baixar os Apps

Após o build:

1. **GitHub → Actions** → Clique no workflow executado
2. Role até "**Artifacts**"
3. Baixe:
   - `piscineiro-app-android.apk` (Android)
   - `piscineiro-app-ios.ipa` (iOS)

## 📲 Instalar no Celular

### Android (APK):
1. Transfira o APK para o celular
2. Habilite "Fontes desconhecidas" nas configurações
3. Abra o arquivo e instale

### iOS (IPA):
#### Opção 1: iTunes (Windows)
1. Conecte o iPhone no computador
2. Abra o iTunes
3. Vá em: Dispositivo → Apps → Arquivo → Adicionar arquivo
4. Selecione o `.ipa`
5. Sincronize

#### Opção 2: AltStore / Sideloadly (Mac/Windows)
1. Instale AltStore ou Sideloadly
2. Conecte o iPhone
3. Arraste o `.ipa` para o programa
4. Confirme a instalação

## 🛠️ Build Local

### Android:
```bash
npm run build:mobile
npx cap sync android
cd android
./gradlew assembleRelease
```

APK estará em: `android/app/build/outputs/apk/release/`

### iOS:
```bash
npm run build:mobile
npx cap sync ios
npx cap open ios
```

Depois builde no Xcode: **Product → Archive → Export**

## ⚠️ Notas Importantes

### Para iOS:
- Build no GitHub Actions requer certificado de desenvolvedor Apple
- Para builds de desenvolvimento, você pode buildar localmente no Xcode
- Para distribuição (TestFlight/App Store), configure os certificados no GitHub Secrets

### Para Android:
- APK gerado é **não assinado** (desenvolvimento)
- Para Google Play Store, você precisa assinar o APK
- Configure keystore no GitHub Secrets para builds assinados

## 🔧 Troubleshooting

### "Build failed" no GitHub Actions:
- Verifique se todos os secrets estão configurados
- Veja os logs do Actions para erro específico

### APK não instala:
- Verifique se "Fontes desconhecidas" está habilitado
- Certifique-se que é compatível com sua versão do Android

### IPA não instala:
- Verifique se o certificado de desenvolvedor está configurado
- Use AltStore para instalação sem iTunes

## 📚 Links Úteis

- [Capacitor Docs](https://capacitorjs.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [AltStore](https://altstore.io/)
- [Sideloadly](https://sideloadly.io/)

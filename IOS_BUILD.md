# 🍎 Build iOS Local

## Por que não tem build automático de iOS?

O build iOS no GitHub Actions falhou porque requer:
- **Apple Developer Account** - US$ 99/ano
- **Certificado de assinatura** (código signing)
- **Provisioning Profile**

## Como fazer build iOS localmente

### Pré-requisitos
- 🍎 macOS com Xcode instalado
- 💳 Apple Developer Account (US$ 99/ano)
- 📱 iPhone/iPad para testes (opcional)

### Passos

1. **Sync do Capacitor**
```bash
npx cap sync ios
```

2. **Abrir no Xcode**
```bash
npx cap open ios
```

3. **No Xcode:**
   - Selecione o target "App"
   - Vá em "Signing & Capabilities"
   - Selecione seu "Team" (Apple Developer Account)
   - Configure o "Bundle Identifier" único (ex: `com.seudominio.piscineiro`)

4. **Build:**
   - Product → Archive
   - Distribute App → Ad Hoc / App Store
   - Follow the wizard

### Alternativa: TestFlight (Recomendado)

Se você tem Apple Developer Account:

1. Configure signing no Xcode
2. Archive o app (Product → Archive)
3. Upload para TestFlight
4. Convide testadores via email
5. Eles instalam pelo TestFlight app

**Vantagem:** Não precisa conectar iPhone no Mac!

## Opções Sem Apple Developer Account

### 1. PWA (Progressive Web App) ✅ **Recomendado**
- Funciona no iOS Safari
- "Adicionar à Tela Inicial"
- Funciona offline com Service Worker
- **Grátis!**

### 2. Build apenas Android
- Android não requer conta paga
- APK disponível no GitHub Actions automaticamente
- Pode distribuir direto (sem Google Play)

### 3. Expo (se migrar para React Native)
- Expo Go app permite testar sem developer account
- Mas distribuição final ainda precisa de conta

## Resumo

| Plataforma | Custo | Build Automático | Distribuição |
|------------|-------|------------------|--------------|
| **Android** | Grátis | ✅ Sim (GitHub Actions) | APK direto |
| **iOS** | $99/ano | ❌ Não (precisa conta) | TestFlight/App Store |
| **PWA** | Grátis | ✅ Sim (Vercel) | URL web |

## Recomendação

Para começar:
1. ✅ Use o **APK Android** do GitHub Actions
2. ✅ Compartilhe o **PWA** via URL para usuários iOS
3. ⏳ Quando tiver budget, compre Apple Developer Account para iOS nativo

O PWA funciona muito bem no iOS e não custa nada! 🎉

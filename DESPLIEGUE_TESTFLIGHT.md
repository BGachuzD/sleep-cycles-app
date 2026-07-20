# Despliegue a TestFlight — Mimebien

Instructivo paso a paso. Estado del código al 2026-07-11: typecheck limpio, expo-doctor 18/18, bloqueadores corregidos (timezone, race condition de alarmas, purpose string de HealthKit, dependencias alineadas). Branch: `healthkit`.

> **Prerrequisito general:** membresía activa del [Apple Developer Program](https://developer.apple.com/programs/enroll) ($99 USD/año). Si aún no la tienes, inicia la inscripción primero — la activación tarda 24-48 h y bloquea los pasos 4 en adelante.

---

## Paso 0 — Antes de empezar (5 min)

- [ ] Verifica que estás en el branch correcto y sin cambios sin guardar:
  ```bash
  git status
  ```
- [ ] Dependencias frescas:
  ```bash
  pnpm install
  pnpm typecheck        # debe salir sin errores
  ```
- [ ] Login en EAS (cuenta expo `bgachuzd`):
  ```bash
  npx eas login
  npx eas whoami        # confirma la cuenta
  ```

---

## Paso 1 — Probar en tu iPhone físico (recomendado, ~1 h)

Los módulos nativos nuevos (`expo-haptics`, `expo-font`) invalidan tu dev client anterior: **necesitas un dev build nuevo**.

```bash
npx eas build --platform ios --profile development
```

Cuando termine, instala el build en tu iPhone (escanea el QR que da EAS) y corre el servidor:

```bash
pnpm start
```

**Checklist de validación en el dispositivo:**

- [ ] **HealthKit**: conectar desde el banner en Diario o Estadísticas. Acepta los permisos y confirma que el estado en Configuración → Apple Salud diga "Conectado".
  - ⚠️ **Riesgo conocido**: si tras aceptar sigue diciendo "No conectado", el check de permisos read-only está fallando (limitación de `authorizationStatusFor` de Apple). Hay fix identificado — pedirlo a Claude Code antes de continuar.
- [ ] **Alarma inteligente con modo Sueño**: programa una alarma desde "Dormir ahora" con ventana a 2-3 min, activa el Focus "Sueño" y verifica que la notificación sí suena (gracias al entitlement time-sensitive nuevo).
- [ ] **Recordatorio diario**: revisa en la pantalla Notificaciones que exista el recordatorio "¿Cómo dormiste?".
- [ ] **Selector Hoy/Ayer** en el diario: registra una noche de "Ayer" y confirma la fecha en el historial.
- [ ] **Haptics**: vibración ligera en botones, vibración de éxito al guardar registro.
- [ ] **Pull-to-refresh** en Diario y Estadísticas.
- [ ] Flujo completo: registro → onboarding → perfil → home → guardar noche → stats.

---

## Paso 2 — Variables de entorno en EAS (5 min) ⚠️ OBLIGATORIO

`.env` está en `.gitignore` y **no se sube al build**. Sin este paso, el build de producción **crashea al abrir** (el cliente de Supabase lanza error al no encontrar las variables).

Los valores están en tu archivo `.env` local:

```bash
npx eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value "https://xdmazedmeeyaxjwyckoz.supabase.co" --visibility plaintext

npx eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<pega aquí la anon key de tu .env>" --visibility plaintext
```

> La anon key es pública por diseño (la seguridad real es RLS en Postgres), por eso `plaintext` está bien.

Verifica:
```bash
npx eas env:list --environment production
```

---

## Paso 3 — Supabase dashboard (2 min)

- [ ] Entra a [supabase.com/dashboard](https://supabase.com/dashboard) → proyecto `xdmazedmeeyaxjwyckoz` → **Authentication → URL Configuration**.
- [ ] Agrega `mimebien://reset-password` en **Redirect URLs**.

Sin esto, el correo de recuperación de contraseña no redirige de vuelta a la app.

---

## Paso 4 — Crear la app en App Store Connect (15 min)

En [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps → + → New App**:

| Campo | Valor |
|---|---|
| Platform | iOS |
| Name | **Mimebien** (verifica disponibilidad; máx. 30 caracteres) |
| Primary language | Spanish (Mexico) |
| Bundle ID | `com.bgachuzd.mimebien` ⚠️ **inmutable** — confírmalo como definitivo |
| SKU | `mimebien-ios-001` |
| User Access | Full Access |

> Si el Bundle ID no aparece en la lista, no pasa nada: EAS lo registra automáticamente en el paso 5 y luego regresas aquí.

---

## Paso 5 — Build de producción y submit (~1 h, mayormente espera)

```bash
npx eas build --platform ios --profile production
```

La **primera vez** te pedirá iniciar sesión con tu Apple ID. Di que sí a todo lo que ofrezca generar (certificado de distribución, provisioning profile). EAS habilita solo las capabilities de **HealthKit** y **Time-Sensitive Notifications** a partir de los entitlements de `app.json`. El build tarda ~15-40 min en la cola de EAS.

Cuando termine:

```bash
npx eas submit --platform ios --latest
```

Te pedirá autenticación con App Store Connect. **Recomendado**: elige la opción de **API Key** (la genera y guarda para siempre; no vuelves a autenticarte).

---

## Paso 6 — Configurar TestFlight (15 min + espera)

1. En App Store Connect → tu app → pestaña **TestFlight**.
2. Espera a que el build pase de "Processing" (15 min – 2 h; te llega un correo).
3. La pregunta de **Export Compliance** ya está resuelta por configuración (`ITSAppUsesNonExemptEncryption: false`) — no debería aparecer.
4. **Testers internos** (sin revisión de Apple, hasta 100):
   - Users and Access → invita a cada tester con su email de Apple ID (rol mínimo: Developer o usa "App Store Connect Users" group en TestFlight).
   - TestFlight → Internal Testing → **+** → crea el grupo y asigna el build.
5. A los testers les llega invitación por correo → instalan la app **TestFlight** del App Store → aceptan → instalan Mimebien.

**Para testers externos** (hasta 10,000 — más adelante):
- Requiere **Beta App Review** de Apple (1-2 días) la primera vez.
- Requiere **Privacy Policy URL viva** (`mimebien.com/privacy` — hoy es placeholder) y descripción beta.
- Recomendación: valida 1-2 semanas con internos primero.

---

## Paso 7 — Iterar con nuevos builds

Para cada versión nueva:

```bash
npx eas build --platform ios --profile production
npx eas submit --platform ios --latest
```

El build number sube solo (`autoIncrement` + `appVersionSource: remote` ya configurados en `eas.json`). Los testers reciben el update automáticamente en TestFlight.

---

## Pendientes del lado del código (pedir a Claude Code)

| Cuándo | Qué |
|---|---|
| Si falla el paso 1 | Fix del check de permisos HealthKit read-only |
| Durante TestFlight | Bugs que reporten los testers |
| Antes del App Store | URLs reales de privacidad/términos en `SettingsScreen.tsx` (hoy placeholders de mimebien.com) |
| Antes del App Store | Texto "Sleep Cycles Premium" → "Mimebien Premium" en Settings |
| Recomendado | Crash reporting (Sentry) antes de abrir a testers externos |

## Pendientes tuyos antes del App Store público (no bloquean TestFlight interno)

- [ ] Landing en mimebien.com con `/privacy` y `/terms` (plantillas listas en `PLAN_LANZAMIENTO.md` §7)
- [ ] Screenshots 6.7" (1290×2796) — mínimo 3, desde iPhone Pro Max o simulador
- [ ] Metadata del listing: subtitle, description, keywords (guía en `PLAN_LANZAMIENTO.md` §10.3)
- [ ] Privacy Nutrition Labels en App Store Connect (inventario de datos en `PLAN_LANZAMIENTO.md` §10.4 — recuerda declarar **Health & Fitness** ahora que hay HealthKit)

---

## Solución de problemas rápida

| Síntoma | Causa probable | Fix |
|---|---|---|
| La app crashea al abrir el build de TestFlight | Faltó el paso 2 (env vars) | `eas env:list --environment production` y crear las que falten; rebuild |
| "No se pudo programar" al crear alarma | Permisos de notificación denegados | Ajustes → Notificaciones → Mimebien |
| HealthKit "No conectado" tras aceptar permisos | Bug del check read-only | Pedir el fix a Claude Code |
| El build falla en credenciales | Membresía Apple Developer no activa | Esperar activación (24-48 h tras pagar) |
| `eas submit` rechaza el binario | Falta la app en App Store Connect | Completar paso 4 |
| El mail de reset no abre la app | Faltó el paso 3 (redirect URL) | Agregar `mimebien://reset-password` en Supabase |

# Activar Mimebien Premium (RevenueCat)

Instructivo para encender los pagos. **El código de la app ya está listo**: el
paywall funciona (muestra la propuesta de valor) y las funciones premium se
bloquean con `usePremium()`. Falta solo tu configuración externa + activar el
SDK. Mientras no completes esto, la capa de compras vive en modo "stub": la app
funciona igual, sin premium, y el paywall muestra su estado de "próximamente".

Toda la interacción con el SDK está aislada en un solo archivo:
[`src/lib/purchases.ts`](src/lib/purchases.ts). Es el único que se toca al activar.

---

## Paso 0 — Prerrequisitos

- [ ] Apple Developer Program activo y la app creada en App Store Connect (ya hecho para TestFlight).
- [ ] **Acuerdo de Paid Applications** firmado en App Store Connect → *Agreements, Tax, and Banking* (con datos fiscales y bancarios). Sin esto no se pueden crear productos de pago.

---

## Paso 1 — Productos de suscripción en App Store Connect

En App Store Connect → tu app → **Subscriptions**:

- [ ] Crea un **grupo de suscripción** (p. ej. `mimebien_premium`).
- [ ] Crea 2 suscripciones auto-renovables:
  - `mimebien_premium_monthly` (mensual)
  - `mimebien_premium_yearly` (anual)
- [ ] Ponles precio, nombre de display y descripción de revisión. Adjunta al menos una a un build para que Apple las revise.

---

## Paso 2 — RevenueCat

En [app.revenuecat.com](https://app.revenuecat.com):

- [ ] Crea un proyecto y agrega una **app iOS** con el bundle `com.bgachuzd.mimebien`.
- [ ] Sube la **App Store Connect API key** (para que RevenueCat lea tus productos/estados).
- [ ] **Products**: importa los dos productos del Paso 1.
- [ ] **Entitlements**: crea uno con identificador exactamente **`premium`** (coincide con `PREMIUM_ENTITLEMENT` en `purchases.ts`) y adjúntale ambos productos.
- [ ] **Offerings**: crea el offering `default` (el `current`) con dos packages: mensual y anual.
- [ ] Copia la **Public SDK Key de iOS** (empieza con `appl_...`).

---

## Paso 3 — API key en el proyecto

- [ ] En tu `.env` local:
  ```
  EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxx
  ```
- [ ] Para el build de producción, súbela a EAS:
  ```bash
  npx eas env:create --environment production --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value "appl_xxxx" --visibility plaintext
  ```

> En cuanto esta variable existe, `isPurchasesConfigured()` devuelve `true` y la
> app deja el modo stub. (Necesita también el Paso 4.)

---

## Paso 4 — Instalar el SDK y activar el código

- [ ] Instala el SDK (pnpm, como todo el repo):
  ```bash
  pnpm add react-native-purchases
  ```
- [ ] En [`src/lib/purchases.ts`](src/lib/purchases.ts): **borra las funciones stub** (la sección "Implementación STUB") y **descomenta el bloque "Implementación REAL"** del final. La API key ya se lee sola de la variable de entorno.
- [ ] Es un módulo nativo → necesitas un **dev build nuevo** de EAS (el dev client anterior no lo trae):
  ```bash
  npx eas build --platform ios --profile development
  ```

---

## Paso 5 — Probar en Sandbox

- [ ] En App Store Connect → *Users and Access → Sandbox Testers*, crea un tester.
- [ ] En tu iPhone: Ajustes → App Store → inicia sesión con el sandbox tester (o usa el prompt al comprar).
- [ ] Abre el paywall en la app (Settings → Premium, o al tocar una función premium). Deberías ver los planes reales con precio.
- [ ] Compra → verifica que las funciones premium se desbloquean (p. ej. tags ilimitados en la bitácora) y que **Restaurar compras** funciona.

---

## Paso 6 — Producción

```bash
npx eas build --platform ios --profile production
npx eas submit --platform ios --latest
```

- [ ] En App Store Connect, envía las suscripciones a revisión junto con el build.
- [ ] Actualiza los **Privacy Nutrition Labels** para declarar compras/pagos.

---

## Qué NO hay que tocar

- La UI del paywall ([`src/components/Paywall.tsx`](src/components/Paywall.tsx)) y el `EntitlementsContext` ya consumen la capa `purchases.ts`. No requieren cambios al activar.
- Todas las funciones premium ya llaman a `usePremium()`; se desbloquean solas cuando el entitlement `premium` esté activo.

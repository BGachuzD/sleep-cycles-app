# Contexto Actual del Proyecto

## Resumen

Aplicación móvil en React Native (Expo) para optimizar ciclos de sueño. Incluye:

- cálculo de horarios para dormir/despertar según perfil,
- notificaciones locales inteligentes (alarma de despertar con 3 disparos),
- registro diario de sueño con historial,
- rutina pre-sueño personalizable,
- estadísticas con gráficos y anillos de cumplimiento,
- siestas inteligentes con alarma por ventana,
- gestión de alertas programadas,
- onboarding cinematográfico + autenticación con Supabase,
- gestión de tema (light/dark/auto) persistente.

**Estado actual:** Fase 1 (estabilización + migraciones SQL) y **Fase 2 (rediseño visual) completas**. Todas las pantallas usan el nuevo lenguaje violeta refinado + motion físico tipo iOS nativo. Lista para Fase 3.

## Stack Técnico

- `Expo SDK 54`, `React 19.1`, `React Native 0.81.5`, New Architecture habilitada
- TypeScript estricto (`strict: true`), `typescript ~5.9`
- Gestor de paquetes: **pnpm exclusivamente** (versión 10.30.x). `package-lock.json` y `yarn.lock` están en `.gitignore`.
- Navegación: `@react-navigation/native 7`, `native-stack 7`, `drawer 7`
- Estado/persistencia local: Context + hooks + `AsyncStorage` (claves namespaced por `userId`)
- Backend/Auth: `@supabase/supabase-js 2.86+`
- Notificaciones: `expo-notifications 0.32` (locales, no push). Límite iOS: 64 notificaciones programadas.
- UI/animaciones: `react-native-reanimated 4.1` + `react-native-worklets 0.5`, `expo-linear-gradient 15`
- Gráficos: `react-native-svg 15.12` (anillos de cumplimiento, sparklines)
- Bottom sheets: `@gorhom/bottom-sheet 5.2`
- UUIDs: `uuid 14` + `react-native-get-random-values`
- Sin NativeWind ni Tailwind — `StyleSheet.create` + `createStyles(theme)`

## Estructura Principal

- Entrada app: `App.tsx` (envuelve los providers en este orden: `GestureHandlerRootView` → `ThemeProvider` → `AuthProvider` → `OnboardingProvider` → `SleepProfileProvider` → `SleepLogProvider` → `SleepRoutineProvider` → `BottomSheetModalProvider` → `AppNavigation`)
- Navegación drawer: `src/navigation/AppDrawerNavigator.tsx`
- Pantallas: `src/screens/*` (y `src/screens/auth/*`)
- Contextos: `src/context/*`
- Hooks de datos: `src/hooks/*` — ya **no importan supabase directamente**, usan la capa de services
- **Capa de servicios I/O**: `src/services/sleepProfileService.ts`, `sleepLogService.ts`, `sleepRoutineService.ts` (encapsulan toda la interacción con Supabase)
- Dominio/lógica de sueño: `src/domain/*` (sleepProfile, sleepEngine, sleepLog, sleepRoutine — funciones puras)
- Notificaciones: `src/notifications/scheduler.ts`
- **Componentes compartidos UI**: `src/components/PrimaryCTA.tsx`, `Bumper.tsx`, `FieldInput.tsx`, `AuthHero.tsx`, `GradientBackground.tsx`, `FloatingDrawerButton.tsx`, `FloatingHomeButton.tsx`
- **Hooks compartidos UI**: `src/hooks/usePressScale.ts` (spring scale "iOS feel" reutilizable)
- Tipos: `src/types/*`
- Tema y tokens: `src/theme/*`
- Utilidades de sueño: `src/utils/sleep.ts` (`formatTime`, `formatDuration`, `getWakeTimesFromNowForProfile`, `getSleepTimesForWakeDateForProfile`, definición canónica de `WakeTimeOption` y `SleepTimeOption`)

## Sistema de Diseño (Fase 2)

### Filosofía

- **Paleta:** violetas refinados (indigo dominante) — `accent.50/300/400/500/600/700`. Menos colores accent que el diseño anterior. Cada paleta tiene tokens semánticos para `success` (verde), `warning` (ámbar) y `danger` (rojo) usados solo donde la semántica lo exige (feelings del log, acciones destructivas, alertas de rango inválido).
- **Densidad:** distinta por pantalla — Home balanceada, SleepNow/WakeAt aireadas, SleepRoutine en timeline densa, SleepLog form compacto, Stats rica (anillos + sparklines), Onboarding cinematográfico.
- **Motion:** físico tipo iOS nativo (springs, swipes, sheets con gestos). `usePressScale` con configuración `mass: 0.4, damping: 14, stiffness: 220` para casi todos los Pressables. Excepción: el **Onboarding** lleva motion cinematográfico (parallax + entries escalonados + glow respirante + partículas orbitando).
- **Tipografía:** sin custom font; usa system con weights (en iOS resuelve a SF Pro Display). El "reloj hero" usa `fontVariant: ['tabular-nums']`, `letterSpacing: -2`, `weight: '800'`.
- **Sin emojis** en pantallas funcionales. El onboarding usa Ionicons grandes (no emojis tampoco) dentro de composiciones violeta + glow + partículas.

### Tokens (`src/theme/theme.ts`)

- `spacing`: xs(4) sm(8) md(12) lg(16) xl(20) xxl(24) xxxl(32) huge(40) giant(56)
- `radius`: sm(8) md(12) lg(16) xl(20) xxl(28) full(999)
- `type`: caption(11) micro(12) small(13) body(14) bodyLarge(15) subhead(17) title3(22) title2(28) title1(34) display(52) hero(64)
- `colors.accent`: escala indigo completa (`50/300/400/500/600/700`)
- `colors.heroText`: token semántico para relojes/displays gigantes. En **light** es `accent[700]` (#4338ca violeta oscuro). En **dark** es `textPrimary` (#e5e7eb blanco/gris claro).
- `colors.success/warning/danger/info`: para semánticos no-violeta.

### Componentes compartidos

- **`PrimaryCTA`** (`src/components/PrimaryCTA.tsx`) — botón gradient violeta full-width 64px con icono leading + label + chevron trailing. Props: `label`, `icon`, `onPress`, `trailingIcon?`. Spring scale al press. Sombra de marca con `accent[600]`. Usado en Home, sheets de SleepNow/WakeAt/Nap, SleepRoutine, SleepLog, Onboarding, SignIn, SignUp, SleepProfile.
- **`Bumper`** (`src/components/Bumper.tsx`) — botón circular con spring scale (0.85), bg `accent[500]` al 10%, icono `accent[400]`. Props: `icon`, `onPress`, `size?`, `iconSize?`, `accessibilityLabel?`. Usado en WakeAt, SleepRoutine, SleepLog, Onboarding.
- **`FieldInput`** (`src/components/FieldInput.tsx`) — Card con label uppercase + TextInput con focus state violeta (border `accent[500]` 1.5px al focus). Soporta `secureTextEntry` + `showToggle` (eye icon para passwords). Prop `large` para variar tipografía (subhead 17pt bold vs body 14pt regular). Usado en SleepProfile, SignIn, SignUp.
- **`AuthHero`** (`src/components/AuthHero.tsx`) — Composición violeta (glow respirante + anillo + círculo con gradient e icono blanco) de 116px. Usado en SignIn y SignUp.
- **`GradientBackground`** — fondo común. Círculo violeta gigante arriba con shadow blur 200, opacity 35%, escala 0.95↔1.05 respirando cada 8s con easing senoidal.
- **`FloatingDrawerButton`** (esquina superior derecha) y **`FloatingHomeButton`** (esquina superior izquierda en screens distintas a Home).

### Hooks compartidos

- **`usePressScale`** (`src/hooks/usePressScale.ts`) — devuelve `{ animatedStyle, onPressIn, onPressOut }`. Configuración default 0.97; los Bumpers usan 0.85; CTAs grandes usan 0.96.

### Patrones visuales recurrentes

- **Hero pattern:** eyebrow uppercase `caption`/`micro` + reloj/título gigante violeta (`heroText`) + subtítulo dinámico.
- **Card recommended:** borde `accent[500]` 1.5px (vs border default 1px).
- **AnchorCard / OptionCard:** card con eyebrow + headline + subline + CTA inline, spring scale al tap.
- **Bottom sheet (gorhom):** `snapPoints: ['62%' a '78%']`, `enableDynamicSizing: false`, backdrop con `pressBehavior: 'close'`. Drag y swipe-to-dismiss gratis. Para forms se usa `BottomSheetTextInput` con `keyboardBehavior: 'interactive'`.
- **Bug fix bottom sheet vacío:** `openSheet()` solo hace `setSelectedOption(option)`; un `useEffect` separado llama `sheetRef.current?.present()` cuando cambia el state — evita el flash con data nula en la primera apertura.
- **Ambient glow en pantallas standalone:** SignIn, SignUp y Onboarding tienen un círculo violeta gigante arriba (max(width,height)) con shadowRadius 200px y opacity 22-25%. Mismo patrón que `GradientBackground` pero standalone (no requiere el componente porque esas pantallas no llevan el resto del chrome).

## Flujo de Navegación Actual

`RootNavigator` (en `App.tsx`) decide la ruta según estado:

1. Sin sesión → `SignIn` / `SignUp`
2. Con sesión pero sin onboarding → flujo de onboarding
3. Con sesión y onboarding completo pero sin perfil → `SleepProfile` forzado (`forceSetup`)
4. Con perfil completo → `AppDrawerNavigator`

### Drawer

- Posición: **lado derecho** (`drawerPosition: 'right'`)
- Pantallas incluidas: `Home`, `SleepNow`, `WakeAt`, `Nap`, `SleepLog`, `Stats`, `SleepRoutine`, `SleepProfile`, `Settings`, `Notifications`

## Autenticación y Perfil de Usuario

### Auth (`src/context/AuthContext.tsx`)

- `signUp` guarda metadata inicial: `display_name`, `chronotype`
- `signIn` / `signOut` estándar Supabase

### Perfil de sueño (`src/hooks/useSleepProfile.ts`)

Estrategia híbrida sin fallback a `profiles` legacy:

1. Lee caché local (`AsyncStorage`, key `sleepProfile/v1:<userId>`)
2. Carga desde `sleep_profiles` via service
3. Si no hay fila en tabla, fallback a `auth.user_metadata.sleep_profile` (JSONB)
4. `saveProfile()` persiste en AsyncStorage + tabla + `user_metadata`

**Importante:** ya no existe el fallback a la tabla `profiles` (eliminado en Fase 1 junto con el bug de `gender:'male'` forzado).

**`SleepProfile` extendido** con `wakeHour?` y `wakeMinute?` (Fase 1) — `OnboardingScreen` persiste estos valores en `handleStart()` antes de `markAsSeen()`, y `WakeAtScreen` los usa como hora inicial por defecto.

## Capa de Servicios (Fase 1)

`src/services/`:

- **`sleepProfileService.ts`** — `loadProfile(userId)`, `saveProfile(userId, profile)`, `loadProfileFromAuthMetadata()`, `saveProfileToAuthMetadata(profile)`. Encapsula mapping `row ↔ profile`.
- **`sleepLogService.ts`** — `loadSleepLog(userId)`, `upsertSleepLogEntry(userId, entry)` (incluye el `delete .neq('id', entry.id)` previo para unicidad por día), `deleteSleepLogEntry(userId, id)`.
- **`sleepRoutineService.ts`** — `loadRoutine(userId)`, `upsertRoutineStep(userId, step)`, `deleteRoutineStep(userId, stepId)`, `deleteAllRoutineSteps(userId)`.

Los hooks (`useSleepProfile`, `useSleepLog`, `useSleepRoutine`) ahora solo orquestan estado + AsyncStorage + delegan a estos services. Cero `supabase.from(...)` en hooks.

## Registro de Sueño y Rutinas

### Sleep Log (`src/hooks/useSleepLog.ts`)

- Tabla: `sleep_log` (PK `id` UUID + UNIQUE `(user_id, date)`)
- CRUD + caché local
- Sincronización por `user_id`

### Sleep Routine (`src/hooks/useSleepRoutine.ts`)

- Tabla: `sleep_routine_steps` (PK compuesta `(user_id, id)`)
- CRUD + reset a defaults + caché local
- `DEFAULT_ROUTINE_STEPS` en `src/domain/sleepRoutine.ts` con 7 pasos predeterminados (cada uno con `step.color` único — naranja, ámbar, esmeralda, etc.)
- Los pasos conservan su `step.color` en el dot del timeline + icono. El chrome del card y badges son violeta para coherencia.

## Motor de Sueño (Dominio)

- Perfil: `src/domain/sleepProfile.ts`
  - edad, peso, altura, género, cronotipo, **wakeHour?, wakeMinute?** (Fase 1)
  - cálculo de BMI, eficiencia, latencia, longitud de ciclo
  - ventanas óptimas según cronotipo
  - **`getAdjustedCycleLengthMinutes(age)`** — fuente única para cycleMins. Usar siempre `getAdjustedCycleLengthMinutes(profile?.age ?? 30)` (centralizado en Home/SleepLog/Stats — el cálculo inline está prohibido).
- Engine: `src/domain/sleepEngine.ts`
  - recomendaciones `sleepNow` y `wakeAt`
  - score por duración/eficiencia
  - ventanas recomendadas
- **`WakeTimeOption` y `SleepTimeOption`** (en `src/utils/sleep.ts`) extendidos con `latencyMinutes` y `score` (Fase 2) — usados para mostrar "Duérmete a las HH:MM" y la calificación visual con estrellas.

## Notificaciones

`src/notifications/scheduler.ts`:

- canal Android: `sleep-reminders`
- programación única por clave (`scheduleUniqueNotificationAtDate`)
- normalización automática de fechas pasadas (se mueve a futuro)
- alarma inteligente con 3 disparos (`inicio`, `centro`, `fin`) para ventana de despertar
- utilidades para listar/cancelar notificaciones

## Variables de Entorno Requeridas

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Definidas en `.env` y usadas en `src/lib/supabaseClient.ts`.

## Configuración Expo/EAS

- `app.json`:
  - iOS `bundleIdentifier`: `com.bgachuzd.sleepcyclesapp`
  - `userInterfaceStyle: "automatic"` (Fase 1, antes era `"light"`)
  - plugin `expo-notifications` configurado
  - `NSUserNotificationsUsageDescription` (Fase 1, antes era `NSUserNotificationUsageDescription` sin `s`)
- `tsconfig.json`: excluye `supabase/functions` (Deno) del typecheck de la app móvil
- `eas.json`: perfiles `development`, `preview`, `production`
- Proyecto Supabase remoto: `xdmazedmeeyaxjwyckoz` (West US Oregon)

## Estado de Base de Datos

**Migración inicial aplicada en remoto (2026-05-17).** Archivo: `supabase/migrations/20260516000000_initial_schema.sql`.

Tablas creadas:

- **`sleep_profiles`** (PK `user_id` → `auth.users`): age, weight_kg, height_cm, gender, chronotype, wake_hour, wake_minute, updated_at. Trigger `set_updated_at()`. CHECK constraints en rangos.
- **`sleep_log`** (PK `id` UUID + UNIQUE `(user_id, date)`): bed_time_iso, wake_time_iso, feeling (1-3). Índice por `(user_id, date desc)`.
- **`sleep_routine_steps`** (PK compuesta `(user_id, id)`): minutes_before, icon, title, description, color, enabled, is_default. Índice por `user_id`.

Todas las tablas:

- FK `user_id → auth.users(id) ON DELETE CASCADE` — la Edge Function `delete-account` borra en cascada los datos del usuario al eliminar la cuenta.
- RLS habilitado + policy `FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`.
- Migración idempotente (`create table if not exists`, `drop policy if exists`).

La tabla legacy `profiles` **ya no se usa** (fallback eliminado del código en Fase 1).

## Plan de Fases

### Fase 1 — Estabilización (✅ COMPLETA — 2026-05-16 / 2026-05-17)

- ✅ `uuid` + `@types/uuid` instalados con pnpm
- ✅ OnboardingScreen persiste `wakeHour`/`wakeMinute`/`chronotype` antes de `markAsSeen()`
- ✅ `package-lock.json` eliminado, lockfiles foráneos al `.gitignore`
- ✅ `app.json` corregido (`userInterfaceStyle` y `NSUserNotificationsUsageDescription`)
- ✅ Migración SQL inicial aplicada a remoto
- ✅ Capa `src/services/` creada, hooks ya no importan supabase directo
- ✅ Fallback a tabla `profiles` eliminado (con su bug `gender:'male'` forzado)
- ✅ ThemeProvider persiste preferencia en `themeMode/v1` (AsyncStorage)
- ✅ HomeScreen usa `setInterval(60s)` para mantener `now` actualizado
- ✅ `cycleMins` centralizado via `getAdjustedCycleLengthMinutes` en Home/SleepLog/Stats
- ✅ `WakeTimeOption` deduplicado a fuente única en `utils/sleep.ts`
- ✅ Código muerto eliminado: `AuthOnboardingBridge.tsx` y `src/types/WakeTimeOptions.ts`
- ✅ `supabase/functions` excluido del tsconfig de la app móvil

### Fase 2 — Rediseño visual (✅ COMPLETA)

Decisiones de dirección (acordadas):

- Mantener violetas refinados (NO estética ODEXXA — el plan original mencionaba ODEXXA pero el usuario lo descartó)
- Motion físico tipo iOS nativo (springs, swipes, sheets con gestos)
- Distintas densidades por pantalla
- HomeScreen como ancla del lenguaje visual
- Onboarding es la excepción "cinematográfica"

Pantallas redibujadas (todas):

- ✅ **HomeScreen** — hero (greeting + reloj 52pt) + PrimaryCTA contextual + AnchorCard única por contexto + grid 2×2 atajos + resumen semanal compacto
- ✅ **SleepNowScreen** — auto-cálculo, lista jerárquica con `OptionCard`, BottomSheet de detalle con estrellas + "duérmete a las" + "despertarás en" + texto educativo por número de ciclos
- ✅ **WakeAtScreen** — hero con time picker integrado (Bumpers ±1h/±15m), default desde `profile.wakeHour/wakeMinute`, auto-cálculo, lista de `SleepOptionCard` con opacity 0.55 si la hora ya pasó, BottomSheet simétrico
- ✅ **SleepRoutineScreen** — hero + PrimaryCTA "Programar rutina", timeline conservando `step.color` único por paso, edit mode con switch + iconos, BottomSheet de edición con `BottomSheetTextInput`
- ✅ **SleepLogScreen** — hero + form compacto con TimeColumns (Bumpers ±15m), preview violeta, `FeelingChip` con iconos meteorológicos (cloud/partly-sunny/sunny) + colores semánticos rojo/ámbar/verde, historial con `HistoryCard`
- ✅ **OnboardingScreen** — 5 slides con `HeroComposition` (capas violeta + icono Ionicons + 6 partículas orbitando + glow respirante), parallax horizontal, entries escalonados, `SlideShell` con ScrollView por slide para evitar overflow en pantallas chicas
- ✅ **StatsScreen** — densidad rica: hero KPI con avgHours en violeta gigante + anillo SVG de cumplimiento semanal (con gradient violeta) + sparkline SVG de tendencia 14 días + compact stats row (racha/mejor/ciclos prom) + week bar chart violeta vs danger + lista de entries refinada con feeling pills
- ✅ **NapScreen** — hero + 4 NapCards con colores únicos por tipo (success/warning/accent500/accent700), BottomSheet con detalles + tip + CTA programar, refresh automático del `wakeEta` cada minuto
- ✅ **NotificationsManagerScreen** — hero con count dinámico, NotificationCards con icon violeta + hora gigante + chip de fecha relativa (hoy/mañana/ayer/lunes/15 may), cancel individual y masivo con confirmación
- ✅ **SleepProfileScreen** — hero con saludo (Hola, {nombre}), `FieldInput` reutilizable con focus state violeta, `SegmentedChips` para gender y chronotype, BMI value en heroText, parámetros derivados en card, `SecondaryLink` list para ver recordatorios/cerrar sesión/eliminar cuenta, PrimaryCTA en footer fijo
- ✅ **SettingsScreen** — Premium hero card con gradient violeta (placeholder hasta RevenueCat en Fase 3), preview del tema activo, `ThemeOption` cards refinadas, `LinkRow` para Sitio web / Términos / Privacidad (URLs placeholder `sleepcycles.app/*` que se actualizan cuando exista la landing)
- ✅ **SignInScreen** — `AuthHero` con icono `moon-outline` + ambient glow violeta + form con `FieldInput` (email + password con eye toggle) + PrimaryCTA "Iniciar sesión" + link a registro
- ✅ **SignUpScreen** — `AuthHero` con icono `sparkles-outline` + form completo (nombre/email/2x password con toggle) + `SegmentedChip` para cronotipo + alertas error/info con bloques contextuales + PrimaryCTA "Crear cuenta"

### Fase 3 — Producción y monetización (⏳ PRÓXIMA)

- Recuperación de contraseña (flow `Forgot password` con `supabase.auth.resetPasswordForEmail` y pantalla de reset)
- Integración RevenueCat (sustituir el `Alert.alert('Próximamente')` del Premium card por un paywall real)
- Tests de dominio (`src/domain/sleepProfile`, `sleepEngine`, `sleepLog`)

### Fase 4 — Lanzamiento

- Build de producción con EAS
- Submit a App Store / Play Store

## Decisiones UX/visual del usuario (memoria)

- **Idioma:** todo en español (es-MX). El usuario es BGachuzD, dev solo del proyecto.
- **Paleta:** violetas refinados, menos accents.
- **Motion:** físico iOS nativo (excepto onboarding que es cinematográfico).
- **Sin emojis** en pantallas funcionales. Reemplazados por iconos Ionicons (meteorológicos para los feelings: cloud/partly-sunny/sunny).
- **Colores únicos por elemento cuando suma info:** pasos de rutina (naranja/ámbar/esmeralda) en dot+icono; tipos de siesta (success/warning/accent500/accent700) — chrome y CTA siempre violeta.
- **Formato hora:** 12h con `a.m./p.m.` (preferencia explícita del usuario). Si el texto no cabe (caso `12:00 p.m.` en columnas estrechas), usar `numberOfLines={1}` + `adjustsFontSizeToFit` + `minimumFontScale: 0.65` para reducir dinámicamente.
- **Reloj hero:** violeta `accent[700]` en light, `textPrimary` en dark (vía token `heroText`).
- **Settings sin info técnica:** quitada la sección "Acerca de" (versión SDK, etc.) — el usuario prefiere mostrar links a Premium, landing, términos y privacidad.

## URLs externas (placeholders)

Definidas como constantes al inicio de `SettingsScreen.tsx`:

- `LANDING_URL = 'https://sleepcycles.app'`
- `PRIVACY_URL = 'https://sleepcycles.app/privacy'`
- `TERMS_URL = 'https://sleepcycles.app/terms'`

Actualizar cuando exista la landing definitiva.

## Scripts disponibles

- `pnpm start` / `pnpm ios` / `pnpm android` / `pnpm web`
- `pnpm typecheck` (excluye `supabase/functions`)
- `supabase link --project-ref xdmazedmeeyaxjwyckoz` (vincular al remoto)
- `supabase db push` (aplicar migraciones de `supabase/migrations/` al remoto)

## Riesgos/Pendientes

1. **Tests unitarios** del dominio (`sleepProfile`, `sleepEngine`) y `scheduler` — Fase 3.
2. **CI** (typecheck/lint/tests) para evitar regresiones — Fase 3.
3. **Recuperación de contraseña** — Fase 3 (siguiente paso).
4. **RevenueCat** + paywall conectado al Premium card — Fase 3.
5. **Edge Function `delete-account`** — código pre-existente en `supabase/functions/`, no testeada visualmente desde el rediseño.
6. **Ruta `DeleteAccount`** referenciada en `SleepProfileScreen.tsx` con cast `as any` — verificar que esté declarada en `AppDrawerNavigator` para que el botón funcione.
7. **URLs legales** son placeholders — actualizar al lanzar la landing.
8. **Dependencia `@types/uuid`** marcada como deprecated por pnpm (uuid v14 trae tipos propios). Se puede quitar con `pnpm remove -D @types/uuid` sin romper nada.

---

_Documento actualizado al cierre de Fase 2. Refleja todas las pantallas rediseñadas, los componentes compartidos extraídos (PrimaryCTA, Bumper, FieldInput, AuthHero, usePressScale) y las decisiones UX acordadas con el usuario._

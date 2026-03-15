# Contexto Actual del Proyecto

## Resumen
Aplicación móvil en React Native (Expo) para optimizar ciclos de sueño. Actualmente incluye:
- cálculo de horarios para dormir/despertar según perfil,
- notificaciones locales inteligentes,
- registro de sueño,
- rutina pre-sueño,
- estadísticas,
- onboarding + autenticación con Supabase.

## Stack Técnico
- `Expo SDK 54`, `React 19`, `React Native 0.81`
- Navegación: `@react-navigation/native`, `native-stack`, `drawer`
- Estado/persistencia local: Context + hooks + `AsyncStorage`
- Backend/Auth: `@supabase/supabase-js`
- Notificaciones: `expo-notifications`
- UI/animaciones: `react-native-reanimated`, `expo-linear-gradient`

## Estructura Principal
- Entrada app: `App.tsx`
- Navegación drawer: `src/navigation/AppDrawerNavigator.tsx`
- Pantallas: `src/screens/*`
- Contextos: `src/context/*`
- Hooks de datos: `src/hooks/*`
- Dominio/lógica de sueño: `src/domain/*`
- Notificaciones: `src/notifications/scheduler.ts`

## Flujo de Navegación Actual
`RootNavigator` (en `App.tsx`) decide la ruta según estado:
1. Sin sesión -> `SignIn` / `SignUp`
2. Con sesión pero sin onboarding -> flujo de onboarding
3. Con sesión y onboarding completo pero sin perfil -> `SleepProfile` forzado (`forceSetup`)
4. Con perfil completo -> `AppDrawerNavigator`

### Drawer
- Posición: **lado derecho** (`drawerPosition: 'right'`)
- Pantallas incluidas:
  - `Home`
  - `SleepNow`
  - `WakeAt`
  - `Nap`
  - `SleepLog`
  - `Stats`
  - `SleepRoutine`
  - `SleepProfile`
  - `Notifications`

## Estándar UI actual
- Botón drawer flotante en esquina superior derecha: `FloatingDrawerButton`
- Botón flotante a Home en lado opuesto (izquierda) en todas las screens funcionales excepto Home: `FloatingHomeButton`
- Fondo visual compartido: `GradientBackground`
- Tema visual nocturno consistente (azules/grises oscuros)

## Autenticación y Perfil de Usuario
### Auth (`src/context/AuthContext.tsx`)
- `signUp` guarda metadata inicial:
  - `display_name`
  - `chronotype`
- `signIn` / `signOut` estándar Supabase

### Perfil de sueño (`src/hooks/useSleepProfile.ts`)
Estrategia híbrida:
1. Lee caché local (`AsyncStorage`) por usuario
2. Intenta cargar/guardar en tabla `sleep_profiles`
3. Si la tabla no existe (`PGRST205`), fallback a `profiles`
4. Guarda también respaldo en `auth.user_metadata.sleep_profile`

## Registro de Sueño y Rutinas
### Sleep Log (`src/hooks/useSleepLog.ts`)
- Tabla esperada: `sleep_log`
- CRUD + caché local
- Sincronización por `user_id`

### Sleep Routine (`src/hooks/useSleepRoutine.ts`)
- Tabla esperada: `sleep_routine_steps`
- CRUD + reset a defaults + caché local
- Sincronización por `user_id`

## Motor de Sueño (Dominio)
- Perfil: `src/domain/sleepProfile.ts`
  - edad, peso, altura, género, cronotipo
  - cálculo de BMI, eficiencia, latencia, longitud de ciclo
  - ventanas óptimas según cronotipo
- Engine: `src/domain/sleepEngine.ts`
  - recomendaciones `sleepNow` y `wakeAt`
  - score por duración/eficiencia
  - ventanas recomendadas

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
  - plugin `expo-notifications` configurado
- `eas.json`:
  - perfiles `development`, `preview`, `production`

## Estado de Base de Datos (observado)
- El código espera tablas:
  - `sleep_profiles` (principal)
  - `profiles` (fallback)
  - `sleep_log`
  - `sleep_routine_steps`
- Actualmente `supabase/migrations/` está vacío en este workspace.

## Scripts disponibles
- `start`, `android`, `ios`, `web`, `typecheck`

## Riesgos/Pendientes Recomendados
1. Versionar migraciones SQL reales en `supabase/migrations/` (hoy está vacío).
2. Estandarizar esquema final de perfil (`sleep_profiles` vs `profiles`) para evitar fallback permanente.
3. Agregar pruebas unitarias para dominio (`sleepProfile`, `sleepEngine`) y scheduler.
4. Definir política final de campos en `profiles` (ej. `gender`, `chronotype`) o mantenerlos en metadata.
5. Añadir CI (typecheck/lint/tests) para evitar regresiones.

---
Documento generado para conservar contexto técnico/funcional del estado actual del proyecto.

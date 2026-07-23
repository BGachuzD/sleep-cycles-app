# Mimebien

App de ciclos de sueño construida con **Expo** + **React Native** + **TypeScript**.
Registro de sueño, diario de sueños, despertar inteligente, metas e insights, con
sincronización en **Supabase** e integración con **HealthKit** (iOS).

## Requisitos

- Node LTS
- **pnpm** (gestor de paquetes exclusivo de este repo — no usar npm/yarn)
- Expo CLI / desarrollo con `expo-dev-client`

## Configuración

1. Instalar dependencias:
   ```bash
   pnpm install
   ```
2. Crear un archivo `.env` en la raíz con las claves de Supabase:
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```
   > `.env` está ignorado por git. Las variables `EXPO_PUBLIC_*` se embeben en el
   > bundle (correcto para la _anon key_ de Supabase, que es pública).

## Scripts

| Script                      | Descripción                                |
| --------------------------- | ------------------------------------------ |
| `pnpm start`                | Inicia el bundler de Expo                  |
| `pnpm ios` / `pnpm android` | Compila y corre en el dispositivo/emulador |
| `pnpm lint`                 | Ejecuta ESLint                             |
| `pnpm lint:fix`             | ESLint con autofix                         |
| `pnpm format`               | Formatea con Prettier                      |
| `pnpm format:check`         | Verifica formato sin escribir              |
| `pnpm type-check`           | Chequeo de tipos con `tsc --noEmit`        |
| `pnpm test`                 | Tests de la capa de dominio (Jest)         |

## Arquitectura

```
src/
├── components/   Componentes reutilizables (+ ui/ para primitivos)
├── context/      Estado global (React Context)
├── domain/       Lógica pura de negocio + tests (sin dependencias de RN)
├── hooks/        Hooks personalizados
├── lib/          Clientes e infra (Supabase, logger, purchases)
├── navigation/   Navegadores y helpers de navegación
├── notifications/ Programación de notificaciones
├── screens/      Pantallas de la app
├── services/     Acceso a datos de Supabase (helpers compartidos en supabaseHelpers.ts)
├── theme/        Tema y ThemeProvider
└── utils/        Utilidades varias
```

La capa `domain/` es pura y testeable de forma aislada (Jest corre en entorno
`node`, ver [jest.config.js](jest.config.js)). Los servicios degradan con gracia:
registran el error vía el `logger` central y devuelven `null`/`void` en vez de
lanzar, para que un fallo de red no tumbe la UI.

## Calidad de código

- **TypeScript** en modo `strict`.
- **ESLint** (flat config, `eslint-config-expo`) + **Prettier** (formato).
- Orden de imports automático (`simple-import-sort`).
- **husky** + **lint-staged**: en cada commit se pasan ESLint y Prettier sobre
  los archivos en staging.

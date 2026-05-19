# Sleep Cycles App — Plan de lanzamiento (Fase pre-código)

Documento de trabajo estratégico para resolver branding, legal, landing y decisiones de producto antes del lanzamiento. Este archivo está pensado para iterarlo en una conversación con Claude (cualquier interfaz no-código). Cuando alguna decisión requiera tocar el código, pasar a Claude Code con la decisión ya tomada.

---

## 1. Resumen ejecutivo del estado actual

### Qué hay hoy

App React Native + Expo (SDK 54) técnicamente lista para subir a stores:

- **Auth completo** (Supabase): sign up, sign in, recuperación de contraseña
- **Motor de cálculo de ciclos** con perfil personalizado (edad, IMC, género, cronotipo, latencia, eficiencia)
- **3 modos de cálculo**: "Dormir ahora", "Despertar a", "Modo siesta" (4 tipos)
- **Alarma inteligente** con ventana ±10 min y 3 disparos escalonados
- **Registro diario de sueño** con historial y feeling (escala 1-3)
- **Rutina pre-sueño** personalizable (7 pasos default + custom)
- **Estadísticas** con anillo de cumplimiento, sparkline de tendencia, bar chart semanal
- **Gestión de alertas** programadas
- **Onboarding cinematográfico** de 5 slides
- **Sistema de temas** (light / dark / auto) con persistencia
- **Soporte multi-device** (sync via Supabase)
- **Eliminación de cuenta** con cascade delete (Edge Function)

### Stack

- Expo SDK 54, React Native 0.81, TypeScript estricto
- Supabase (Auth + Postgres + Edge Functions) — proyecto remoto activo
- Notificaciones locales (expo-notifications)
- pnpm como gestor único

### Lo que NO hay (relevante para diferenciación)

- ❌ Tracking real de sueño (micrófono, acelerómetro)
- ❌ Integración HealthKit / Google Fit
- ❌ Apple Watch app
- ❌ Audio (white noise, meditaciones)
- ❌ Anuncios
- ❌ Sistema de pagos

---

## 2. Decisión estratégica acordada

**Lanzar gratis primero** sin sistema de pagos. Estrategia:

1. Subir app gratis a App Store (y posiblemente Google Play después)
2. Validar engagement con usuarios reales
3. Agregar **HealthKit reads** como siguiente feature (lectura de datos de sueño del Health app — alimenta diario y stats con datos reales sin tener que escribir Watch app nativa)
4. Una vez con tracción + HealthKit, decidir si vale meter premium
5. Si decide monetizar: RevenueCat + paywall conectado a `react-native-purchases`

Este orden minimiza riesgo y permite validar producto antes de invertir en monetización.

---

## 3. Bloqueador #1 — Nombre de la app

### Por qué hay que cambiarlo

El nombre interno actual **"Sleep Cycles App"** colisiona con **Sleep Cycle** (la app líder mundial de tracking de sueño, ~30M descargas, propiedad de Sleep Cycle AB). Esto causa:

1. **Riesgo de rechazo Apple Review**: rules 4.1 (Copycats) y 5.2 (Intellectual Property)
2. **Descubribilidad cero**: ningún usuario te va a encontrar buscando "sleep cycles" — siempre saldrá Sleep Cycle primero
3. **Posible reclamo de marca** si llegan a notarte

### 15 opciones de nombre para evaluar

Cada una con análisis cualitativo. **Verifica disponibilidad de dominio en** https://instantdomainsearch.com **y de App Store name en** https://appfollow.io/asoreport o buscando manualmente en la App Store.

| # | Nombre | Tono | Significado / origen | Pros | Contras | Probable .com |
|---|---|---|---|---|---|---|
| 1 | **Noctura** | Premium nocturno | Invención sobre "nocturno" | Memorable, corto, evoca noche | Suena femenino | 🟢 Alta |
| 2 | **Cyclo** | Técnico/directo | Apocope de "ciclo" | Auto-descriptivo, corto | Choca con "Cyclo" de bicicletas, posible apps fitness | 🟡 Media |
| 3 | **Phasa** | Técnico | "Fase" en latín | Único, evoca ciencia del sueño | Difícil de pronunciar | 🟢 Alta |
| 4 | **Selene** | Poético | Diosa griega de la luna | Bonito, conexión con luna | Muy usado en apps wellness | 🔴 Baja |
| 5 | **Lume** | Mínimo/elegante | "Luz" en latín/italiano | Corto, memorable, premium | Posible choque con apps de iluminación | 🟡 Media |
| 6 | **Vellta** | Invención pura | Sin significado previo | Único, posibilidad de marca propia | No comunica nada por sí solo | 🟢 Alta |
| 7 | **Hypnos** | Mitológico | Dios griego del sueño | Fuerte, descriptivo del producto | Suena tipo psicología, oscuro | 🟡 Media |
| 8 | **Klepsa** | Intelectual | De "clepsidra" (reloj de agua antiguo) | Único, evoca tiempo | Obscuro, requiere explicación | 🟢 Alta |
| 9 | **Restwise** | Funcional inglés | "Descansa con sabiduría" | Auto-descriptivo, internacional | Demasiado literal, varios apps similares | 🔴 Baja |
| 10 | **Madrugar** | Directo español | Verbo | Hablan al wedge "en español" | Solo apela a la mañana, no al ciclo completo | 🟢 Alta |
| 11 | **Lyra** | Astronómico | Constelación | Bonito, evocador | Choca con marca de auriculares (Lyra) y apps musicales | 🔴 Baja |
| 12 | **Nox** | Mínimo latín | "Noche" en latín | Corto, fuerte | Muy genérico, muchas apps lo usan | 🔴 Baja |
| 13 | **Aurea** | Premium | "Dorada" en latín, "Hora áurea" del despertar | Premium, único | No comunica sueño | 🟢 Alta |
| 14 | **Cyclene** | Compuesto | Variante de "cycle" + sufijo elegante | Único, descriptivo | Suena a producto de skincare | 🟢 Alta |
| 15 | **Sereno** | Español poético | "Sereno" — calmo, sin nubes | Tono cálido en español | Genérico | 🟡 Media |

### Cómo decidir

1. Cortar la lista a 3-5 favoritos personales
2. Verificar cada uno:
   - **Dominio .com** en https://instantdomainsearch.com (clave; si no hay .com, considerar .app)
   - **Marca registrada** en https://www.tmsearch.uspto.gov (US) y https://eservices.impi.gob.mx (México)
   - **App Store search** en iOS app store y Google Play — buscar exact match
   - **Instagram/Twitter handles** disponibles en `@noctura`, etc.
3. Idealmente: **dominio + tres handles libres** = nombre viable
4. Verificar que **no choque con producto similar** en App Store (search "sleep" + nombre)

### Tagline propuestas (para acompañar el nombre)

- "Despierta donde tu cuerpo termina"
- "Tu reloj de sueño personal"
- "Ciclos completos, despertares ligeros"
- "Sueño consciente"
- "Mejores noches, mejores días"

---

## 4. Branding — specs técnicas exactas

Una vez decidido el nombre, vas a producir estos assets. Aquí las dimensiones que Apple/Google requieren.

### 4.1 Icono de app

| Asset | Dimensión | Formato | Notas |
|---|---|---|---|
| **App icon master (iOS)** | **1024 × 1024 px** | PNG, sin transparencia, sin esquinas redondeadas | Apple aplica el rounded corner automáticamente |
| iOS específicos (todos los tamaños) | Generados desde el master | PNG | Expo los genera con `expo prebuild` desde tu icon master |
| Android adaptive icon foreground | **1024 × 1024** | PNG con transparencia | Solo el símbolo, sin bg |
| Android adaptive icon background | **1024 × 1024** | PNG (color sólido o gradiente) | Bg solo, sin símbolo |

Configuración en `app.json` (ya tienes la estructura):

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#020617"
      }
    }
  }
}
```

### 4.2 Splash screen

| Asset | Dimensión | Formato | Notas |
|---|---|---|---|
| Splash logo | **1284 × 1284** (cuadrado, centered) | PNG | Logo solo, sobre fondo `theme.colors.background` |
| Alternativa adaptive | Usar `expo-splash-screen` con dark/light | PNG | Más trabajo pero mejor UX |

### 4.3 Logo — 3 variantes mínimas

```
┌─ Isotipo solo ──┐     ┌─ Logotipo full ──────────────┐     ┌─ Monocromo ─────┐
│   ╲  ●  ╱       │     │   ╲  ●  ╱   NOCTURA          │     │   ●●●           │
│    \\●●●/        │     │    \\●●●/   sueño consciente  │     │   ● NOCTURA     │
│   ╱  ●  ╲       │     │   ╱  ●  ╲                    │     │                 │
└─────────────────┘     └──────────────────────────────┘     └─────────────────┘
   App icon                Landing header                     Email, PDFs
   Favicon                  Splash                            Blanco sobre violet
   Watch face               Marketing                         o negro sobre blanco
```

Cada una en formato **SVG** (vector) para uso digital + **PNG @1x @2x @3x** para casos donde el SVG no aplica.

### 4.4 Web assets (para landing + redes)

| Asset | Dimensión | Uso |
|---|---|---|
| Favicon | **32 × 32** + **16 × 16** ICO/PNG | Tab del browser |
| Apple touch icon | **180 × 180** PNG | iOS "Agregar a inicio" |
| Open Graph image | **1200 × 630** PNG/JPG | Preview WhatsApp, Facebook, LinkedIn |
| Twitter card | **1200 × 675** PNG/JPG | Preview X/Twitter |
| Logo SVG | vector | Header de la landing |
| Logo PNG @2x | 600 × 300 | Email footer, fallback |

### 4.5 Tipografía recomendada

- **Display + Body**: System (SF Pro en iOS, Roboto en Android) — ya en uso en la app
- **Para landing**: **Inter** o **Manrope** vía Google Fonts (gratis, modernas, geométricas, se alinean con system fonts)

### 4.6 Paleta — reusar la de la app

```
Background dark:    #020617
Background light:   #f8fafc
Primary (violet):   #6366f1
Strong:             #4f46e5
Deep:               #4338ca

Gradient hero:      #6366f1 → #4338ca (diagonal)

Text primary dark:  #e5e7eb
Text primary light: #0f172a

Success:            #10b981
Warning:            #fbbf24
Danger:             #f87171
```

### 4.7 Herramientas para producir

- **Figma** (gratis) — el estándar. Plantillas para app icon y landing
- **IconKitchen** (https://icon.kitchen) — genera todos los tamaños desde tu master
- **App Icon Generator** (https://appicon.co) — alternativa
- **Real Favicon Generator** (https://realfavicongenerator.net) — para favicon multi-formato

Si no tienes diseñador y quieres acelerar:
- **Looka.com** ($20-40 single use) — genera logo con AI razonable
- **Hatchful by Shopify** (gratis) — más básico pero útil
- O contratar en **Fiverr** ($50-150) con brief específico (las specs de arriba sirven como brief)

---

## 5. Dominio

### Dónde comprar

| Registrar | Precio .com | Pros | Contras |
|---|---|---|---|
| **Cloudflare Registrar** | $9.15/año (al costo) | El más barato. WHOIS privacy gratis. Sin upsells | Solo dominios renovados (no se puede comprar nuevo desde Cloudflare directo, requiere transfer) |
| **Porkbun** | $9.73/año | Barato, sin upsells agresivos, WHOIS privacy gratis | UI menos pulida |
| **Namecheap** | $9.18/año primer año, luego $14.98 | UI cómoda, popular | Renovación más cara |
| **GoDaddy** | $0.99 primer año, luego $20+ | Reconocido | Upsells agresivos, renovación cara, no recomendado |

**Recomendación:** comprar en **Porkbun**, transferir a **Cloudflare** después de 60 días (Cloudflare cobra siempre al costo). O directamente en Porkbun y dejarlo ahí.

### TLD a considerar (en orden de preferencia)

1. **`.com`** — siempre primera opción. Más confianza, mejor SEO
2. **`.app`** — específico de apps, $14-20/año, requiere HTTPS obligatorio (no problem, Cloudflare lo da gratis)
3. **`.io`** — tech-friendly, ~$30/año
4. **`.mx`** — si solo apuntas mercado mexicano
5. Evitar: `.club`, `.online`, `.xyz` — sospechosos, malos para SEO

### DNS básico (después de comprar)

Apuntar el dominio a donde hostees la landing:
- **Cloudflare Pages** (gratis): te dan `tudominio.pages.dev`, agregas tu dominio en Pages dashboard
- **Vercel** (gratis): igual, agregas dominio en Vercel dashboard
- **Netlify** (gratis): igual

Los 3 son válidos. Mi recomendación para landing estática: **Cloudflare Pages** (mejor CDN global, gratis ilimitado).

---

## 6. Landing page

### Estructura mínima (una sola página)

```
┌──────────────────────────────────────────────┐
│  [Logo]                  Iniciar sesión  ⇗   │  ← Header simple
├──────────────────────────────────────────────┤
│                                              │
│           [Logo grande]                      │
│      NOCTURA                                 │  ← Hero
│      Despierta donde tu                      │
│      cuerpo termina                          │
│                                              │
│      [ Descargar en App Store ]              │
│      [ Disponible en Google Play ] (after)   │
│                                              │
│         [Screenshot mockup]                  │
├──────────────────────────────────────────────┤
│                                              │
│  Ciclos completos        Alarma inteligente  │  ← Features (3-4)
│  [icon]                  [icon]              │
│  Calculamos las horas    Te despertamos      │
│  exactas para que...     en sueño ligero...  │
│                                              │
│  Tu rutina               Tu progreso         │
│  [icon]                  [icon]              │
│  Personaliza tus...      Visualiza tus...    │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│        [3 screenshots de la app]             │  ← Screenshots
│                                              │
├──────────────────────────────────────────────┤
│  © 2026 Noctura  ·  Privacidad  ·  Términos  │  ← Footer
└──────────────────────────────────────────────┘
```

### Tecnología

**HTML estático + CSS sin framework.** Una sola página, mobile-first, ~300 líneas. Sin JavaScript necesario (solo si quieres animaciones).

**Por qué no Next.js/React/etc.:** overkill para una landing. Sin build, sin dependencias, deploy instantáneo. Si después necesitas más complejidad (blog, dashboard), migras.

### Páginas mínimas en el sitio

| URL | Contenido |
|---|---|
| `/` | Landing principal |
| `/privacy` | Política de Privacidad (requerida por Apple) |
| `/terms` | Términos y Condiciones |
| `/contact` (opcional) | Email de contacto, formulario simple |

### Hosting

**Cloudflare Pages:**
- Conectar repo de GitHub o subir archivos
- Auto-deploy en cada push
- HTTPS automático
- CDN global
- Gratis para siempre con uso normal

### Copy en español (boilerplate por sección)

**Hero:**
```
Despierta donde tu cuerpo termina.

Calculamos las horas exactas para que despiertes al final
de un ciclo de sueño ligero — no desde lo más profundo.

[Descargar en App Store]
```

**Feature 1 — Ciclos:**
```
Ciclos completos, no solo horas
Tu sueño se organiza en ciclos de ~90 minutos.
Completarlos importa más que la cantidad total.
```

**Feature 2 — Alarma inteligente:**
```
Te despertamos en el momento justo
Tres alertas escalonadas en una ventana de 20 minutos.
Salen desde la fase ligera, no del sueño profundo.
```

**Feature 3 — Rutina:**
```
Tu rutina, tu ritmo
7 pasos para preparar tu noche, personalizables.
Recordatorios automáticos antes de acostarte.
```

**Feature 4 — Estadísticas:**
```
Mide tu progreso real
Anillos de cumplimiento, tendencias y rachas.
Sabes exactamente qué tan bien estás durmiendo.
```

---

## 7. Legal

### 7.1 Privacy Policy — OBLIGATORIA para Apple

Apple Review **rechaza** apps sin Privacy Policy pública y accesible desde la app. Esta es la verdad: sin esto, no entras.

#### Inventario de datos que recoge Sleep Cycles App

| Dato | Dónde se guarda | Por qué | Compartido con |
|---|---|---|---|
| Email | Supabase Auth | Login | Supabase (subprocesador) |
| Nombre para mostrar | Supabase Auth metadata | Personalización | Supabase |
| Edad, peso, altura, género | Tabla `sleep_profiles` (Supabase) | Cálculo de ciclos personalizado | Supabase |
| Cronotipo | `sleep_profiles` + Auth metadata | Ajuste de ventana óptima | Supabase |
| Hora preferida de despertar | `sleep_profiles` | Default en "Despertar a" | Supabase |
| Registros de sueño (bed/wake time, feeling) | Tabla `sleep_log` | Estadísticas | Supabase |
| Rutina pre-sueño | Tabla `sleep_routine_steps` | Personalización | Supabase |
| Tema preferido | AsyncStorage local | UI | Solo el dispositivo |
| Notificaciones programadas | iOS/Android local | Alarmas | Solo el dispositivo |

#### NO recoge

- ❌ Ubicación
- ❌ Contactos
- ❌ Micrófono / cámara
- ❌ Salud / HealthKit *(esto cambia cuando se agregue)*
- ❌ Identificadores publicitarios (IDFA)
- ❌ Crash analytics de terceros (todavía)

#### Derechos del usuario

- Acceso a sus datos (vía la app)
- Modificación (vía la app)
- **Eliminación de cuenta y datos** (ya implementada vía Edge Function `delete-account` con CASCADE delete)
- Portabilidad (futuro: export JSON desde la app)

#### Marco legal aplicable

- **México**: Ley Federal de Protección de Datos Personales en Posesión de Particulares (LFPDPPP)
- **GDPR** si tienes usuarios en EU
- **CCPA** si tienes usuarios en California
- **Apple App Store Review Guidelines** §5.1.1 (Data Collection)

#### Plantilla básica (a ajustar)

```markdown
# Política de Privacidad — {NOMBRE_APP}

Última actualización: {FECHA}

## 1. Quiénes somos
{NOMBRE_APP} es desarrollada por {NOMBRE_PERSONA/EMPRESA}, con domicilio
en {CIUDAD, PAÍS}. Para contacto sobre esta política: {EMAIL}.

## 2. Qué datos recogemos
Cuando usas {NOMBRE_APP} recogemos:

- **Datos de cuenta**: email, nombre para mostrar.
- **Datos de perfil de sueño**: edad, peso, altura, género biológico,
  cronotipo, hora preferida de despertar.
- **Registros de sueño**: hora de acostarse, hora de despertar, sensación
  al despertar (escala 1-3), fecha.
- **Rutina pre-sueño**: pasos personalizados configurados.
- **Datos técnicos locales**: preferencia de tema. No se sincronizan.

No recogemos: ubicación, contactos, micrófono, cámara, identificadores
publicitarios ni datos de redes sociales.

## 3. Para qué los usamos
- Calcular tus ciclos de sueño personalizados.
- Sugerir horas óptimas para dormir y despertar.
- Mostrarte estadísticas e historial de tu sueño.
- Sincronizar tu información entre dispositivos donde inicies sesión.
- Cumplir con obligaciones legales y de seguridad.

No usamos tus datos para publicidad ni los vendemos a terceros.

## 4. Quién procesa tus datos
Usamos los siguientes proveedores (subprocesadores):

- **Supabase Inc.** (Estados Unidos) — almacenamiento de datos de cuenta,
  perfil y registros. Servidor en West US (Oregon).
- **Apple Inc.** / **Google LLC** — distribución de la app y notificaciones
  push locales (no se envían datos a estos proveedores).

## 5. Tus derechos
Puedes en cualquier momento:

- **Acceder** a tus datos desde la sección "Perfil" en la app.
- **Modificar** cualquier dato desde la app.
- **Eliminar tu cuenta** completa desde Perfil → Eliminar cuenta. Al hacerlo,
  borramos todos tus datos de nuestros servidores de forma permanente.
- **Solicitar una copia exportada** de tus datos enviando un correo a
  {EMAIL}. Responderemos en un plazo máximo de 30 días.

Si crees que tratamos tus datos de forma indebida, puedes presentar una
denuncia ante el **INAI** (Instituto Nacional de Transparencia, Acceso a
la Información y Protección de Datos Personales — www.inai.org.mx) en
México, o ante la autoridad equivalente en tu país.

## 6. Retención
Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta,
borramos todos los datos asociados de forma inmediata y permanente, salvo
aquellos que estemos obligados a conservar por ley.

## 7. Seguridad
- Todos los datos viajan cifrados con TLS 1.2+.
- La base de datos aplica Row Level Security: solo tu cuenta puede leer
  o modificar tus propios datos.
- Las contraseñas se almacenan con hash bcrypt (estándar de Supabase Auth).

## 8. Menores de edad
{NOMBRE_APP} no está dirigida a menores de 13 años. No recogemos datos
de menores deliberadamente. Si descubres que un menor de 13 años ha
creado una cuenta, contáctanos para eliminar sus datos.

## 9. Cambios a esta política
Podemos actualizar esta política. Te notificaremos cambios significativos
dentro de la app antes de que tomen efecto.

## 10. Contacto
Para cualquier pregunta sobre privacidad: {EMAIL}
```

### 7.2 Términos y Condiciones — recomendado

No estrictamente obligatorio para Apple si no cobras, pero **muy recomendado** desde el día 1. Cuando cobras se vuelve obligatorio.

#### Plantilla básica

```markdown
# Términos y Condiciones — {NOMBRE_APP}

Última actualización: {FECHA}

## 1. Aceptación
Al crear una cuenta o usar {NOMBRE_APP} aceptas estos términos. Si no
estás de acuerdo, no uses la app.

## 2. Descripción del servicio
{NOMBRE_APP} es una herramienta informativa que calcula recomendaciones
de horarios de sueño en base a los datos que tú ingresas. **No es un
dispositivo médico, no diagnostica ni trata condiciones del sueño**, y
no debe usarse como sustituto de consulta médica profesional.

Si tienes preocupaciones sobre tu sueño (insomnio crónico, apnea, etc.),
consulta a un médico.

## 3. Tu cuenta
- Debes ser mayor de 13 años para crear una cuenta.
- Eres responsable de mantener tu contraseña segura.
- Eres responsable de toda actividad en tu cuenta.
- Datos falsos pueden resultar en suspensión.

## 4. Uso aceptable
Acepta no:

- Usar la app para fines ilegales.
- Intentar acceder a cuentas de otros usuarios.
- Hacer ingeniería inversa, descompilar o modificar la app.
- Sobrecargar nuestros servidores con peticiones automatizadas.

## 5. Propiedad intelectual
El código, diseño, marca y contenido de {NOMBRE_APP} son propiedad
de {NOMBRE_PERSONA/EMPRESA}. Tus datos personales y registros son tuyos
— los almacenamos para servirte pero no los reclamamos como nuestros.

## 6. Disponibilidad y cambios
Puede haber interrupciones por mantenimiento. Podemos modificar o
discontinuar funciones avisando con antelación razonable.

## 7. Limitación de responsabilidad
{NOMBRE_APP} se ofrece "tal cual". No nos hacemos responsables de:

- Decisiones que tomes basadas en las recomendaciones de la app.
- Pérdida de datos por causas fuera de nuestro control (fallas de
  Internet, problemas con Supabase, etc.).
- Daños directos o indirectos derivados del uso de la app.

Esta cláusula no excluye responsabilidades que no puedan excluirse por
ley aplicable.

## 8. Terminación
Puedes eliminar tu cuenta en cualquier momento desde la app. Podemos
suspender cuentas que incumplan estos términos, notificándote con
antelación cuando sea razonable.

## 9. Cambios a estos términos
Podemos actualizar estos términos. Cambios significativos serán
notificados dentro de la app antes de que tomen efecto.

## 10. Ley aplicable
Estos términos se rigen por las leyes de {PAÍS/ESTADO}. Cualquier
disputa será resuelta en los tribunales de {CIUDAD, PAÍS}.

## 11. Contacto
{EMAIL}
```

### 7.3 Disclaimer importante

Estas plantillas son un **buen punto de partida** que cubre los puntos estándar que Apple pide y la mayoría de regulaciones de privacidad. **No son asesoría legal**. Antes de monetizar (cuando integres pagos) conviene que un abogado mexicano (o de tu jurisdicción) las revise. Costo típico: $100-300 USD una sola vez.

---

## 8. HealthKit reads (siguiente feature técnico)

Después del lanzamiento gratis, la siguiente prioridad es integrar lectura de HealthKit. Esto pasa la app de "calculadora de ciclos" a "tracker de sueño con análisis" — wedge técnico real para justificar suscripción después.

### Qué se puede integrar

| Funcionalidad | Viable | Esfuerzo | Valor |
|---|---|---|---|
| **Leer "Análisis del sueño"** del Health app | ✅ Sí | 1 sesión | Alto — alimenta el diario automáticamente |
| **Escribir registros manuales a Health** | ✅ Sí | 0.5 sesión adicional | Medio — centraliza datos del usuario |
| **Leer heart rate during sleep** | ✅ Sí | 1 sesión adicional | Medio — métricas avanzadas |
| **Detección de fases reales** (deep/REM/ligero) | ⚠️ Parcial | 2 sesiones | Alto — pero depende de qué Watch escribe |
| **Mindful minutes integration** | ✅ Sí | 0.5 sesión | Bajo |

### Permisos necesarios

En `app.json` se agregan:

```json
"ios": {
  "infoPlist": {
    "NSHealthShareUsageDescription": "Leemos tus registros de sueño para complementar tus estadísticas con datos reales.",
    "NSHealthUpdateUsageDescription": "Guardamos tus registros manuales en Salud para que tengas tus datos centralizados."
  },
  "entitlements": {
    "com.apple.developer.healthkit": true,
    "com.apple.developer.healthkit.access": ["health-records"]
  }
}
```

Requiere **prebuild + EAS build** porque toca config nativa. No funciona en Expo Go.

### Librería recomendada

- **`@kingstinct/react-native-healthkit`** — mantenida, moderna, TypeScript completo
- Alternativa: `react-native-health` (más antigua pero más usada)

### Limitaciones

- Solo iOS. Android tiene Google Fit / Health Connect que requieren integración separada.
- El usuario debe **autorizar explícitamente** desde la app la primera vez.
- Apple Watch tiene que estar configurado para grabar sueño (la mayoría de Watch lo hacen automáticamente desde watchOS 9+).

### Cuando volver a Claude Code para esto

Después de definir nombre + landing + legal. La integración la hago yo en una sesión de Claude Code una vez que ya tengas el nombre nuevo aplicado al `app.json`.

---

## 9. Apple Watch app standalone — opcional para mucho después

No recomiendo esto pronto:

- Expo no soporta WatchOS targets directamente. Requiere config plugin custom o eject parcial.
- React Native en Watch es experimental y limitado.
- La alternativa práctica: tu app lee de HealthKit. Cualquier Watch (Apple, Samsung Health, Fitbit que sincroniza) que escriba a Health alimenta tu app. No necesitas tu propia Watch app para empezar.
- Si después quieres una Watch app dedicada, suele hacerse nativo con SwiftUI como proyecto aparte que comparte data con la app principal.

**Decisión recomendada:** olvidarse de Watch app standalone por al menos 6 meses. HealthKit reads cubre el 80% del valor.

---

## 10. Cuenta de Apple Developer y App Store Connect

### 10.1 Apple Developer Program

- **Costo:** $99 USD/año
- **Necesario para:** subir cualquier app al App Store (incluso gratis)
- **Tiempo de activación:** 24-48h después de pagar
- **Inscripción:** https://developer.apple.com/programs/enroll

Requisitos:
- Apple ID con autenticación de dos factores
- Si te inscribes como individuo: nombre legal coincidiendo con tarjeta de pago
- Si te inscribes como empresa: D-U-N-S Number (gratis en https://developer.apple.com/support/D-U-N-S/)

### 10.2 App Store Connect — crear la app

Una vez activo Developer Program, en https://appstoreconnect.apple.com:

1. **My Apps → +** → New App
2. **Platforms:** iOS
3. **Name:** {NOMBRE_APP} (máximo 30 caracteres, sin "free", "best", etc.)
4. **Bundle ID:** `com.bgachuzd.sleepcyclesapp` (ya configurado en `app.json` — verificar que coincida) — esto es **inmutable** una vez creado
5. **SKU:** identificador interno tuyo (ej. `noctura-ios-001`)
6. **User Access:** Full Access

### 10.3 Metadata para el listing

Antes de submit a review necesitas tener:

| Campo | Detalles |
|---|---|
| **Subtitle** | 30 chars. Ej: "Despierta en ciclo ligero" |
| **Promotional text** | 170 chars, actualizable sin re-submit |
| **Description** | Hasta 4000 chars |
| **Keywords** | 100 chars, separados por coma. SEO de App Store |
| **Support URL** | URL de soporte (tu landing + `/contact` sirve) |
| **Marketing URL** | URL de marketing (tu landing principal) |
| **Privacy Policy URL** | OBLIGATORIO — tu `/privacy` |
| **Screenshots** | 6.7" iPhone (1290x2796 portrait) — mínimo 3, máximo 10. Hechos desde tu app en iPhone 16 Pro Max |
| **App Preview videos** | Opcional. Hasta 30 segundos. Recomendado |
| **App icon** | El 1024x1024 que ya tienes |
| **Category** | Primary: "Health & Fitness". Secondary: "Lifestyle" |
| **Age rating** | Probablemente 4+ (no contiene material restringido) |
| **Privacy Nutrition Labels** | Declarar qué datos recoges. Crítico — Apple verifica que coincida con tu Privacy Policy |

### 10.4 Privacy Nutrition Labels (App Privacy)

Declaras en App Store Connect, basado en el inventario de la sección 7:

| Data type | Used for tracking | Linked to user | Linked across apps |
|---|---|---|---|
| Email Address | No | Yes (Account) | No |
| Name | No | Yes (Account) | No |
| Health & Fitness (other) | No | Yes (perfil + registros) | No |

Marca "No" en advertising tracking (no recoges IDFA), analytics de terceros, etc.

### 10.5 TestFlight

Antes de submit a App Store, **siempre** prueba en TestFlight:

1. Build EAS con `--profile production`
2. Submit a App Store Connect
3. Procesamiento (~30 min - 2h)
4. Agregar testers (internal hasta 100 personas con tu Apple ID + email)
5. Probar el flujo completo
6. Solo entonces, submit a App Store review

---

## 11. Roadmap secuenciado

Estimaciones realistas. Las marcadas **(Web)** son trabajo que se hace fuera del editor (Claude conversacional, browser, herramientas externas). Las marcadas **(Code)** son trabajo en Claude Code.

| # | Tarea | Quién | Tiempo |
|---|---|---|---|
| 1 | Decidir nombre + verificar dominio + verificar App Store | Tú (Web) | 1-2 días |
| 2 | Comprar dominio | Tú | 10 min |
| 3 | Crear cuenta Apple Developer | Tú | 24-48h activación |
| 4 | Producir logo + icono + assets | Tú con diseñador / herramienta | 3-7 días |
| 5 | Ajustar `app.json` con nombre nuevo + assets | Claude Code | 30 min |
| 6 | Generar Privacy + Terms en formato HTML | Claude Web → archivos | 1h |
| 7 | Generar landing HTML | Claude Web → archivos | 2-3h |
| 8 | Deploy landing en Cloudflare Pages | Tú | 30 min |
| 9 | Apuntar dominio a Cloudflare Pages | Tú | 15 min + propagación DNS |
| 10 | Actualizar URLs en `SettingsScreen.tsx` y código | Claude Code | 10 min |
| 11 | Crear app en App Store Connect | Tú | 30 min |
| 12 | Producir screenshots de la app | Tú | 1-2h |
| 13 | Llenar metadata + Privacy Nutrition Labels en ASC | Tú | 1h |
| 14 | Build EAS production iOS | Claude Code + tú | 30 min + cola de build |
| 15 | Submit a TestFlight | Tú | 15 min |
| 16 | Probar TestFlight con testers internos | Tú + amigos | 1-2 semanas |
| 17 | Iterar bugs encontrados | Claude Code | variable |
| 18 | Submit a App Store review | Tú | 15 min |
| 19 | Esperar review | Apple | 1-3 días típico |
| 20 | **LANZAMIENTO GRATIS** | — | — |
| 21 | Recoger feedback y métricas | Tú | 1-3 meses |
| 22 | Integrar HealthKit reads | Claude Code | 1-2 sesiones |
| 23 | Nueva version 1.1 con HealthKit a TestFlight | Claude Code + tú | 30 min |
| 24 | Decidir si meter premium con datos en mano | Tú | semana de análisis |
| 25 | (Si premium) Integrar RevenueCat + paywall | Claude Code + tú | 1 semana |

**Tiempo total realista hasta lanzamiento gratis:** 3-5 semanas si trabajas part-time, 1-2 semanas full-time.

---

## 12. Preguntas para resolver (en Claude Web)

Estas son las decisiones que NO requieren código y conviene aterrizar antes de volver a Claude Code:

### 12.1 Branding

1. **Nombre final** (de la lista de 15 o uno nuevo)
2. **Tagline** definitiva (1-2 opciones)
3. **Concepto del logo** (luna, círculos concéntricos, abstracto, lettering puro)
4. **Tono de marca** (¿más técnico-científico, más cálido-poético, más funcional-directo?)

### 12.2 Legal

5. **Tu nombre legal completo** o nombre de empresa (para Privacy Policy)
6. **Email de contacto público** (puede ser `hola@tudominio.com` o tu personal)
7. **Ciudad/estado/país** de operación (para ley aplicable)
8. **Edad mínima de uso** (13 default, podrías querer 16 si apuntas a EU para evitar consideraciones GDPR infantil)

### 12.3 Landing

9. **Copy de cada feature** (puedo darte boilerplate, pero conviene ajustar a tu voz)
10. **Screenshots** que vas a mostrar (cuáles pantallas son las "hero" para el listing y la landing)
11. **¿Hay sección "Acerca de mí"?** Algunos solo-devs lo ponen para humanizar la marca
12. **¿Newsletter signup?** (recolectar emails antes del lanzamiento — opcional pero valioso)

### 12.4 Producto futuro

13. **HealthKit: cuándo integrarlo** — ¿antes del primer lanzamiento (delay 1 semana extra pero app más fuerte) o después (lanzas más rápido y vas iterando)?
14. **Plan de feedback**: ¿cómo vas a recolectar feedback de los primeros usuarios? (formulario en la app, Discord, Telegram, encuestas)
15. **Métrica norte**: ¿qué número defines como "exitoso" en los primeros 3 meses? (downloads, DAU, retención semanal, etc.)

---

## 13. Cuándo volver a Claude Code

Las tareas técnicas concretas que requieren tocar código:

1. **Actualizar `app.json`** con nombre nuevo + bundle ID si cambia + iconos nuevos en `assets/`
2. **Actualizar `package.json`** con el nombre nuevo
3. **Actualizar `SettingsScreen.tsx`**: constantes `LANDING_URL`, `PRIVACY_URL`, `TERMS_URL` con las URLs reales
4. **Actualizar `RootStackParamList`** y nombres de pantallas si decides cambiar algún display name
5. **Actualizar `CONTEXTO_PROYECTO.md`** con el rename
6. **Integración HealthKit** (cuando lo decidas)
7. **Configuración EAS Build** + secrets
8. **Submit con `eas submit`**
9. **(Después)** integración RevenueCat + PaywallScreen

---

## 14. Referencias útiles

- **App Store Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **App Store Connect Help:** https://developer.apple.com/help/app-store-connect/
- **HealthKit docs:** https://developer.apple.com/documentation/healthkit
- **Expo EAS docs:** https://docs.expo.dev/eas/
- **RevenueCat docs:** https://www.revenuecat.com/docs (para después)
- **Privacy Nutrition Labels guide:** https://developer.apple.com/app-store/app-privacy-details/
- **Disponibilidad de dominios:** https://instantdomainsearch.com
- **Búsqueda de marcas (México):** https://eservices.impi.gob.mx
- **Búsqueda de marcas (USA):** https://tmsearch.uspto.gov
- **Apple Sandbox Test Accounts:** https://appstoreconnect.apple.com/access/testers

---

_Documento generado para trabajo estratégico. Iterar en conversación tipo Claude Web. Cuando una decisión requiera tocar código en este repo, traer la decisión específica a Claude Code._

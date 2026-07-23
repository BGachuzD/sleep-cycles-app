# Plan de Fase 5 — Acompañamiento, profundidad y Premium

> **Estado de partida (2026-07-20):** Fases 1-4 completas. App validada en dispositivo físico y en camino a TestFlight (branch `healthkit`). typecheck limpio. Backend Supabase con RLS + HealthKit (lectura de sueño) + notificaciones locales.

**Avance (2026-07-20):**

- ✅ **Sprint 0** — abstracción Premium (`usePremium`, `EntitlementsContext`, `PremiumHint`), Premium card de Settings ruteada por `presentPaywall`.
- ✅ **Sprint 1** — Bitácora de sueños (migración `sleep_log`, UI en `SleepLogScreen`, topes del tier gratuito). ⚠️ Falta aplicar la migración al remoto con `supabase db push`.
- ✅ **Sprint 2** — Motor `sleepInsights.ts` + infraestructura de tests (jest + ts-jest, `pnpm test`).
- ✅ **Sprint 3** — completo: `InsightCard` + "Tu coach" en Home, `achievements.ts` + tira de logros en Stats, estado vacío guiado, resumen semanal (`weeklyRecap.ts` + `WeeklyRecapCard` + notificación dominical), voz de coach en el recordatorio diario, y **metas** (`sleepGoal.ts` + `useSleepGoals` + `SleepGoalsContext` + `GoalCard` en Home).
- 🔄 **Sprint 4 (groundwork listo)** — hecho en código: paywall real (`Paywall.tsx`, reemplaza el `Alert`), capa de compras aislada (`src/lib/purchases.ts`, hoy en modo stub inerte), `EntitlementsContext` consumiendo esa capa, `PaywallHost` montado en `App.tsx`. **Pendiente (tu setup manual):** cuenta RevenueCat + productos en App Store Connect + instalar `react-native-purchases` + EAS build — pasos en `ACTIVAR_REVENUECAT.md`.
- ⏳ **Fase 6** (IA de sueños, extra Premium) sin empezar.

> ⚠️ **Dos migraciones creadas pero NO aplicadas al remoto** — hay que correr `supabase db push`: `20260720000000_dream_journal.sql` (bitácora) y `20260720000001_sleep_goals.sql` (metas). Hasta entonces, bitácora y metas funcionan solo con caché local; no persisten en Supabase.

## Objetivo de la fase

Convertir Mimebien de "una app que calcula horarios y registra noches" en **una app que te acompaña**: que nunca se sienta como un formulario vacío, que refleje tu progreso de vuelta y que te dé retroalimentación personalizada para dormir mejor.

Tres bloques, en orden de dependencia:

1. **Bitácora de sueños** — enriquece los datos por noche.
2. **Motor de insights** (`sleepInsights.ts`) — lee esos datos y produce consejos.
3. **Acompañamiento / seguimiento** — presenta 1 y 2 como una experiencia continua.

En paralelo, un bloque transversal: **arquitectura Premium desde el diseño**.

## Principios de la fase (decisiones ya tomadas)

- **v1 es 100% heurístico.** Cero IA real en la primera iteración. Todo se calcula con reglas sobre datos locales/Supabase. Sin backend nuevo, sin costo por uso.
- **La IA de sueños es un extra Premium de Fase 6**, no de esta fase. Se deja el hueco arquitectónico, no la implementación.
- **Premium se diseña desde ya.** Cada función nace declarando si es gratis o premium; el gating se construye como abstracción desde el sprint 0, aunque el paywall real se cablee más tarde.
- **El acompañamiento es el eje.** Es la razón de ser de la fase (ver §"Cómo se logra el acompañamiento").
- **Respetar las convenciones existentes** (`CONTEXTO_PROYECTO.md`): dominio puro en `src/domain/*`, toda I/O de Supabase en `src/services/*`, hooks que orquestan estado + AsyncStorage namespaced por `userId`, migraciones idempotentes con RLS, sin emojis en pantallas funcionales, formato 12h a.m./p.m., paleta violeta + tokens, motion iOS con `usePressScale`, pnpm, TypeScript estricto.

---

## Modelo Free vs Premium

El **loop completo de acompañamiento base es gratis** (es el gancho de retención que alimenta la conversión). Premium es _profundidad_ + el _extra_ de IA.

| Área             | Gratis                                                                                          | Premium (Mimebien Premium)                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Bitácora**     | Soñé/no soñé, mood (bueno/malo), 1 nota corta, tags de lista curada limitada, 1 sueño por noche | Nota larga, tags ilimitados, **varios sueños por noche**, intensidad emocional, búsqueda en el diario |
| **Insights**     | 3-4 reglas base (deuda, racha, regularidad simple, consejo rotativo), 1 tarjeta en Home         | Correlaciones profundas (sueño ↔ hábitos ↔ sueños), regularidad avanzada, insights ilimitados         |
| **Tendencias**   | Últimas 14 noches (ya existe)                                                                   | Vista mensual y anual, comparativas                                                                   |
| **Metas**        | 1 meta activa                                                                                   | Metas múltiples + coach proactivo (más nudges personalizados)                                         |
| **Reportes**     | —                                                                                               | Exportar/reporte PDF de tu sueño                                                                      |
| **IA de sueños** | —                                                                                               | Interpretación del texto del sueño (Fase 6)                                                           |

Regla de diseño: si algo mejora la **retención de todos**, va gratis. Si es **profundidad o análisis avanzado**, va a Premium.

---

## Bloque transversal — Arquitectura Premium

**Meta:** que en los sprints 1-3 cada función pueda declarar su tier con una sola línea, aunque el cobro real se conecte en el sprint 4.

### Enfoque técnico

- **RevenueCat** (`react-native-purchases` + config plugin de Expo). Envuelve StoreKit, maneja suscripciones, entitlements y recibos. Requiere módulo nativo → dev build de EAS (ya lo usamos).
- **Fuente de verdad del entitlement:** `CustomerInfo.entitlements.active['premium']` de RevenueCat, leído en cliente. Para un dev solo es suficiente en MVP; opcionalmente se cachea `is_premium` en Supabase vía webhook más adelante.
- **Productos** en App Store Connect: suscripción mensual + anual, entitlement `premium`.

### Piezas a construir

| Pieza                                 | Qué                                                                                                                                                   | Cuándo                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/context/EntitlementsContext.tsx` | Provider que expone `{ isPremium, isLoading, presentPaywall() }`. Se agrega a la cadena de `App.tsx` **después de `AuthProvider`**                    | Sprint 0 (esqueleto que devuelve `isPremium=false`) → Sprint 4 (RevenueCat real) |
| `usePremium()` hook                   | Azúcar sobre el context                                                                                                                               | Sprint 0                                                                         |
| `<PremiumGate>` / `requirePremium()`  | Componente/patrón para envolver funciones premium (muestra lock + CTA a paywall si no premium)                                                        | Sprint 0                                                                         |
| Paywall (sheet o screen)              | Presentación de planes + compra + restaurar                                                                                                           | Sprint 4                                                                         |
| Cablear Premium card                  | Reemplazar el `Alert.alert('Próximamente')` de `SettingsScreen.tsx` por `presentPaywall()`; corregir copy "Sleep Cycles Premium" → "Mimebien Premium" | Sprint 4                                                                         |

> **Nota:** "diseñar Premium desde ya" significa construir la _abstracción_ (`usePremium` + `PremiumGate`) en el sprint 0 para que todo el código de los sprints 1-3 ya la use. El _cobro_ (RevenueCat + paywall + productos en App Store Connect) se cablea en el sprint 4, cuando ya hay contenido premium que vender. Así "diseñado desde el inicio" no significa "esfuerzo de IAP desperdiciado antes de tiempo".

---

## Bloque 1 — Bitácora de sueños

**Viabilidad: ALTA.** Es la pieza más autocontenida y genera los datos que consume el Bloque 2.

### Modelo de datos

MVP = **columnas nullable sobre `sleep_log`** (1 sueño por noche). Encaja en el formulario que ya existe y hereda la RLS de la tabla (`FOR ALL ... auth.uid() = user_id`).

Migración nueva en `supabase/migrations/` (idempotente):

```sql
alter table sleep_log
  add column if not exists dreamed     boolean,
  add column if not exists dream_mood  smallint,   -- 1=malo 2=bueno (nullable)
  add column if not exists dream_tags  text[],
  add column if not exists dream_note  text;
```

Ruta de crecimiento (Premium, más adelante): tabla `dream_entries (user_id, id, date, ...)` para **varios sueños por noche** + búsqueda. No se construye ahora; el MVP de columnas no bloquea esa migración.

### Código a tocar

- `src/domain/sleepLog.ts` — extender `SleepLogEntry` con los campos opcionales de sueño + una lista curada `DREAM_TAGS`.
- `src/services/sleepLogService.ts` — ampliar `rowToEntry` / `entryToRow` con las columnas nuevas.
- `src/screens/SleepLogScreen.tsx` — sección plegable "Diario de sueños" bajo el bloque de feelings: chip soñé/no soñé → si soñó, aparece mood (bueno/malo con el mismo lenguaje de `FeelingChip`), tags (chips de `DREAM_TAGS`), nota. Nota larga y tags ilimitados van tras `<PremiumGate>`.

No requiere context ni hook nuevo: la bitácora vive dentro de `SleepLogContext`/`useSleepLog` porque son columnas de la misma fila.

### Entregable

Registrar una noche puede incluir opcionalmente el sueño; el historial (`HistoryCard`) muestra un indicador si esa noche tuvo sueño registrado.

---

## Bloque 2 — Motor de insights (`sleepInsights.ts`)

**Viabilidad: MEDIA-ALTA.** Es el corazón nuevo de la fase y hoy no existe. Es un módulo de dominio **puro**, gemelo de `computeStats`.

### Diseño

```ts
// src/domain/sleepInsights.ts
export interface Insight {
  id: string;
  category: 'debt' | 'regularity' | 'streak' | 'correlation' | 'tip';
  severity: 'positive' | 'neutral' | 'warning';
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  cta?: { label: string; screen: keyof AppDrawerParamList };
  premium?: boolean;
}

export function computeInsights(
  entries: SleepLogEntry[],
  profile: SleepProfile,
): Insight[];
```

### Reglas base (gratis)

1. **Deuda de sueño** — ya calculada en `computeStats`; convertirla en mensaje accionable.
2. **Regularidad de horario** — varianza de `bedTimeISO`/`wakeTimeISO`. "Tu hora de despertar varía ±90 min; fijarla mejora el descanso." Métrica potente y poco explotada.
3. **Correlación sensación ↔ hábito** — "Tus mejores noches (feeling=3) fueron cuando te acostaste antes de las 23:00."
4. **Racha / tendencia** — refuerzo positivo cuando la racha sube.
5. **Consejo rotativo** — biblioteca de contenido curado estático (`SLEEP_TIPS`: cambia almohadas, cafeína < 15:00, pantallas -1h). Esfuerzo casi nulo, alto valor percibido; solo redacción.

### Reglas Premium (marcadas `premium: true`)

- Correlaciones profundas sueño ↔ mood del sueño ↔ hábitos.
- Regularidad avanzada (índice) y tendencias mensuales/anuales.

### Gating por volumen de datos

Las correlaciones necesitan ~2-3 semanas para no decir tonterías. El motor **gatea por número de noches**: con pocos datos devuelve insights de progreso ("te faltan N noches para tu primer análisis") en vez de correlaciones. Esto enlaza directo con el Bloque 3.

### Tests

Al ser dominio puro, se cubre con unit tests (Jest) — cierra además el pendiente de "tests de dominio" que venía arrastrándose. Casos: sin datos, pocos datos (gating), datos suficientes por cada regla.

---

## Bloque 3 — Acompañamiento y seguimiento (el eje)

**Viabilidad: ALTA.** Es sobre todo producto/UX sobre datos existentes + presentación del Bloque 2.

### Cómo se logra el acompañamiento (el "cómo" concreto)

"Acompañamiento" no es una feature, es la suma de cuatro mecanismos. Estos son los que hacen que la app se sienta como que camina contigo:

1. **Siempre hay un siguiente paso** — nunca una pantalla vacía muerta. Cada estado vacío se convierte en un objetivo guiado con progreso ("Registra 3 noches para desbloquear tu primer análisis").
2. **Te refleja de vuelta** — la app te muestra _tu_ progreso personalizado: tu semana, tu racha, tu mejor noche, tu tendencia. No datos genéricos.
3. **Celebra tus hitos** — logros y micro-celebraciones (primera semana, racha de 7, 30 noches) que reconocen el avance.
4. **Habla con voz de coach** — el microcopy y las notificaciones dejan de sonar a formulario y pasan a un tono cercano y alentador.

Las piezas concretas, ordenadas por relación esfuerzo/impacto:

| Pieza                              | Qué                                                                                                                       | Mecanismo             | Notas técnicas                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Estados vacíos guiados**         | Reemplazar "Sin datos aún" (Stats) y "Aún no hay registros" (SleepLog) por un progreso con barra hacia el primer análisis | (1) Siguiente paso    | Usa el gating del Bloque 2                                                                                             |
| **Tarjetas de coach en Home**      | Carrusel/tarjeta rotativa con el output de `computeInsights`                                                              | (2) Reflejo           | El Home ya tiene el patrón `AnchorCard`; agregar una `InsightCard`                                                     |
| **Resumen semanal**                | Tarjeta "Tu semana" + notificación de domingo con recap                                                                   | (2) Reflejo + (4) Voz | `computeStats` ya da los números. **Cuidar el presupuesto de notificaciones** (ver riesgos)                            |
| **Logros / hitos**                 | Badges por milestones derivados de los datos                                                                              | (3) Celebración       | Derivar on-the-fly de `entries` en MVP (sin migración); persistir solo si se quieren fechas de desbloqueo/notificación |
| **Metas**                          | Fijar objetivo (hora de dormir o duración) y trackear adherencia                                                          | (1) + (2)             | Tabla `sleep_goals` o campo en perfil. 1 meta gratis / múltiples Premium                                               |
| **Voz de coach en notificaciones** | Más allá del seco "¿Cómo dormiste?": mensajes contextuales ("Vas 4 noches de racha, no la rompas")                        | (4) Voz               | Reescribir bodies en `scheduler.ts` respetando el límite de 64                                                         |

### Nuevo estado a introducir

- `useGoals` / `GoalsContext` (si se hace tabla `sleep_goals`) — siguiendo el patrón de `useSleepLog`.
- Logros: un módulo de dominio puro `src/domain/achievements.ts` que deriva `Achievement[]` de `entries` (sin I/O en MVP).

---

## Roadmap por sprints

Cada sprint es un incremento entregable y probable en TestFlight.

### Sprint 0 — Fundaciones Premium (abstracción)

- `EntitlementsContext` (esqueleto, `isPremium=false`), `usePremium`, `<PremiumGate>`.
- Definir en código el mapa Free/Premium.
- **Sin RevenueCat todavía.** Entregable: abstracción lista para que la usen los siguientes sprints.

### Sprint 1 — Bitácora de sueños

- Migración `sleep_log` (columnas de sueño) + `supabase db push`.
- Dominio + service + UI plegable en `SleepLogScreen`.
- Nota larga / tags ilimitados tras `<PremiumGate>`.

### Sprint 2 — Motor de insights

- `src/domain/sleepInsights.ts` con las 4-5 reglas base + `SLEEP_TIPS`.
- Unit tests del motor (cierra pendiente de tests de dominio).
- Reglas premium marcadas pero no bloqueantes.

### Sprint 3 — Acompañamiento

- Estados vacíos guiados (Stats + SleepLog).
- `InsightCard` en Home.
- Resumen semanal (tarjeta + notificación dominical).
- Logros (`achievements.ts` + UI).
- Metas (`sleep_goals` + `useGoals` + UI).
- Reescritura de voz en notificaciones.

### Sprint 4 — Monetización real

- Integrar RevenueCat (config plugin + dev build).
- Productos en App Store Connect (requiere acuerdos de Paid Apps + tax/banking).
- Paywall + cablear Premium card de `SettingsScreen` + corregir copy a "Mimebien Premium".
- Activar los `<PremiumGate>` sembrados en sprints 1-3.

### Fase 6 (posterior) — IA de sueños (extra Premium)

- Edge Function de Supabase (ya hay precedente: `supabase/functions/delete-account`) que llama a la Claude API para interpretar el texto del sueño.
- Implica: costo por llamada, los sueños son **datos personales sensibles** → actualizar Privacy Nutrition Labels y declarar el envío a un tercero.
- Solo se ofrece a usuarios Premium.

### Dependencias

```
Sprint 0 (Premium abstract) ─┐
                             ├─► Sprint 1 (Bitácora) ─► Sprint 2 (Insights) ─► Sprint 3 (Acompañamiento) ─► Sprint 4 (Cobro) ─► Fase 6 (IA)
                             ┘
```

Sprints 1-3 usan la abstracción del 0 pero no dependen del cobro del 4: puedes shippear acompañamiento a TestFlight antes de tener el paywall listo.

---

## Riesgos y prerrequisitos

1. **Límite de 64 notificaciones iOS.** Ya se usan: alarma inteligente (3 por alarma) + recordatorio diario (1). El resumen semanal y los nudges de coach deben caber en ese presupuesto. Preferir triggers recurrentes (`DAILY`/`WEEKLY`) sobre muchos one-offs; nunca programar rachas de nudges.
2. **Setup de Apple IAP.** RevenueCat necesita productos creados en App Store Connect + acuerdo de Paid Applications + datos fiscales/bancarios. Es trámite, hazlo antes del Sprint 4.
3. **Privacidad de la bitácora.** Los sueños son datos sensibles. Aun sin IA, guardar texto de sueños obliga a revisar los Privacy Nutrition Labels (ya declaras Health por HealthKit).
4. **Volumen de datos para insights.** Sin gating, el motor dirá tonterías con 2 noches. El gating por volumen (Bloque 2) es obligatorio, no opcional.
5. **Tests + CI pendientes.** El motor de insights es la excusa perfecta para arrancar los unit tests de dominio que vienen aplazados desde Fase 3; considera añadir CI (typecheck + tests) en esta fase.
6. **Migraciones.** Aplicar con `supabase db push` al remoto `xdmazedmeeyaxjwyckoz`; mantenerlas idempotentes como las existentes.

---

## Definición de "hecho" de la fase

- Registrar una noche puede incluir su sueño (mood + tags + nota).
- Home muestra al menos un insight personalizado real cuando hay datos suficientes.
- Ningún estado vacío se siente como un formulario: todos guían al siguiente paso.
- Existe resumen semanal, logros y al menos una meta.
- La abstracción Premium está sembrada en todo el código nuevo; el paywall funciona (Sprint 4).
- El motor de insights tiene unit tests.

---

_Documento inicial de Fase 5. Refleja las decisiones acordadas: v1 heurístico, Premium diseñado desde el inicio (IA como extra de Fase 6), orden Bitácora → Insights → Acompañamiento, con el acompañamiento como eje de la fase._

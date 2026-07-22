# Sistema visual

La aplicación usa un sistema centralizado y semántico:

- `theme.ts`: paleta, espaciado, radios, tipografía, movimiento y sombras para los modos oscuro y claro.
- `ThemeProvider.tsx`: preferencia global (`dark`, `light` o `auto`) y hook `useAppTheme()`.
- `../components/ui/`: primitives reutilizables para superficies, botones, cabeceras, listas, avatares, estados vacíos y overlays.

El modo inicial es oscuro. La paleta principal se construye con cuatro niveles de azul grisáceo, texto de alto contraste y acentos índigo, violeta y azul pastel.

## Uso

```tsx
const { theme } = useAppTheme();

<View
  style={{
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  }}
/>;
```

Para patrones comunes, importa desde `@/components/ui` en lugar de repetir estilos:

```tsx
import { EmptyState, PillButton, RoundedCard } from '@/components/ui';
```

Mantén áreas táctiles de al menos 44 px, usa `theme.motion.pressScale` para feedback de presión y evita colores, radios o sombras hardcodeados en pantallas nuevas.

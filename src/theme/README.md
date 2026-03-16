# Theme System

Este proyecto ya tiene una base centralizada para tema en:

- `src/theme/theme.ts`: tokens semánticos (`background`, `surface`, `textPrimary`, etc.) y definiciones `light`/`dark`.
- `src/theme/ThemeProvider.tsx`: estado global de modo (`auto`, `light`, `dark`) y hook `useAppTheme()`.

## Uso recomendado en screens/components

1. Obtén el tema:

```tsx
const { theme } = useAppTheme();
```

2. Crea estilos con fábrica:

```tsx
const styles = useMemo(() => createStyles(theme), [theme]);
```

3. Evita hex hardcodeados y usa `theme.colors.*`.

## Modos soportados

- `auto`: cambia por hora local del dispositivo (`07:00-18:59 => light`, otro horario => `dark`).
- `light`
- `dark`

## Siguiente iteración sugerida

- Guardar preferencia de tema del usuario en storage o perfil remoto.
- Agregar selector de tema en pantalla de configuración/perfil.
- Terminar la migración de todas las screens para eliminar colores hardcodeados restantes.

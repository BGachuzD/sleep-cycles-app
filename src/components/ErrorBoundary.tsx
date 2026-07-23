import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { logger } from '@/lib/logger';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Captura errores de render de todo el árbol para que un fallo aislado muestre
 * una pantalla de recuperación en vez de dejar la app en blanco. Debe ser un
 * componente de clase: React solo soporta error boundaries de esta forma.
 *
 * El fallback usa estilos propios (no depende del tema ni de otros providers)
 * para seguir funcionando aunque el error provenga de esas capas.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Error no capturado en el árbol de React', error, info);
  }

  private readonly handleReset = () => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Algo salió mal</Text>
        <Text style={styles.message}>
          Ocurrió un error inesperado. Intenta de nuevo.
        </Text>
        <Pressable
          style={styles.button}
          onPress={this.handleReset}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#121620',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  message: {
    color: '#B4B9C6',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

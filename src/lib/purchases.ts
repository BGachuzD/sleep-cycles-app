// src/lib/purchases.ts
//
// Capa de compras (Fase 5, Sprint 4). Aísla TODA la interacción con el SDK de
// pagos detrás de esta interfaz, para que el resto de la app (EntitlementsContext,
// Paywall) no dependa de RevenueCat directamente.
//
// ESTADO ACTUAL: "no configurado" (stub). La app funciona igual que hoy —sin
// premium— y el paywall muestra su estado de "próximamente". Nada llama al SDK
// nativo, así que no hace falta un build nuevo ni desestabiliza TestFlight.
//
// PARA ACTIVAR (ver ACTIVAR_REVENUECAT.md):
//   1. pnpm add react-native-purchases  (+ config plugin en app.json)
//   2. Crear productos en App Store Connect + entitlement 'premium' en RevenueCat
//   3. Poner la API key en EXPO_PUBLIC_REVENUECAT_IOS_KEY
//   4. Reemplazar las implementaciones stub de abajo por las reales (el bloque
//      comentado al final tiene el código exacto), y hacer un EAS build.

export interface PurchasePackage {
  /** Identificador del paquete de RevenueCat. */
  id: string;
  /** "Mensual" / "Anual". */
  title: string;
  /** Precio ya formateado por la tienda, p. ej. "$49.00/mes". */
  priceString: string;
}

export interface PurchasesOfferings {
  packages: PurchasePackage[];
}

export interface PurchaseResult {
  isPremium: boolean;
  /** 'cancelled' | 'not-configured' | mensaje de error. undefined = éxito. */
  error?: string;
}

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';

/** El entitlement de RevenueCat que representa Mimebien Premium. */
export const PREMIUM_ENTITLEMENT = 'premium';

/**
 * True solo cuando hay API key configurada. Mientras sea false, toda la capa
 * opera en modo stub y la app se comporta como si el usuario no fuera premium.
 */
export function isPurchasesConfigured(): boolean {
  return IOS_API_KEY.length > 0;
}

// ─────────────────────────────────────────────
// Implementación STUB (activa mientras no haya SDK/API key)
// ─────────────────────────────────────────────

export async function configurePurchases(): Promise<void> {
  // no-op en modo stub
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  return null;
}

export async function purchasePackage(_packageId: string): Promise<PurchaseResult> {
  return { isPremium: false, error: 'not-configured' };
}

export async function restorePurchases(): Promise<PurchaseResult> {
  return { isPremium: false, error: 'not-configured' };
}

export async function getIsPremium(): Promise<boolean> {
  return false;
}

// ─────────────────────────────────────────────
// Implementación REAL (activar tras instalar react-native-purchases)
// ─────────────────────────────────────────────
//
// import Purchases, { LOG_LEVEL } from 'react-native-purchases';
//
// export async function configurePurchases(): Promise<void> {
//   if (!isPurchasesConfigured()) return;
//   Purchases.setLogLevel(LOG_LEVEL.WARN);
//   Purchases.configure({ apiKey: IOS_API_KEY });
// }
//
// export async function getOfferings(): Promise<PurchasesOfferings | null> {
//   if (!isPurchasesConfigured()) return null;
//   const offerings = await Purchases.getOfferings();
//   const current = offerings.current;
//   if (!current) return null;
//   return {
//     packages: current.availablePackages.map((p) => ({
//       id: p.identifier,
//       title: p.product.title,
//       priceString: p.product.priceString,
//     })),
//   };
// }
//
// export async function purchasePackage(packageId: string): Promise<PurchaseResult> {
//   if (!isPurchasesConfigured()) return { isPremium: false, error: 'not-configured' };
//   try {
//     const offerings = await Purchases.getOfferings();
//     const pkg = offerings.current?.availablePackages.find((p) => p.identifier === packageId);
//     if (!pkg) return { isPremium: false, error: 'package-not-found' };
//     const { customerInfo } = await Purchases.purchasePackage(pkg);
//     return { isPremium: !!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] };
//   } catch (e: any) {
//     if (e?.userCancelled) return { isPremium: false, error: 'cancelled' };
//     return { isPremium: false, error: e?.message ?? 'unknown' };
//   }
// }
//
// export async function restorePurchases(): Promise<PurchaseResult> {
//   if (!isPurchasesConfigured()) return { isPremium: false, error: 'not-configured' };
//   const customerInfo = await Purchases.restorePurchases();
//   return { isPremium: !!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] };
// }
//
// export async function getIsPremium(): Promise<boolean> {
//   if (!isPurchasesConfigured()) return false;
//   const customerInfo = await Purchases.getCustomerInfo();
//   return !!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];
// }

import React, { useEffect, useMemo, useRef } from "react";
import { Animated, BackHandler, Easing, PanResponder, Text, View, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";
import { MotionPressable, useMotion } from "./motion";
import { fonts, useTheme } from "../lib/theme";

/** Botón «‹ Atrás» de iOS: chevrón fino y el nombre de la pantalla anterior, en el color de acento, sin borde. */
export function BackButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={`Volver a ${label}`}
      onPress={onPress}
      hitSlop={10}
      style={{ minHeight: 44, flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginLeft: -8, paddingRight: 8 }}
    >
      <Svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={c.secondary} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M14.5 5.5 8 12l6.5 6.5" />
      </Svg>
      <Text style={{ fontSize: 17, fontFamily: fonts.regular, color: c.secondary, marginLeft: -2 }}>{label}</Text>
    </MotionPressable>
  );
}

/** Botón «atrás» de Android: mientras `enabled`, vuelve con `onBack` en lugar de salir de la app. */
export function useHardwareBack(enabled: boolean, onBack: () => void) {
  const latest = useRef(onBack);
  latest.current = onBack;
  useEffect(() => {
    if (!enabled) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      latest.current();
      return true;
    });
    return () => sub.remove();
  }, [enabled]);
}

const EDGE = 28;

/**
 * Deslizar desde el borde izquierdo para volver, como en iOS: la pantalla sigue al dedo y, si se suelta pasada la cuarta
 * parte del ancho (o con un gesto rápido), sale hacia la derecha y vuelve a la anterior; si no, regresa a su lugar.
 */
export function EdgeSwipeBack({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const { reduced } = useMotion();
  const x = useRef(new Animated.Value(0)).current;
  const live = useRef({ onBack, width, reduced });
  live.current = { onBack, width, reduced };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, g) => g.x0 <= EDGE && g.dx > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderMove: (_, g) => x.setValue(Math.max(0, g.dx)),
        onPanResponderRelease: (_, g) => {
          const L = live.current;
          if (g.dx > L.width * 0.25 || g.vx > 0.6) {
            if (L.reduced) {
              x.setValue(0);
              L.onBack();
              return;
            }
            Animated.timing(x, { toValue: L.width, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
              L.onBack();
              x.setValue(0);
            });
          } else {
            Animated.spring(x, { toValue: 0, stiffness: 320, damping: 28, useNativeDriver: true }).start();
          }
        },
        onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, stiffness: 320, damping: 28, useNativeDriver: true }).start(),
      }),
    [x],
  );

  return (
    <View style={{ flex: 1 }} {...pan.panHandlers}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: x }] }}>{children}</Animated.View>
    </View>
  );
}

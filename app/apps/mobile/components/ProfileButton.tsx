import React from "react";
import { Text } from "react-native";
import { MotionPressable } from "./motion";
import { useAuth } from "../lib/auth";
import { useNav } from "../lib/nav";
import { fonts, useTheme } from "../lib/theme";

/** Avatar con las iniciales, arriba a la derecha del título (como en las apps de iOS): abre Ajustes. */
export function ProfileButton() {
  const { user } = useAuth();
  const { go } = useNav();
  const { c } = useTheme();
  const initials = (user?.name ?? "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={`Tu cuenta: ${user?.name ?? ""}. Abre Ajustes`}
      onPress={() => go("ajustes")}
      hitSlop={6}
      style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: c.secondaryFixed, marginTop: 2 }}
    >
      <Text maxFontSizeMultiplier={1.3} style={{ fontSize: 14, fontFamily: fonts.bold, color: c.onSecondaryFixed }}>{initials}</Text>
    </MotionPressable>
  );
}

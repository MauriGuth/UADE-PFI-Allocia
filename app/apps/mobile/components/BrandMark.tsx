import React from "react";
import { Image } from "react-native";
import { useTheme } from "../lib/theme";

/** Marca de Allocia en su versión para el tema activo (la navy se perdería sobre el fondo oscuro). */
export function BrandMark({ height = 20 }: { height?: number }) {
  const { scheme } = useTheme();
  return (
    <Image
      accessible={false}
      source={scheme === "dark" ? require("../assets/mark-white.png") : require("../assets/mark.png")}
      style={{ height, width: height * 1.4 }}
      resizeMode="contain"
    />
  );
}

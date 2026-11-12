// Fixed logical bounds; compile result has a visible solid-color fallback.
import { useMemo } from "react";
import { Canvas, Fill, Shader, Skia } from "@shopify/react-native-skia";
import { glowSource } from "./graphics";

export function RuntimeGlow() {
  const effect = useMemo(() => Skia.RuntimeEffect.Make(glowSource), []);
  return (
    <Canvas style={{ width: 240, height: 160 }}>
      <Fill color="#14204d">
        {effect ? <Shader source={effect} uniforms={{ resolution: [240, 160] }} /> : null}
      </Fill>
    </Canvas>
  );
}

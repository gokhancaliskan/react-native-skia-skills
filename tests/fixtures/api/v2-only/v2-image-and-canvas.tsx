// Valid on scoped 2.14.0. The v3 migration renames or removes each of these.
// expect-v3: TS2551 'MakeImageFromEncoded' | TS2339 'Make' | TS2322 Promise<string> | TS2339 'ref' | TS2322 onSize
import { Canvas, Skia, useCanvasSize, type SkData, type SkImage } from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-reanimated";

export const decode = (data: SkData) => Skia.Image.MakeImageFromEncoded(data);
export const surface = () => Skia.Surface.Make(8, 8);
export const encode = (image: SkImage): string => image.encodeToBase64();

export function Measured() {
  const { ref } = useCanvasSize();
  const size = useSharedValue({ width: 0, height: 0 });
  return <Canvas ref={ref} style={{ flex: 1 }} onSize={size} />;
}

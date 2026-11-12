// Valid on unscoped 3.10.0. Applying v3 documentation to a v2 project produces these errors.
// expect-v2: TS2551 'MakeFromEncoded' | TS2339 'MakeRaster' | TS2322 Promise<string> | TS2339 'onLayout'
import { Canvas, Skia, useCanvasSize, type SkData, type SkImage } from "@shopify/react-native-skia";

export const decode = (data: SkData) => Skia.Image.MakeFromEncoded(data);
export const surface = () => Skia.Surface.MakeRaster(8, 8);
export const encode = (image: SkImage): Promise<string> => image.encodeToBase64();

export function Measured() {
  const { onLayout } = useCanvasSize();
  return <Canvas style={{ flex: 1 }} onLayout={onLayout} />;
}

// Paths are immutable in the pinned releases; geometry is assembled with a PathBuilder.
// expect: TS2339 'moveTo' | TS2339 'lineTo' | TS2339 'close'
import { Skia } from "@shopify/react-native-skia";

export function triangle() {
  const path = Skia.Path.Make();
  path.moveTo(0, 0);
  path.lineTo(10, 0);
  path.close();
  return path;
}

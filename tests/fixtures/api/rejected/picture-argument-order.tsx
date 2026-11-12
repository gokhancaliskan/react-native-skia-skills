// Early releases took the bounds first. The pinned signature is (callback, bounds?).
// expect: TS2345 SkHostRect
import { createPicture, rect, type SkCanvas } from "@shopify/react-native-skia";

export const picture = createPicture(rect(0, 0, 10, 10), (canvas: SkCanvas) => {
  canvas.save();
  canvas.restore();
});

# Images and text

Image/font hooks may return null while loading or after failure. Call hooks unconditionally, then branch the drawing tree. Avoid recreating data sources on every animation update. Decode and size for the actual display need; a compressed download's size is not decoded memory usage. Width × height × bytes-per-pixel is only a rough lower-level estimate: mipmaps, GPU copies, format and retained references change the total.

Choose `contain`, `cover` or another documented fit intentionally. Check crop alignment, image orientation, source rectangles and sampling at the target density. For repeated regions of one image, consider Atlas after profiling; its source rectangles use image coordinates. Keep ownership of images stable and bound caches by resource count/size. Discard references when no consumer needs them; do not dispose shared live resources.

For simple text, `Text` uses a font and a baseline: its y coordinate is not a top edge. Verify font loading before adjusting position. For wrapping, styled runs, shaping or mixed scripts, investigate Paragraph and its font manager rather than manually positioning characters. Glyph-level rendering and text blobs are specialized tools; preserve shaping, fallback fonts and accessibility. A picture or paragraph cache must invalidate on content, font readiness, width, scale and theme as appropriate.

Canvas text does not automatically participate in native accessibility or dynamic type. Decide how the feature communicates and scales outside the raster scene. Check complex scripts and font fallback when they are part of the product's language scope.

v3 changes image factory names and makes several readback/encoding operations asynchronous. Read installed declarations before reusing v2 snapshot/export code. Avoid synchronous readback assumptions in frame work. Web initialization and font fetching differ from native bundling.

Sources: [images](https://wcandillon.github.io/react-native-skia/v2/docs/images/), [text](https://wcandillon.github.io/react-native-skia/v2/docs/text/text/), [paragraph](https://wcandillon.github.io/react-native-skia/v2/docs/text/paragraph/), [v3 image API](https://wcandillon.github.io/react-native-skia/docs/images/).

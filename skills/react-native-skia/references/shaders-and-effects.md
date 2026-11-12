# Shaders and effects

Use a gradient or existing filter when it expresses the intended result clearly. For a runtime effect, compile SkSL using `Skia.RuntimeEffect.Make`, retain the result for stable source, and handle compilation failure. Compilation succeeds or fails independently of TypeScript. [RuntimeGlow](../examples/RuntimeGlow.tsx) uses the same shader string that the CanvasKit smoke test compiles and draws.

SkSL resembles GLSL but is not interchangeable with WebGL fragment shader code. Use `half4 main(float2 position)` or another officially supported signature. Pass the correct uniform names, types, dimensions and numeric arrays. `position` is in the shader's local coordinate system; normalization should use the drawn bounds in those units. Guard zero dimensions. Return the alpha/color representation expected by Skia; the example returns opaque color to avoid premultiplication ambiguity.

Animate uniforms, not the shader source. Memoizing a compiled effect avoids recompilation during ordinary renders, but does not establish a portable cross-runtime cache. Child shaders are passed as children with the documented ordering. Test null assets and a compile failure fallback.

A mask blur acts on coverage; an image blur filters image content; a backdrop blur samples content behind the element. They are not visually interchangeable. Image filters, color filters, masks and blend modes compose in order; changing order for an alleged speedup can change output. Bound effects to the intended region, allow blur outsets, and check clip edges. A runtime image filter can operate in physical pixels; consult its density treatment rather than applying the shader example's logical-coordinate assumption everywhere.

Large translucent layers, high blur radii and repeated full-screen effects are profiling hypotheses. Compare equivalent images before comparing speed. Do not claim a universal “cheaper blur” or reorder filters without a visual check and timing evidence.

Sources: [SkSL](https://wcandillon.github.io/react-native-skia/v2/docs/shaders/overview/), [runtime image filters](https://wcandillon.github.io/react-native-skia/v2/docs/image-filters/runtime-shader/), [blur](https://wcandillon.github.io/react-native-skia/v2/docs/image-filters/blur/), [mask filters](https://wcandillon.github.io/react-native-skia/v2/docs/mask-filters/), [gradients](https://wcandillon.github.io/react-native-skia/v2/docs/shaders/gradients/).

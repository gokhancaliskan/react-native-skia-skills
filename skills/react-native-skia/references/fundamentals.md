# Rendering fundamentals

Applies to the example pins in [compatibility](compatibility.md); verify changed props on other releases.

A Canvas needs nonzero layout dimensions. A parent's `flex` chain can collapse it even when its drawing code is correct. Draw a solid diagnostic rectangle before debugging assets or shaders. Skia coordinates normally describe logical canvas units; do not multiply every coordinate by pixel density. Raster buffers and image-filter coordinates may have different sizing contracts.

Start with supported primitives (`Circle`, `Rect`, `RoundedRect`, `Path`) and `Group` for shared paint, transforms and clips. A stroke is centered on its geometry and can be cut off at an edge. Specify caps and joins when matching artwork. Gradients are shader children of drawing nodes. A group transform changes geometry; it does not change React Native layout or touch hit areas.

Drawing order matters: later siblings normally cover earlier ones. Verify any explicit ordering API in the installed release. Opacity on overlapping children is visually different from compositing a group into a layer and applying opacity once. Use an isolation layer when the required blend semantics demand it, then measure its area/cost. `Picture`, `ImageSVG` and `Paragraph` are documented as unaffected by group paint properties; apply effects to them through a group `layer`.

Accessibility is separate from pixels. Provide React Native semantics and operable controls for meaningful interactive content; a painted label is not automatically a screen-reader element. Check contrast, text scaling alternatives and reduced motion as part of the feature's behavior.

Sources: [Canvas](https://wcandillon.github.io/react-native-skia/v2/docs/canvas/overview/), [painting](https://wcandillon.github.io/react-native-skia/v2/docs/paint/overview/), [Group](https://wcandillon.github.io/react-native-skia/v2/docs/group/). Layout and diagnostic ordering are engineering heuristics, not measured optimizations.

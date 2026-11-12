# Pictures, repeated objects and caching

A picture records drawing commands; it is not a raster image and does not guarantee the GPU work disappears. Replaying complex commands can still be expensive. Cache only when the inputs and lifetime are understood. [StaticGrid](../examples/StaticGrid.tsx) records unchanged grid lines once per size/color change. It keeps the picture in its component and does not advertise cross-runtime sharing.

Compare options:

| Workload | Candidate | Check |
| --- | --- | --- |
| Few independent shapes | Declarative nodes | Clarity, updates and existing architecture |
| Fixed complex vector background | Recorded picture | Invalidation and replay cost |
| Stable expensive pixels | Raster/texture cache | Density, memory, context ownership and visual scaling |
| Many regions of the same image | Atlas | Source rectangles, transforms, texture memory and measured total cost |
| Dynamic command list | Imperative recording | Allocation/recording cost and runtime-safe ownership |

No universal sprite-count threshold decides these choices. Atlas is a supported batching technique; exact backend behavior is version-specific. [RepeatedSprites](../examples/RepeatedSprites.tsx) accepts an already loaded image and memoizes static source rectangles/transforms. An animated version can use `useRSXformBuffer` and `useRectBuffer` only after verifying their callback and mutation API in the installed release.

Cache keys should include every visual input: dimensions, colors, geometry, asset identity/readiness and density when rasterized. Bound the number and size of entries. Do not use a module-global mutable paint, recorder or builder across JS/UI/worker runtimes. A recorder must not have overlapping recording sessions. Do not assume an object created on JS can be captured into any worklet just because its TypeScript type accepts it.

For v2 GPU textures, use documented texture hooks and respect the originating context. v3 explicitly broadens GPU-image sharing, but mutable object access still requires ownership reasoning. Cleanup must wait until retained consumers are finished; automatic and explicit disposal contracts vary by object and runtime.

Sources: [pictures](https://wcandillon.github.io/react-native-skia/v2/docs/shapes/pictures/), [Atlas](https://wcandillon.github.io/react-native-skia/v2/docs/shapes/atlas/), [textures](https://wcandillon.github.io/react-native-skia/v2/docs/animations/textures/), [v3 Atlas](https://wcandillon.github.io/react-native-skia/docs/shapes/atlas/). Cache selection is an engineering heuristic, not benchmark evidence.

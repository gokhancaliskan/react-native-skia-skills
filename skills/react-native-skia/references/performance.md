# Performance investigation

Start with a reproducible symptom and target device. A 60 Hz display interval is about 16.67 ms; 120 Hz is about 8.33 ms. These are arithmetic display budgets, not guaranteed JS/GPU execution budgets. Pipelines overlap; missing a deadline can have several causes.

Record build mode, package versions, backend, device/OS, refresh rate, viewport/density, workload, thermal/power state and measurement tool. Use a release/profile build appropriate to the project's workflow. Warm caches separately from measuring cold starts. Repeat a fixed input trace and compare the same intervals over several runs. Track median and tail frame times, missed deadlines, memory trend and visual parity. Do not invent numbers when profiling is unavailable.

Separate causes before changing code:

- React profiler/JS traces: excessive renders, reconciliation, path/source reconstruction.
- UI/runtime traces: gesture or simulation callbacks, repeated cross-runtime scheduling.
- Native/GPU tools: large filters, overdraw, texture upload, readback, expensive drawing or backend stalls.
- Memory tools: decoded images, retained pictures, cache growth and repeated mount/unmount behavior.

A Reanimated frame delta measures callback spacing; it does not isolate GPU time. React profiling does not measure all native rendering. A development FPS overlay can guide reproduction but is not a controlled benchmark.

When no measurement exists yet, report suspected code as a lead and include the comparison you propose: the same input trace before and after, on a release or profile build, with median and tail intervals from real captures. A plausible mechanism in the source is not yet a diagnosis. Change one variable at a time: freeze simulation, remove an effect in a diagnostic branch, reduce rendered count, or reuse a static path. Restore intended visuals before judging a production change. Track confounders such as different canvas sizes or disabled blur. Use a bounded trace buffer; log after capture rather than every frame.

Allocation, path reconstruction, layers, text shaping and decoding are useful leads. Pooling may reduce churn but increase retained memory and complexity; require measurements and reset semantics. On low-memory devices, prefer bounded resource policies and test sustained use, navigation cycles and background/resume. Never force GC to conceal a leak.

The [investigation example](../examples/performance-investigation.md) supplies a reproducible protocol. Its [summary utility](../examples/frame-metrics.ts) computes statistics from real captures; unit tests use synthetic data solely to verify arithmetic.

Sources: [React Native performance overview](https://reactnative.dev/docs/performance), [Reanimated performance](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/), [frame callback](https://docs.swmansion.com/react-native-reanimated/docs/advanced/useFrameCallback/). The experimental protocol is original engineering guidance; no speedup is claimed.

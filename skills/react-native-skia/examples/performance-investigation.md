# Example: investigate spikes in a trail scene

Assume a compatible existing native app with an intermittent frame-spike report. Use the installed project's build/profiling instructions. This is an experimental protocol; no improvement or device result has been measured here.

1. Record exact versions, device/OS, backend, refresh rate, build mode, viewport, thermal state and a reproducible input trace. Save a visual baseline.
2. Warm up, then capture the same interaction interval several times. Store a bounded list of frame intervals outside the rendering hot path and export after capture. Skip the first null delta; label pause/resume windows separately. Avoid per-frame logging.
3. Pass actual intervals to `summarizeFrames` from [frame-metrics.ts](frame-metrics.ts). It uses nearest-rank quantiles and strict `interval > 1000 / Hz` for over-budget fraction; jitter makes this a diagnostic statistic, not an OS dropped-frame count.
4. Correlate with JS/UI and native/GPU traces. Hypotheses include path rebuilding, simulation work, image upload or a full-screen blur. Isolate one variable in a diagnostic branch. Do not replace the whole renderer based on callback spacing alone.
5. Implement the smallest supported change, restore equivalent visuals and rerun the same captures. Report sample count, median/p95/max, memory trend, visual differences and confounders. Revert changes that lack evidence or harm behavior.

Use a result record with fields: device, OS, build, backend, versions, refreshHz, workload, captureDuration, runs, metrics, memory, visualParity, hypothesis, change, conclusion. Leave unavailable measurements explicitly “not measured”; do not fill them from the synthetic unit test data.

For `BoundedTrail`, verify history stays bounded after many updates before considering a ring buffer. Capacity bounds memory growth but does not eliminate array allocations or path rebuilds. Profile sustained use, disable/re-enable and background/resume on the actual target.

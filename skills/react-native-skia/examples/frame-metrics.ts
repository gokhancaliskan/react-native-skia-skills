// Summarizes callback intervals, not GPU execution durations.
export function summarizeFrames(intervalsMs: readonly number[], refreshHz: number) {
  if (!Number.isFinite(refreshHz) || refreshHz <= 0) throw new RangeError("refreshHz must be positive");
  if (intervalsMs.length === 0 || intervalsMs.some((ms) => !Number.isFinite(ms) || ms <= 0)) {
    throw new RangeError("Supply a nonempty capture of finite positive intervals");
  }
  const sorted = [...intervalsMs].sort((a, b) => a - b);
  const quantile = (p: number) => sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)];
  const budgetMs = 1000 / refreshHz;
  return {
    samples: sorted.length, budgetMs, medianMs: quantile(0.5), p95Ms: quantile(0.95),
    maxMs: sorted[sorted.length - 1],
    overBudgetFraction: sorted.filter((ms) => ms > budgetMs).length / sorted.length,
  };
}

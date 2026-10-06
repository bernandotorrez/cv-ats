export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "–";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins === 0 ? `${secs} dtk` : `${mins} mnt ${secs} dtk`;
}

export function BackgroundGrid() {
  return (
    <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:60px_60px] dark:bg-grid-slate-100/[0.03]">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
    </div>
  );
} 
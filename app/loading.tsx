export default function GlobalLoading() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[10000]">
      <div className="absolute inset-0 bg-background/70" />

      <div className="absolute left-0 top-0 h-[2px] w-full overflow-hidden bg-foreground/15">
        <div className="route-loading-bar" />
      </div>
    </div>
  );
}

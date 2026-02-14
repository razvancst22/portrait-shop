export default function OrderSuccessLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    </div>
  )
}

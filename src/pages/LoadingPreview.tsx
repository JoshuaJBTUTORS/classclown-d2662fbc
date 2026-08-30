import LoadingHand from '@/components/ui/loading-hand';

export default function LoadingPreview() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      <LoadingHand text="Loading…" />
    </div>
  );
}

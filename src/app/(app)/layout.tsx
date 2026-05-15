import { BottomNav } from "@/components/BottomNav";
import { PinGate } from "@/components/PinGate";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PinGate>
      <div className="min-h-screen pb-24">{children}</div>
      <BottomNav />
    </PinGate>
  );
}

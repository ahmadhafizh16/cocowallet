import { WalletDashboard } from "@/features/wallet/dashboard";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { getStoredWalletOverview } from "@/server/wallet-overview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function WalletPage() {
  return (
    <WalletDashboard model={getStoredWalletOverview(getRuntimeDatabase())} />
  );
}

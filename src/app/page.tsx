import { WalletDashboard } from "@/features/wallet/dashboard";
import { createPreviewOverview } from "@/features/wallet/types";

export default function WalletPage() {
  return <WalletDashboard model={createPreviewOverview()} />;
}

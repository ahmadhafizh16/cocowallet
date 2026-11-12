import type { ReactNode } from "react";
import { WalletDashboard } from "@/features/wallet/dashboard";
import { getRuntimeDatabase } from "@/server/db/runtime";
import { getStoredWalletOverview } from "@/server/wallet-overview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One persistent shell keeps account context, privacy, money drafts and recovery
 * mounted while Overview and History navigate as real App Router pages. */
export default function WalletLayout({ children }: { children: ReactNode }) {
  return (
    <WalletDashboard model={getStoredWalletOverview(getRuntimeDatabase())}>
      {children}
    </WalletDashboard>
  );
}

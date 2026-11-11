import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CocoWalletLogo } from "@/components/brand/cocowallet-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main-content" className="error-page">
      <div className="error-brand">
        <CocoWalletLogo />
      </div>
      <section className="error-panel">
        <h1>This page isn’t in your wallet</h1>
        <p>
          The address may have changed. Your wallet overview is a good place to
          start.
        </p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft aria-hidden="true" /> Back to overview
          </Link>
        </Button>
      </section>
    </main>
  );
}

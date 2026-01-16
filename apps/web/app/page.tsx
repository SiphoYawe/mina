import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SdkStatus } from '@/components/sdk-status';

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-base">
      {/* Header */}
      <header className="border-b border-border-subtle">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <span className="text-accent-primary font-bold">M</span>
            </div>
            <span className="text-h3 text-gradient">Mina</span>
          </div>
          <Button variant="secondary" size="sm">
            Connect Wallet
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-h1 text-text-primary mb-4">
          Bridge to <span className="text-gradient">Hyperliquid</span>
        </h1>
        <p className="text-body text-text-secondary max-w-2xl mx-auto mb-8">
          Seamlessly bridge assets from 40+ chains directly to your Hyperliquid trading account.
          One click, zero hassle.
        </p>

        {/* Bridge Card */}
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Bridge Assets</CardTitle>
            <CardDescription>
              Select a token and amount to bridge
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-small text-text-secondary">From</label>
              <Input placeholder="0.00" type="number" />
            </div>
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center">
                <span className="text-text-muted">↓</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-small text-text-secondary">To (HyperEVM)</label>
              <Input placeholder="0.00" type="number" disabled />
            </div>
            <Button className="w-full" size="lg">
              Bridge Now
            </Button>
          </CardContent>
        </Card>

        {/* SDK Status */}
        <SdkStatus />
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 grid md:grid-cols-3 gap-6">
        <Card className="hover:border-accent-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-h3">40+ Chains</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">
              Bridge from Ethereum, Arbitrum, Optimism, Base, Polygon, and many more.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-accent-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-h3">Auto Deposit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">
              Funds automatically deposited to your Hyperliquid L1 trading account.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-accent-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-h3">Best Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">
              Optimal routing via LI.FI for the best rates and lowest fees.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href="/" className="text-sm font-semibold text-primary">Back to Lummy</Link>
        <h1 className="font-display text-3xl font-extrabold">Privacy</h1>
        <p className="text-muted-foreground">
          Lummy uses your account, store, order, and onboarding data to operate your storefront and dashboard. We do not sell creator account data.
        </p>
        <p className="text-muted-foreground">
          For data requests, contact <a className="text-primary underline" href="mailto:hello@lummy.co">hello@lummy.co</a>.
        </p>
      </div>
    </main>
  );
}

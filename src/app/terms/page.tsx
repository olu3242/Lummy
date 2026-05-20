import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-2xl space-y-4">
        <Link href="/" className="text-sm font-semibold text-primary">Back to Lummy</Link>
        <h1 className="font-display text-3xl font-extrabold">Terms</h1>
        <p className="text-muted-foreground">
          Lummy accounts are for legitimate creator commerce. Keep your account secure, use accurate store information, and only sell products or services you are allowed to sell.
        </p>
        <p className="text-muted-foreground">
          For MVP support or policy questions, contact <a className="text-primary underline" href="mailto:hello@lummy.co">hello@lummy.co</a>.
        </p>
      </div>
    </main>
  );
}

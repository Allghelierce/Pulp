export const metadata = {
  title: "Terms of Service — Pulp",
  description: "Terms of Service for Pulp, a focus and note-taking app.",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900 px-6 py-16">
      <article className="max-w-2xl mx-auto prose prose-zinc">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-500 mb-10">Last updated: April 15, 2026</p>

        <p>
          Welcome to Pulp. By creating an account or using the service at{" "}
          <a href="https://pulp-omega.vercel.app">pulp-omega.vercel.app</a> (&quot;Pulp&quot;, &quot;we&quot;,
          &quot;us&quot;), you agree to these Terms of Service. If you do not agree, please do
          not use the service.
        </p>

        <h2 className="mt-8 font-semibold text-xl">1. The Service</h2>
        <p>
          Pulp is a personal note-taking and focus-session application. Features may
          change, be added, or be removed at any time without notice. Pulp is provided
          &quot;as is&quot; with no warranty of any kind.
        </p>

        <h2 className="mt-8 font-semibold text-xl">2. Your Account</h2>
        <p>
          You are responsible for maintaining the security of your account, including
          any credentials used to sign in (such as Google OAuth). You agree to provide
          accurate information and to notify us of any unauthorized use of your account.
        </p>

        <h2 className="mt-8 font-semibold text-xl">3. Your Content</h2>
        <p>
          You retain ownership of any notes, writing, or other content you create in
          Pulp. By using the service, you grant us a limited license to store and display
          your content solely for the purpose of operating the service for you.
        </p>

        <h2 className="mt-8 font-semibold text-xl">4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-6">
          <li>Use the service for any unlawful purpose.</li>
          <li>Attempt to access other users&apos; accounts or content.</li>
          <li>Reverse engineer, abuse, or overload the service or its infrastructure.</li>
          <li>Upload content that infringes the rights of others.</li>
        </ul>

        <h2 className="mt-8 font-semibold text-xl">5. Third-Party Services</h2>
        <p>
          Pulp uses third-party providers including Supabase (authentication and
          storage), Vercel (hosting), and AI providers such as Groq and Hugging Face for
          optional AI features. Your use of these features is also subject to those
          providers&apos; terms.
        </p>

        <h2 className="mt-8 font-semibold text-xl">6. Termination</h2>
        <p>
          You may stop using Pulp at any time. We may suspend or terminate accounts that
          violate these terms or that pose a risk to the service or other users.
        </p>

        <h2 className="mt-8 font-semibold text-xl">7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Pulp and its operators are not liable
          for any indirect, incidental, or consequential damages arising from your use of
          the service, including loss of data.
        </p>

        <h2 className="mt-8 font-semibold text-xl">8. Changes to These Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of the service after
          changes take effect constitutes acceptance of the updated terms.
        </p>

        <h2 className="mt-8 font-semibold text-xl">9. Contact</h2>
        <p>
          Questions about these terms can be sent to{" "}
          <a href="mailto:pulpsupport@gmail.com">pulpsupport@gmail.com</a>.
        </p>

        <p className="mt-12 text-sm">
          <a href="/">← Back to Pulp</a> · <a href="/privacy">Privacy Policy</a>
        </p>
      </article>
    </main>
  )
}

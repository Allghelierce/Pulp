export const metadata = {
  title: "Privacy Policy — Pulp",
  description: "Privacy Policy for Pulp, a focus and note-taking app.",
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900 px-6 py-16">
      <article className="max-w-2xl mx-auto prose prose-zinc">
        <h1 className="text-3xl font-normal mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-10">Last updated: April 15, 2026</p>

        <p>
          This Privacy Policy describes how Pulp (&quot;we&quot;, &quot;us&quot;) collects, uses, and
          stores information when you use{" "}
          <a href="https://pulp-omega.vercel.app">pulp-omega.vercel.app</a>.
        </p>

        <h2 className="mt-8 font-normal text-xl">1. Information We Collect</h2>
        <p>When you sign in to Pulp, we collect:</p>
        <ul className="list-disc pl-6">
          <li>
            <strong>Account information</strong> — email address, and (if you sign in
            with Google) your basic Google profile (name and profile picture).
          </li>
          <li>
            <strong>Content you create</strong> — notes, writing, folders, and related
            metadata that you save in Pulp.
          </li>
          <li>
            <strong>Usage data</strong> — in-app progress such as focus sessions,
            achievements, and currency totals associated with your account.
          </li>
        </ul>

        <h2 className="mt-8 font-normal text-xl">2. How We Use Your Information</h2>
        <p>We use your information only to:</p>
        <ul className="list-disc pl-6">
          <li>Authenticate you and keep your account secure.</li>
          <li>Store, sync, and display the notes and content you create.</li>
          <li>Provide optional AI-powered features that you explicitly trigger.</li>
        </ul>
        <p>
          We do not sell your personal data, and we do not use your notes to train AI
          models.
        </p>

        <h2 className="mt-8 font-normal text-xl">3. Google User Data</h2>
        <p>
          If you choose to sign in with Google, we request the minimum profile scopes
          needed to create an account (name, email, profile picture). We do not access
          any other Google data. Pulp&apos;s use of information received from Google APIs
          adheres to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>

        <h2 className="mt-8 font-normal text-xl">4. Third-Party Services</h2>
        <p>We share data with a small number of processors that help us run the service:</p>
        <ul className="list-disc pl-6">
          <li>
            <strong>Supabase</strong> — authentication, database, and storage.
          </li>
          <li>
            <strong>Vercel</strong> — hosting and serverless functions.
          </li>
          <li>
            <strong>Groq</strong> and <strong>Hugging Face</strong> — optional AI
            features. Text you submit to an AI feature is forwarded to these providers
            solely to generate the requested response.
          </li>
        </ul>

        <h2 className="mt-8 font-normal text-xl">5. Data Retention</h2>
        <p>
          We retain your account information and notes for as long as your account is
          active. You can delete your account at any time by contacting us, and your
          associated notes and profile data will be removed from our systems.
        </p>

        <h2 className="mt-8 font-normal text-xl">6. Security</h2>
        <p>
          Data is stored with Supabase using industry-standard encryption in transit
          (TLS) and at rest. No method of transmission or storage is perfectly secure,
          but we take reasonable precautions to protect your information.
        </p>

        <h2 className="mt-8 font-normal text-xl">7. Your Rights</h2>
        <p>
          You can request access to, correction of, or deletion of your personal data at
          any time by emailing us.
        </p>

        <h2 className="mt-8 font-normal text-xl">8. Children</h2>
        <p>
          Pulp is not directed to children under 13, and we do not knowingly collect
          personal data from them.
        </p>

        <h2 className="mt-8 font-normal text-xl">9. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. Material changes will be posted on
          this page with a new &quot;Last updated&quot; date.
        </p>

        <h2 className="mt-8 font-normal text-xl">10. Contact</h2>
        <p>
          For privacy questions or data requests, contact us at{" "}
          <a href="mailto:pulpsupport@gmail.com">pulpsupport@gmail.com</a>.
        </p>

        <p className="mt-12 text-sm">
          <a href="/">← Back to Pulp</a> · <a href="/terms">Terms of Service</a>
        </p>
      </article>
    </main>
  )
}

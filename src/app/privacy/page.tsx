export default function PrivacyPage() {
  return (
    <div style={{ minHeight:"100vh", background:"#0A0A0A", color:"#F0F0F0", padding:"60px 24px" }}>
      <div style={{ maxWidth:760, margin:"0 auto" }}>
        <div style={{ fontSize:"1.4rem", fontWeight:800, color:"#D97B4F", marginBottom:8, fontFamily:"monospace", letterSpacing:".1em" }}>JUNKPIX</div>
        <h1 style={{ fontSize:"2rem", fontWeight:800, marginBottom:8 }}>Privacy Policy</h1>
        <p style={{ color:"#666666", fontSize:".84rem", marginBottom:40 }}>Last updated: June 30, 2026</p>

        <div style={{ display:"flex", flexDirection:"column", gap:28, fontSize:".92rem", lineHeight:1.7, color:"#ccc" }}>

          <section>
            <p>JunkPix ("we," "us," "our"), operated by The GO TO Junk Removal LLC, respects your privacy. This Privacy Policy explains what information we collect, how we use it, and your choices regarding that information.</p>
          </section>

          <section>
            <h2 style={{ fontSize:"1.1rem", fontWeight:700, color:"#F0F0F0", marginBottom:10 }}>1. Information We Collect</h2>
            <p style={{ marginBottom:8 }}><strong>From Operators:</strong> name, business name, email, phone number, business address, pricing information, and payment details (processed securely via Stripe).</p>
            <p style={{ marginBottom:8 }}><strong>From Customers (submitted by operators' end customers):</strong> name, phone number, email address, service address, and photos submitted for quoting purposes.</p>
            <p><strong>Automatically collected:</strong> basic usage data such as pages visited and actions taken within the app, used to improve the Service.</p>
          </section>

          <section>
            <h2 style={{ fontSize:"1.1rem", fontWeight:700, color:"#F0F0F0", marginBottom:10 }}>2. How We Use Information</h2>
            <p>We use collected information to: provide and operate the Service; generate AI-powered price estimates from submitted photos; send transactional emails (quote confirmations, job reminders, account notifications); process subscription payments; improve and troubleshoot the Service; and comply with legal obligations.</p>
          </section>

          <section>
            <h2 style={{ fontSize:"1.1rem", fontWeight:700, color:"#F0F0F0", marginBottom:10 }}>3. SMS Communications</h2>
            <p>If SMS notifications are enabled for an operator, customer phone numbers may be used to send job-related text messages (such as appointment reminders) only with the customer's prior consent collected at the point of submission. Message and data rates may apply. Customers may opt out at any time by replying STOP. We do not sell or share phone numbers with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 style={{ fontSize:"1.1rem", fontWeight:700, color:"#F0F0F0", marginBottom:10 }}>4. Photo Data</h2>
            <p>Photos submitted by customers are used to generate AI-powered quotes and, at the operator's discretion, may be used to create before/after content for the operator's own social media marketing. Photos are stored securely and are not sold to third parties.</p>
          </section>

          <section>
            <h2 style={{ fontSize:"1.1rem", fontWeight:700, color:"#F0F0F0", marginBottom:10 }}>5. Third-Party Service Providers</h2>
            <p>We use trusted third-party providers to operate the Service, including: Supabase (database and authentication), Resend (transactional email), Stripe (payment processing), and Anthropic (AI photo analysis). These providers process data only as necessary to provide their service to us and are bound by their own privacy and security obligations.</p>
          </section>

          <section>
            <h2 style={{ fontSize:"1.1rem", fontWeight:700, color:"#F0F0F0", marginBottom:10 }}>6. Data Retention</h2>
            <p>We retain account and job data for as long as your account is active, and for a reasonable period afterward as needed for legal, accounting, or legitimate business purposes. You may request deletion of your data by contacting us.</p>
          </section>

          <section>
            <h2 style={{ fontSize:"1.1rem", fontWeight:700, color:"#F0F0F0", marginBottom:10 }}>7. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal information at any time by contacting <a href="mailto:junkpixapp@gmail.com" style={{ color:"#D97B4F" }}>junkpixapp@gmail.com</a>.</p>
          </section>

          <section>
            <h2 style={{ fontSize:"1.1rem", fontWeight:700, color:"#F0F0F0", marginBottom:10 }}>8. Data Security</h2>
            <p>We implement reasonable technical and organizational measures to protect your information, including encrypted data storage and secure authentication. However, no method of transmission or storage is 100% secure.</p>
          </section>

          <section>
            <h2 style={{ fontSize:"1.1rem", fontWeight:700, color:"#F0F0F0", marginBottom:10 }}>9. Children's Privacy</h2>
            <p>The Service is not directed to individuals under 18. We do not knowingly collect information from children.</p>
          </section>

          <section>
            <h2 style={{ fontSize:"1.1rem", fontWeight:700, color:"#F0F0F0", marginBottom:10 }}>10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Material changes will be communicated via email or in-app notice. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 style={{ fontSize:"1.1rem", fontWeight:700, color:"#F0F0F0", marginBottom:10 }}>11. Contact Us</h2>
            <p>For privacy-related questions, contact <a href="mailto:junkpixapp@gmail.com" style={{ color:"#D97B4F" }}>junkpixapp@gmail.com</a>.</p>
          </section>

          <section>
            <h2 style={{ fontSize:"1.1rem", fontWeight:700, color:"#F0F0F0", marginBottom:10 }}>12. Aggregated & Anonymized Data</h2>
            <p>JunkPix may collect, process, and use aggregated and anonymized data derived from operator and customer activity on the platform. This data does not identify any individual person or business and may include information such as average job sizes, pricing trends, regional demand patterns, and service category breakdowns. JunkPix reserves the right to use such anonymized, aggregated data for internal product improvement, research, and — at our sole discretion — for sharing with or licensing to third parties such as industry analysts, insurers, municipal planners, or suppliers. No personally identifiable information (PII) is included in any such aggregated data sets. By using JunkPix, operators and customers consent to this use of anonymized, non-identifiable data.</p>
          </section>

        </div>
      </div>
    </div>
  );
}

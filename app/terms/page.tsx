import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, LegalSection } from '@/components/LegalLayout';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
    title: 'Terms of Service | mypdf.site',
    description: 'The rules for using mypdf.site, including acceptable use, your responsibilities for your files, and limits of liability.',
    alternates: { canonical: '/terms' },
};

const SECTIONS = [
    { id: 'acceptance', title: 'Acceptance of terms' },
    { id: 'service', title: 'The service' },
    { id: 'use', title: 'Acceptable use' },
    { id: 'your-files', title: 'Your files and content' },
    { id: 'ip', title: 'Intellectual property' },
    { id: 'ads-links', title: 'Advertising and third-party links' },
    { id: 'warranty', title: 'No warranty' },
    { id: 'liability', title: 'Limitation of liability' },
    { id: 'availability', title: 'Availability and changes' },
    { id: 'law', title: 'Governing law' },
    { id: 'contact', title: 'Contact' },
];

export default function TermsPage() {
    return (
        <LegalLayout
            title="Terms of Service"
            updated={SITE.lastUpdated}
            intro={`These terms govern your use of ${SITE.name}. Please read them before using the tools.`}
            sections={SECTIONS}
        >
            <LegalSection id="acceptance" title="1. Acceptance of terms">
                <p>
                    By accessing or using {SITE.name} you agree to these Terms of Service and to our <Link href="/privacy">Privacy Policy</Link>.
                    If you do not agree, do not use the site.
                </p>
            </LegalSection>

            <LegalSection id="service" title="2. The service">
                <p>
                    {SITE.name} provides free browser-based tools for working with PDF files and images, such as merging, splitting,
                    rotating, watermarking, numbering and converting. The tools run in your web browser on your own device.
                </p>
            </LegalSection>

            <LegalSection id="use" title="3. Acceptable use">
                <p>You agree not to:</p>
                <ul>
                    <li>Use the site for anything unlawful or to process content you have no right to use.</li>
                    <li>Try to disrupt, overload, scrape at an abusive rate, or gain unauthorized access to the site or its systems.</li>
                    <li>Interfere with advertising shown on the site, including by clicking your own ads or encouraging others to do so.</li>
                    <li>Copy, resell or republish the site’s text, design or code except as the law allows.</li>
                    <li>Use the contact or feedback forms to send spam, malicious content or abusive messages.</li>
                </ul>
            </LegalSection>

            <LegalSection id="your-files" title="4. Your files and content">
                <p>
                    Your files stay on your device and are processed in your browser. You keep all rights in your files. You are responsible
                    for having the right to use, copy and modify any file you process, and for keeping your own backups.
                </p>
                <p>
                    Always check the result before sharing or relying on it. Tools such as page removal, watermarking and conversion change
                    your document, and you are responsible for confirming the output is correct and complete.
                </p>
            </LegalSection>

            <LegalSection id="ip" title="5. Intellectual property">
                <p>
                    The site’s design, text, graphics and original code belong to {SITE.owner} or its licensors. The site uses open-source
                    software under their own licenses. “PDF” is a trademark of Adobe; {SITE.name} is not affiliated with or endorsed by
                    Adobe.
                </p>
            </LegalSection>

            <LegalSection id="ads-links" title="6. Advertising and third-party links">
                <p>
                    The site shows advertising provided by third parties and may link to other websites. We do not control or endorse third-party
                    ads or sites and are not responsible for them. Dealings with advertisers are between you and them.
                </p>
            </LegalSection>

            <LegalSection id="warranty" title="7. No warranty">
                <p>
                    The site and tools are provided “as is” and “as available”, without warranties of any kind, whether express or implied,
                    including fitness for a particular purpose, accuracy, reliability or non-infringement. We do not guarantee that the tools
                    will work with every file, device or browser, or that results will be error-free.
                </p>
            </LegalSection>

            <LegalSection id="liability" title="8. Limitation of liability">
                <p>
                    To the fullest extent permitted by law, {SITE.owner} will not be liable for any indirect, incidental, special or
                    consequential damages, or for loss of data, profits, revenue or business, arising from your use of or inability to use the
                    site. Nothing in these terms limits liability that cannot be limited by law.
                </p>
            </LegalSection>

            <LegalSection id="availability" title="9. Availability and changes">
                <p>
                    We may change, suspend or discontinue any part of the site at any time. We may update these terms from time to time; the
                    date at the top shows the latest version. Continued use after a change means you accept the updated terms.
                </p>
            </LegalSection>

            <LegalSection id="law" title="10. Governing law">
                <p>
                    {SITE.country
                        ? `These terms are governed by the laws of ${SITE.country}, without regard to conflict-of-law rules. Disputes will be handled by the competent courts of ${SITE.country}, unless the law of your place of residence gives you other mandatory rights.`
                        : 'These terms are governed by applicable law, without regard to conflict-of-law rules. Mandatory consumer rights in your place of residence are not affected.'}
                </p>
            </LegalSection>

            <LegalSection id="contact" title="11. Contact">
                <p>
                    Questions about these terms: <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or the <Link href="/contact">contact page</Link>.
                </p>
            </LegalSection>
        </LegalLayout>
    );
}
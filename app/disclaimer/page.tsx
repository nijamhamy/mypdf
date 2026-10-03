import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, LegalSection } from '@/components/LegalLayout';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
    title: 'Disclaimer | mypdf.site',
    description: 'Important notices about using mypdf.site: accuracy of results, no professional advice, third-party content, and trademarks.',
    alternates: { canonical: '/disclaimer' },
};

const SECTIONS = [
    { id: 'general', title: 'General information' },
    { id: 'accuracy', title: 'Accuracy of results' },
    { id: 'no-advice', title: 'No professional advice' },
    { id: 'your-responsibility', title: 'Your responsibility' },
    { id: 'third-party', title: 'Third-party content and ads' },
    { id: 'software', title: 'Open-source software' },
    { id: 'trademarks', title: 'Trademarks' },
    { id: 'availability', title: 'Availability' },
    { id: 'contact', title: 'Contact' },
];

export default function DisclaimerPage() {
    return (
        <LegalLayout
            title="Disclaimer"
            updated={SITE.lastUpdated}
            intro={`Please read these notices about the information and tools on ${SITE.name}.`}
            sections={SECTIONS}
        >
            <LegalSection id="general" title="1. General information">
                <p>
                    The tools, guides and articles on {SITE.name} are provided for general information and convenience. We work to keep them
                    accurate and useful, but we make no promise that they are complete, current or suitable for your situation.
                </p>
            </LegalSection>

            <LegalSection id="accuracy" title="2. Accuracy of results">
                <p>
                    The tools handle many kinds of PDFs and images, and results can vary with the source file, your browser and your device.
                    Some files, such as password-protected, damaged or unusual PDFs, may not be processed correctly. Always review the output
                    before you send, print, sign or rely on it.
                </p>
            </LegalSection>

            <LegalSection id="no-advice" title="3. No professional advice">
                <p>
                    Nothing on this site is legal, financial, tax, medical or other professional advice. Using a tool to mark a document as
                    “confidential” or to number or merge pages does not by itself make a document legally valid, secure or compliant with any
                    rule. Ask a qualified professional when a document has legal or regulatory importance.
                </p>
            </LegalSection>

            <LegalSection id="your-responsibility" title="4. Your responsibility">
                <ul>
                    <li>Keep a copy of your original files. The tools create new files and do not change the originals.</li>
                    <li>Make sure you have the right to process, copy and share the documents you use.</li>
                    <li>Remember that a visible watermark discourages reuse but does not prevent copying, and removing pages does not erase information from your original file.</li>
                </ul>
            </LegalSection>

            <LegalSection id="third-party" title="5. Third-party content and ads">
                <p>
                    The site shows advertisements from third parties, such as Google AdSense, and may link to other websites. We do not
                    control, review or endorse those ads or sites, and we are not responsible for their content, products or privacy
                    practices. See the <Link href="/privacy">Privacy Policy</Link> for more on advertising.
                </p>
            </LegalSection>

            <LegalSection id="software" title="6. Open-source software">
                <p>
                    The tools rely on open-source libraries, including pdf-lib and PDF.js, which are provided under their own licenses and
                    without warranty from their authors.
                </p>
            </LegalSection>

            <LegalSection id="trademarks" title="7. Trademarks">
                <p>
                    PDF is a trademark of Adobe. All other product names and trademarks belong to their owners. {SITE.name} is an independent
                    website and is not affiliated with, sponsored by or endorsed by Adobe, Google or any other company named on the site.
                </p>
            </LegalSection>

            <LegalSection id="availability" title="8. Availability">
                <p>
                    We may change or remove tools, and the site may be unavailable from time to time because of maintenance or technical
                    problems. We are not liable for loss caused by interruptions. See the <Link href="/terms">Terms of Service</Link> for the full terms
                    of use.
                </p>
            </LegalSection>

            <LegalSection id="contact" title="9. Contact">
                <p>
                    Spotted an error or have a concern? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or use the{' '}
                    <Link href="/contact">contact page</Link>.
                </p>
            </LegalSection>
        </LegalLayout>
    );
}
import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, LegalSection } from '@/components/LegalLayout';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
    title: 'Privacy Policy | mypdf.site',
    description:
        'How mypdf.site handles your information: files stay in your browser, how cookies and Google advertising work, and the choices you have.',
    alternates: { canonical: '/privacy' },
};

const SECTIONS = [
    { id: 'overview', title: 'Overview' },
    { id: 'your-files', title: 'Your files' },
    { id: 'information-we-collect', title: 'Information we collect' },
    { id: 'contact-feedback', title: 'Messages and feedback' },
    { id: 'cookies', title: 'Cookies and local storage' },
    { id: 'advertising', title: 'Advertising and Google AdSense' },
    { id: 'ad-choices', title: 'Your advertising choices' },
    { id: 'eea', title: 'Visitors in the EEA, UK and Switzerland' },
    { id: 'analytics', title: 'Analytics' },
    { id: 'sharing', title: 'How we share information' },
    { id: 'retention-security', title: 'Retention and security' },
    { id: 'your-rights', title: 'Your rights' },
    { id: 'children', title: 'Children' },
    { id: 'links', title: 'Links to other sites' },
    { id: 'changes', title: 'Changes to this policy' },
    { id: 'contact', title: 'Contact' },
];

export default function PrivacyPage() {
    return (
        <LegalLayout
            title="Privacy Policy"
            updated={SITE.lastUpdated}
            intro={`This policy explains what information ${SITE.name} handles, why, and the choices you have. In short: the PDF tools run in your browser and your files are not uploaded to our servers.`}
            sections={SECTIONS}
        >
            <LegalSection id="overview" title="1. Overview">
                <p>
                    This Privacy Policy applies to {SITE.name} ({SITE.url}), operated by {SITE.owner} (“we”, “us”). By using the site you
                    agree to the practices described here. If you do not agree, please do not use the site.
                </p>
            </LegalSection>

            <LegalSection id="your-files" title="2. Your files">
                <p>
                    The PDF and image tools process files locally in your web browser. When you choose a file, it is read into your
                    device’s memory, changed there, and the result is created on your device for you to download.
                </p>
                <ul>
                    <li>We do not upload your files to our servers for processing.</li>
                    <li>We do not receive, view, store, sell or share the contents of your files.</li>
                    <li>Working data is held in your browser only while you use a tool and is discarded when you close the tab or start over.</li>
                </ul>
                <p>
                    Advertising and analytics scripts that may be loaded on the site are separate from the PDF tools and do not receive
                    the contents of your files.
                </p>
            </LegalSection>

            <LegalSection id="information-we-collect" title="3. Information we collect">
                <p>We may collect the following kinds of information:</p>
                <ul>
                    <li>
                        <strong>Technical information sent by your browser</strong>, such as your IP address, browser type and version,
                        device type, language, pages visited and the date and time of the visit. This is typically recorded in server and
                        hosting logs and by the analytics and advertising services described below.
                    </li>
                    <li>
                        <strong>Information you give us</strong> when you use the contact or feedback forms (see section 4).
                    </li>
                    <li>
                        <strong>Cookie and local storage data</strong> described in section 5.
                    </li>
                </ul>
                <p>We do not ask you to create an account and we do not knowingly collect sensitive personal information.</p>
            </LegalSection>

            <LegalSection id="contact-feedback" title="4. Messages and feedback">
                <p>
                    If you send a message through the <Link href="/contact">contact</Link> or <Link href="/feedback">feedback</Link> pages, we receive what
                    you type: your message, the type of feedback, the tool concerned, your rating, and your name and email address if you
                    provide them. If you tick the option to include technical details, we also receive your browser, screen size and
                    language.
                </p>
                <p>
                    We use this information only to understand and answer your message and to improve the site. Messages are delivered to
                    us by email through an email delivery service that acts on our behalf. Please do not include confidential document
                    contents or passwords in your message.
                </p>
            </LegalSection>

            <LegalSection id="cookies" title="5. Cookies and local storage">
                <p>
                    Cookies are small files stored on your device. Local storage is a similar feature of your browser. We and our partners
                    may use them for the following purposes:
                </p>
                <ul>
                    <li><strong>Essential and functional:</strong> for example, the feedback form saves an unsent draft in your browser’s local storage so you do not lose it. The draft is removed after you send the message and you can clear it at any time by clearing site data.</li>
                    <li><strong>Advertising:</strong> to show and measure ads, limit how often you see an ad, and prevent fraud and abuse (see section 6).</li>
                    <li><strong>Analytics:</strong> to understand how the site is used (see section 9).</li>
                </ul>
                <p>
                    You can block or delete cookies in your browser settings. Doing so may affect parts of the site, and some ads may be
                    less relevant.
                </p>
            </LegalSection>

            <LegalSection id="advertising" title="6. Advertising and Google AdSense">
                <p>
                    We use third-party advertising services, including Google AdSense, to display ads on the site. These ads help pay for
                    running the free tools.
                </p>
                <ul>
                    <li>Third-party vendors, including Google, use cookies to serve ads based on a user’s prior visits to this website or other websites.</li>
                    <li>Google’s use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the internet.</li>
                    <li>These services may collect your IP address and information about your device and browser and may read or set cookies on your browser.</li>
                </ul>
                <p>
                    For more information about how Google uses information from sites that use its services, see{' '}
                    <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">How Google uses information from sites or apps that use our services</a>.
                </p>
            </LegalSection>

            <LegalSection id="ad-choices" title="7. Your advertising choices">
                <ul>
                    <li>
                        You can opt out of personalized advertising from Google by visiting{' '}
                        <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
                    </li>
                    <li>
                        You can opt out of some third-party vendors’ use of cookies for personalized advertising by visiting{' '}
                        <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">aboutads.info</a> or the{' '}
                        <a href="https://optout.networkadvertising.org" target="_blank" rel="noopener noreferrer">Network Advertising Initiative opt-out page</a>.
                    </li>
                    <li>You can use your browser’s settings to block or delete cookies, and many browsers offer privacy modes.</li>
                </ul>
                <p>Opting out does not remove ads from the site. It only changes how relevant they are to you.</p>
            </LegalSection>

            <LegalSection id="eea" title="8. Visitors in the EEA, UK and Switzerland">
                <p>
                    If you are in the European Economic Area, the United Kingdom or Switzerland, we ask for your consent before using
                    cookies or similar technologies for advertising and for personalizing ads, where the law requires it. We do this
                    through a consent management tool that works with the IAB Transparency and Consent Framework. You can change or withdraw
                    your choice at any time through the privacy and cookie settings option shown on the site, or by clearing your browser’s
                    site data.
                </p>
                <p>
                    Where consent is required, our legal basis for using data for advertising is your consent. For responding to your
                    messages it is our legitimate interest in running and improving the site.
                </p>
            </LegalSection>

            <LegalSection id="analytics" title="9. Analytics">
                <p>
                    We may use analytics tools, such as Google Analytics, to learn how many people visit the site, which pages and tools are
                    used, and how people reach us. These tools use cookies or similar identifiers and receive technical information such as
                    your IP address and device details. They do not receive the contents of your files. You can prevent Google Analytics
                    from collecting data with the{' '}
                    <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics opt-out browser add-on</a>.
                </p>
            </LegalSection>

            <LegalSection id="sharing" title="10. How we share information">
                <p>We do not sell your personal information. We share information only in these situations:</p>
                <ul>
                    <li>With service providers who help us run the site, such as hosting, email delivery, analytics and advertising partners, who may process data on our behalf or under their own policies.</li>
                    <li>When required by law, court order or a valid request from authorities.</li>
                    <li>To protect the rights, safety and security of our users, the site or others, including preventing fraud and abuse.</li>
                </ul>
                <p>Some of these providers may be located in other countries, so information may be transferred and processed outside your country.</p>
            </LegalSection>

            <LegalSection id="retention-security" title="11. Retention and security">
                <p>
                    Messages sent to us are kept only as long as needed to answer them and to improve the site, then deleted. Server and
                    advertising logs are kept according to the retention practices of our hosting and advertising providers. We use
                    reasonable technical measures, including HTTPS, to protect information, but no system on the internet is completely
                    secure.
                </p>
            </LegalSection>

            <LegalSection id="your-rights" title="12. Your rights">
                <p>
                    Depending on where you live, you may have the right to access, correct, delete or restrict the use of your personal
                    information, to object to certain processing, to withdraw consent, and to lodge a complaint with a data protection
                    authority. To make a request, contact us using the details below. We will respond within the time required by law.
                </p>
                <p>
                    Residents of some regions, including certain US states, may also have the right to opt out of the “sale” or “sharing” of
                    personal information for targeted advertising. You can use the choices in section 7 for this purpose.
                </p>
            </LegalSection>

            <LegalSection id="children" title="13. Children">
                <p>
                    The site is a general-audience service and is not directed to children under 13 (or under 16 where local law sets a
                    higher age). We do not knowingly collect personal information from children. If you believe a child has sent us
                    personal information, please contact us and we will delete it.
                </p>
            </LegalSection>

            <LegalSection id="links" title="14. Links to other sites">
                <p>
                    The site may link to websites we do not control. We are not responsible for their content or privacy practices, and we
                    encourage you to read their policies.
                </p>
            </LegalSection>

            <LegalSection id="changes" title="15. Changes to this policy">
                <p>
                    We may update this policy from time to time. The date at the top shows when it was last changed. Significant changes will
                    be shown on the site. Your continued use of the site after a change means you accept the updated policy.
                </p>
            </LegalSection>

            <LegalSection id="contact" title="16. Contact">
                <p>
                    Questions about this policy or requests about your information:{' '}
                    <a href={`mailto:${SITE.email}`}>{SITE.email}</a>, or use our <Link href="/contact">contact page</Link>.
                </p>
            </LegalSection>
        </LegalLayout>
    );
}
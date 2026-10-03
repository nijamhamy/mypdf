import Link from 'next/link';
import { TOOLS } from '@/lib/tools';
import { SITE } from '@/lib/site';

const linkCls = 'hover:text-white transition-colors';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 pt-12 pb-8 mt-20 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
                <div className="lg:col-span-2">
                    <h3 className="text-white text-lg font-bold mb-4">{SITE.name}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                        Free online tools to merge, split, rotate, watermark, number and convert PDF files. Everything runs in your
                        browser, so your documents are not uploaded for processing.
                    </p>
                    <p className="text-xs text-gray-500 mt-4">
                        Questions? <Link href="/contact" className="underline hover:text-white">Contact us</Link>
                    </p>
                </div>

                <nav aria-label="PDF tools">
                    <h4 className="text-white font-semibold mb-3">PDF tools</h4>
                    <ul className="space-y-2 text-sm">
                        {TOOLS.map((t) => (
                            <li key={t.id}><Link href={t.href} className={linkCls}>{t.title}</Link></li>
                        ))}
                    </ul>
                </nav>

                <nav aria-label="Help and company">
                    <h4 className="text-white font-semibold mb-3">Help &amp; company</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/about" className={linkCls}>About us</Link></li>
                        <li><Link href="/features" className={linkCls}>Features &amp; guides</Link></li>
                        <li><Link href="/faq" className={linkCls}>FAQ</Link></li>
                        <li><Link href="/pdf-converter" className={linkCls}>PDF converter hub</Link></li>
                        <li><Link href="/feedback" className={linkCls}>Feedback</Link></li>
                        <li><Link href="/contact" className={linkCls}>Contact us</Link></li>
                        <li><Link href="/support-project" className={linkCls}>Support the project</Link></li>
                    </ul>
                </nav>

                <nav aria-label="Legal">
                    <h4 className="text-white font-semibold mb-3">Legal</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/privacy" className={linkCls}>Privacy policy</Link></li>
                        <li><Link href="/terms" className={linkCls}>Terms of service</Link></li>
                        <li><Link href="/disclaimer" className={linkCls}>Disclaimer</Link></li>
                        <li><Link href="/privacy#ad-choices" className={linkCls}>Advertising choices</Link></li>
                    </ul>
                </nav>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-gray-800">
                <p className="text-xs text-gray-400 leading-relaxed max-w-4xl">
                    <span className="font-semibold text-gray-300">Privacy:</span> the PDF tools process files in your browser and do not
                    upload them to our servers. Advertising and analytics services may use cookies as explained in our{' '}
                    <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>.
                </p>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
                    <span>&copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.</span>
                    <span>PDF is a trademark of Adobe. {SITE.name} is not affiliated with or endorsed by Adobe.</span>
                </div>
            </div>
        </footer>
    );
}
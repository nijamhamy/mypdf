import {
    Files, Scissors, RotateCw, Stamp, Hash, Image as ImageIcon, FileText,
    ShieldCheck, Zap, Cpu, Smartphone, Wallet, Layers,
    GraduationCap, Briefcase, Scale, Camera, Receipt, Users,
    type LucideIcon,
} from 'lucide-react';

export interface Feature { icon: LucideIcon; title: string; text: string; bg: string; fg: string }
export interface Tool {
    name: string; href: string; icon: LucideIcon; bg: string; fg: string;
    tagline: string; description: string; features: string[]; bestFor: string; limits: string;
}
export interface Guide { id: string; title: string; href: string; intro: string; steps: string[]; tips: string[] }
export interface UseCase { icon: LucideIcon; title: string; text: string }
export interface Faq { q: string; a: string }
export interface Term { term: string; def: string }

export const CORE_FEATURES: Feature[] = [
    {
        icon: ShieldCheck, bg: 'bg-red-50', fg: 'text-red-600',
        title: 'Your files stay on your device',
        text: 'Every tool runs inside your browser. When you pick a PDF, the file is read into your device’s memory, edited there, and saved back to your device. It is not sent to our servers, so there is no upload step to wait for and no copy left behind.',
    },
    {
        icon: Zap, bg: 'bg-blue-50', fg: 'text-blue-600',
        title: 'No queues, no waiting for uploads',
        text: 'Online converters that use a server have to upload your file, wait in line, process it and send it back. Here the work starts the moment you click, so speed depends on your own device instead of your internet connection.',
    },
    {
        icon: Cpu, bg: 'bg-green-50', fg: 'text-green-600',
        title: 'Nothing to install',
        text: 'Open the site in Chrome, Edge, Firefox or Safari and start working. There is no desktop software, no extension and no account to create, which makes it practical on shared or locked-down computers.',
    },
    {
        icon: Layers, bg: 'bg-purple-50', fg: 'text-purple-600',
        title: 'Real control, not just one button',
        text: 'Reorder files by drag and drop, pick individual pages from thumbnails, preview a watermark before applying it, choose the DPI of exported images, and name the output file. The advanced options are there when you need them.',
    },
    {
        icon: Smartphone, bg: 'bg-amber-50', fg: 'text-amber-600',
        title: 'Works on phones and tablets',
        text: 'The layout adapts to small screens and touch input. Everything works on a phone, though very large PDFs are easier to handle on a computer because phones have less memory available to the browser.',
    },
    {
        icon: Wallet, bg: 'bg-teal-50', fg: 'text-teal-600',
        title: 'Free to use',
        text: 'The tools are free. There are no watermarks added by us, no page limits that we impose, and no sign-up wall. The site is supported by voluntary donations and advertising, never by locking features.',
    },
];

export const TOOLS: Tool[] = [
    {
        name: 'Merge PDF', href: '/merge-pdf', icon: Files, bg: 'bg-red-50', fg: 'text-red-600',
        tagline: 'Combine several PDFs into one document.',
        description: 'Add as many PDF files as you need, arrange them in the exact order you want, and choose which pages of each file to include. Every file shows its page count and size, and you can open any file to see thumbnails of its pages.',
        features: [
            'Drag and drop to reorder files, or use the up and down buttons',
            'Sort by file name (A–Z or Z–A) or reverse the whole list',
            'Type a page range such as 1-3, 5, 8-10 for each file',
            'Click page thumbnails to include or leave out single pages',
            'Choose the name of the merged file',
        ],
        bestFor: 'Joining invoices into one monthly statement, combining scanned chapters, or building a single application pack from separate documents.',
        limits: 'Password-protected files may fail to open. Very large combined files depend on your device’s available memory.',
    },
    {
        name: 'Split PDF', href: '/split-pdf', icon: Scissors, bg: 'bg-blue-50', fg: 'text-blue-600',
        tagline: 'Extract, delete or cut a PDF into parts.',
        description: 'Four modes cover the common jobs: extract chosen pages into one new PDF, delete unwanted pages, split by custom ranges so every range becomes its own file, or split every N pages. A preview list shows exactly which files will be created before you start.',
        features: [
            'Extract mode: pick pages from thumbnails or by typing ranges',
            'Delete mode: remove pages and keep everything else',
            'Ranges mode: 1-3, 4-6, 8 creates three separate PDFs',
            'Every-N mode: use 1 for one file per page',
            'Multiple results are packed into a single ZIP file',
        ],
        bestFor: 'Pulling one chapter out of a long report, removing a blank or confidential page, or sending each page of a scanned batch to a different person.',
        limits: 'Splitting keeps the original page content as it is. It does not shrink the file size of each part below what its pages require.',
    },
    {
        name: 'Rotate PDF', href: '/rotate-pdf', icon: RotateCw, bg: 'bg-teal-50', fg: 'text-teal-600',
        tagline: 'Fix sideways or upside-down pages.',
        description: 'See every page as a thumbnail and rotate it left or right individually, or rotate groups of pages at once. You can also mark pages for removal in the same step, so one pass fixes a messy scan.',
        features: [
            'Per-page rotate left and right with live thumbnail rotation',
            'Rotate all pages, only odd pages, only even pages, or the selected pages',
            'Mark pages for removal and restore them if you change your mind',
            'Summary of how many pages were rotated and removed',
            'Existing page rotation is respected and your change is added on top',
        ],
        bestFor: 'Scans where a few pages came out sideways, or documents where landscape tables are mixed with portrait text.',
        limits: 'Rotation changes how the page is displayed. It does not re-render or alter the content of the page.',
    },
    {
        name: 'Add Watermark', href: '/watermark-pdf', icon: Stamp, bg: 'bg-indigo-50', fg: 'text-indigo-600',
        tagline: 'Stamp text or a logo on your pages.',
        description: 'Add a text or image watermark with a live preview of the first page. Control size, opacity, rotation and position, repeat the mark across the page as a tile, and apply it to all pages or only the ones you choose.',
        features: [
            'Text watermarks with font, size, color, opacity and any rotation angle',
            'Image watermarks from a PNG or JPG logo, sized as a percentage of page width',
            '3×3 position grid with an adjustable edge margin',
            'Tile mode with adjustable spacing to cover the whole page',
            'Text tokens: {page}, {total} and {date} are replaced on each page',
        ],
        bestFor: 'Marking drafts as DRAFT or CONFIDENTIAL, adding a company logo to proposals, or discouraging reuse of shared documents.',
        limits: 'The watermark is drawn on top of the page. Built-in PDF fonts support Latin characters, so use the image option for other scripts.',
    },
    {
        name: 'Add Page Numbers', href: '/page-numbers', icon: Hash, bg: 'bg-pink-50', fg: 'text-pink-600',
        tagline: 'Number your pages in the style you need.',
        description: 'Choose where the number goes, how it looks and which pages receive it. A live preview on the first page shows the final placement before you apply anything.',
        features: [
            'Six positions: top or bottom, left, center or right',
            'Styles: 1 2 3, i ii iii, I II III, a b c or A B C',
            'Formats such as Page 1 of N, 1 / N, - 1 - or your own template',
            'Start from any number and number only a page range',
            'Skip the cover page, or mirror the position on even pages for book layouts',
        ],
        bestFor: 'Reports, legal bundles, theses and manuals where the front matter needs roman numerals and the body starts again at 1.',
        limits: 'Numbers are added as text on the page and cannot be edited later except by repeating the process on the original file.',
    },
    {
        name: 'JPG to PDF', href: '/jpg-to-pdf', icon: FileText, bg: 'bg-purple-50', fg: 'text-purple-600',
        tagline: 'Turn photos and scans into a PDF.',
        description: 'Combine JPG, PNG, WebP and other images into one PDF. Reorder them, rotate any image, and choose the page size, orientation, margin and image quality that suit the document.',
        features: [
            'Accepts JPG, PNG, WebP, GIF, BMP and AVIF images',
            'Page sizes: fit to image, A4, US Letter or US Legal',
            'Orientation: automatic, portrait or landscape',
            'Margin presets and a choice between fit inside page or fill page',
            'Quality presets from original down to smallest file size',
        ],
        bestFor: 'Turning phone photos of receipts, forms or ID documents into one tidy PDF that can be emailed or uploaded to a portal.',
        limits: 'Very large photos (12 megapixels and above) can be slow on older phones. Use a lower quality preset to keep the PDF small.',
    },
    {
        name: 'PDF to JPG', href: '/pdf-to-jpg', icon: ImageIcon, bg: 'bg-amber-50', fg: 'text-amber-600',
        tagline: 'Save PDF pages as images.',
        description: 'Render the pages you select into JPG, PNG or WebP images at a resolution you choose. One page downloads as a single image, and several pages are delivered together in a ZIP file.',
        features: [
            'Output formats: JPG, PNG (lossless) or WebP',
            'Resolution from 72 to 300 DPI with the final pixel size shown in advance',
            'Quality slider for JPG and WebP',
            'Choose pages from thumbnails or by typing a range',
            'Clear file names such as document-page-03.jpg',
        ],
        bestFor: 'Sharing a page on social media, placing a PDF page inside a presentation, or creating thumbnails and previews.',
        limits: 'To protect your browser from running out of memory, each page is capped at about 25 megapixels, so extremely large pages are scaled down slightly.',
    },
];

export const GUIDES: Guide[] = [
    {
        id: 'how-to-merge-pdf', title: 'How to merge PDF files', href: '/merge-pdf',
        intro: 'Use this when several documents need to become one file, for example monthly invoices that must be sent together.',
        steps: [
            'Open the Merge PDF tool and select all the PDF files you want to combine, or drag them onto the page.',
            'Check the order in the list. Drag a file by its handle, or use the arrows, until the sequence is right.',
            'If you only need some pages from a file, type a range such as 1-3, 5 in its box, or open it and click the page thumbnails.',
            'Type the name you want for the new file.',
            'Click the merge button, wait for the progress window to reach 100%, then press Download.',
        ],
        tips: [
            'Name files with numbers (01, 02, 03) first and use the A–Z sort for an instant correct order.',
            'Add files in several batches if they are in different folders. The list keeps growing.',
            'Open one file’s page view before merging when you are unsure which pages are inside it.',
        ],
    },
    {
        id: 'how-to-split-pdf', title: 'How to split or extract pages from a PDF', href: '/split-pdf',
        intro: 'Use this to take a part of a long document, or to break it into smaller files.',
        steps: [
            'Open the Split PDF tool and choose your PDF.',
            'Pick a mode. Extract pages for one new file, Delete pages to remove pages, Split by ranges for several files, or Split every N pages for equal parts.',
            'Select pages by clicking thumbnails or typing ranges. The result list under the options shows exactly what will be created.',
            'Set the output name and click the action button.',
            'Download the PDF, or the ZIP file when several PDFs were produced.',
        ],
        tips: [
            'To separate a document into chapters, use ranges mode and type the first and last page of each chapter.',
            'To remove one sensitive page, use Delete mode rather than extracting every other page.',
            'Splitting into a very large number of parts creates a long ZIP. Check the preview count first.',
        ],
    },
    {
        id: 'how-to-rotate-pdf', title: 'How to rotate pages in a PDF', href: '/rotate-pdf',
        intro: 'Use this when a scan came out sideways or only a few pages need turning.',
        steps: [
            'Open the Rotate PDF tool and choose your file. Page thumbnails appear as they load.',
            'Click the rotate arrows under a single page, or use the bulk buttons to turn all, odd or even pages.',
            'To turn several specific pages together, click them to select and then use the selected-pages buttons.',
            'Use the trash icon to mark any unwanted pages for removal. You can restore them before saving.',
            'Click Apply, wait for 100% and download the corrected file.',
        ],
        tips: [
            'The thumbnail turns immediately, so you can see the result before creating the file.',
            'If you rotate by mistake, use Reset all to return every page to its starting state.',
        ],
    },
    {
        id: 'how-to-add-watermark', title: 'How to add a watermark to a PDF', href: '/watermark-pdf',
        intro: 'Use this to label drafts, brand a document, or discourage unauthorized copying.',
        steps: [
            'Open the Add Watermark tool and choose your PDF.',
            'Choose Text watermark or Image watermark. For text, type your wording. For an image, select a PNG or JPG logo.',
            'Adjust size, opacity and rotation while watching the live preview of page 1.',
            'Choose a position on the 3×3 grid, or turn on tile mode to repeat the mark across the page.',
            'Choose which pages to stamp, then click Add Watermark and download the result.',
        ],
        tips: [
            'An opacity of 25–40% keeps the page readable while the mark stays visible.',
            'A transparent PNG logo looks cleaner than a JPG because there is no white box around it.',
            'Use {page} and {total} in the text to print Page 3 of 12 on every page.',
        ],
    },
    {
        id: 'how-to-add-page-numbers', title: 'How to add page numbers to a PDF', href: '/page-numbers',
        intro: 'Use this for reports, bundles and any document that has to be referred to by page.',
        steps: [
            'Open the Add Page Numbers tool and choose your PDF.',
            'Pick a position and a number style, such as 1, 2, 3 or roman numerals.',
            'Choose a text format like Page 1 of N, or write a custom one with {n} and {total}.',
            'Set the start number, the pages to number, and whether to skip the first page.',
            'Check the preview, then apply and download.',
        ],
        tips: [
            'For a cover page, tick Skip the first page and the second page will be numbered 1.',
            'For front matter in roman numerals, number that range first, then number the rest again from 1 in a second pass.',
            'Use the mirror option for documents that will be printed double-sided as a book.',
        ],
    },
    {
        id: 'how-to-convert-jpg-to-pdf', title: 'How to convert images to PDF', href: '/jpg-to-pdf',
        intro: 'Use this to turn photos and scans into a single document.',
        steps: [
            'Open the JPG to PDF tool and select your images.',
            'Arrange them in order and rotate any image that is the wrong way up.',
            'Choose the page size, orientation, margin and quality in the settings box.',
            'Name the file and click Convert.',
            'Wait for the progress window to finish and download your PDF.',
        ],
        tips: [
            'Choose A4 with a small margin for documents that will be printed.',
            'Choose Fit to image to keep every photo at its original proportions with no white borders.',
            'Use Medium quality to cut file size noticeably when sending by email.',
        ],
    },
    {
        id: 'how-to-convert-pdf-to-jpg', title: 'How to convert PDF pages to images', href: '/pdf-to-jpg',
        intro: 'Use this when you need a page as a picture rather than a document.',
        steps: [
            'Open the PDF to JPG tool and select your PDF.',
            'Choose the format and the DPI. 150 DPI is a good balance for screens and 300 DPI suits printing.',
            'Select the pages you need from the thumbnails or by typing a range.',
            'Click the convert button and watch the progress window.',
            'Download the single image, or the ZIP file when you converted several pages.',
        ],
        tips: [
            'Choose PNG for pages with sharp text and lines, and JPG for pages dominated by photographs.',
            'The tool shows the final pixel size so you can check it before converting.',
        ],
    },
];

export const USE_CASES: UseCase[] = [
    { icon: GraduationCap, title: 'Students', text: 'Combine lecture notes, remove cover pages from downloaded papers, number a thesis, and turn photographed handwritten pages into a single PDF for submission.' },
    { icon: Briefcase, title: 'Freelancers and small businesses', text: 'Merge quotations and terms into one proposal, add your logo as a watermark, and send a single tidy file rather than a folder of attachments.' },
    { icon: Receipt, title: 'Accounting and invoicing', text: 'Join the month’s invoices, add page numbers to a statement, and extract just the pages a client needs without exposing the rest of the file.' },
    { icon: Scale, title: 'Legal and compliance', text: 'Number bundles consistently, mark documents as CONFIDENTIAL or DRAFT, and keep sensitive files on your own device while you work on them.' },
    { icon: Camera, title: 'Photographers and designers', text: 'Export PDF pages as high-resolution PNG or JPG for portfolios, and assemble image sets into a presentation-ready PDF.' },
    { icon: Users, title: 'Teachers and offices', text: 'Split a scanned stack into one file per student, fix sideways scans in seconds and prepare worksheets for printing.' },
];

export const COMPARISON = {
    columns: ['This site (in your browser)', 'Typical upload-based website', 'Desktop PDF software'],
    rows: [
        { label: 'Where files are processed', values: ['On your device', 'On the website’s servers', 'On your device'] },
        { label: 'Upload and download time', values: ['None for processing', 'Depends on file size and connection', 'None'] },
        { label: 'Installation', values: ['None', 'None', 'Required'] },
        { label: 'Account needed', values: ['No', 'Often for larger files', 'Often a license'] },
        { label: 'Works on a locked-down computer', values: ['Yes, in a browser', 'Yes, in a browser', 'Usually not'] },
        { label: 'Large-file limits', values: ['Your device’s memory', 'Set by the provider', 'Your device’s memory'] },
        { label: 'Cost', values: ['Free', 'Free tier with limits, paid plans', 'Often paid'] },
    ],
};

export const TROUBLESHOOTING: { problem: string; fix: string }[] = [
    { problem: 'A PDF will not open in a tool', fix: 'The file may be password protected or damaged. Remove the password in the program that created it and try again, or re-save the file from your PDF viewer.' },
    { problem: 'The browser becomes slow or the tab crashes', fix: 'Large files use a lot of memory. Close other tabs, work with fewer pages at a time, lower the DPI when exporting images, or use a computer instead of a phone.' },
    { problem: 'Page thumbnails stay on “Loading”', fix: 'Thumbnails are drawn one after another, so long documents take longer. The tools still work before every thumbnail has appeared. If none appear, reload the page and choose the file again.' },
    { problem: 'My watermark or page number text is missing some letters', fix: 'The standard fonts built into PDF files support Latin characters only. For other scripts, create the text as a PNG image and use the image watermark option.' },
    { problem: 'The downloaded file did not appear', fix: 'Check your browser’s downloads list and any pop-up blocker. On some phones the file is saved in a Downloads folder instead of opening automatically.' },
    { problem: 'The merged file is very large', fix: 'Merging keeps the content of each source file. If the result is too big for email, reduce the size of the images in the source files before combining them.' },
    { problem: 'Rotated pages look different on my phone and my computer', fix: 'Some PDFs store their own rotation setting. Open the result in two viewers to compare. If the two disagree, rotate again by the missing angle.' },
];

export const PRIVACY_POINTS: string[] = [
    'The files you choose are read by your browser using standard web features and are held in memory only while you work.',
    'Processing is done by JavaScript libraries that run on your device. The result is created as a temporary file inside your browser and offered to you as a download.',
    'Closing the tab or choosing “Start over” discards the working data.',
    'Like most free websites, this site can load advertising and analytics scripts. Those scripts run separately from the PDF tools and do not receive the contents of your files. See the Privacy Policy for what is collected and why.',
];

export const SUPPORTED: { tool: string; input: string; output: string }[] = [
    { tool: 'Merge PDF', input: 'PDF', output: 'PDF' },
    { tool: 'Split PDF', input: 'PDF', output: 'PDF, or ZIP of PDFs' },
    { tool: 'Rotate PDF', input: 'PDF', output: 'PDF' },
    { tool: 'Add Watermark', input: 'PDF, plus PNG or JPG for logos', output: 'PDF' },
    { tool: 'Add Page Numbers', input: 'PDF', output: 'PDF' },
    { tool: 'JPG to PDF', input: 'JPG, PNG, WebP, GIF, BMP, AVIF', output: 'PDF' },
    { tool: 'PDF to JPG', input: 'PDF', output: 'JPG, PNG or WebP, or ZIP of images' },
];

export const FAQS: Faq[] = [
    { q: 'Are my uploaded files stored anywhere?', a: 'No. Nothing is uploaded for processing. Your files are opened and edited inside your own browser, and the finished file is created on your device. We do not receive, view or keep copies of your documents.' },
    { q: 'How can I check that my files really stay on my device?', a: 'Open your browser’s developer tools (press F12), go to the Network tab, and then run any tool. You will see that no request carries your file to a server. You can even turn off your internet connection after the page has loaded and the tools will continue to work.' },
    { q: 'What file formats are supported?', a: 'PDF is supported by every tool. Images in JPG, PNG, WebP, GIF, BMP and AVIF can be turned into a PDF, and PDF pages can be saved as JPG, PNG or WebP. Logos for watermarks can be PNG or JPG.' },
    { q: 'Is mypdf.site completely free?', a: 'Yes. The tools are free to use, with no sign-up and no limits set by us. The site is supported by advertising and optional donations.' },
    { q: 'Is there a file size limit?', a: 'We do not set one. The practical limit is your device’s memory. Desktop computers usually handle PDFs of several hundred pages, while phones are more comfortable with smaller files. Exporting images from PDF is capped at around 25 megapixels per page to avoid crashes.' },
    { q: 'Can I use it on my mobile phone?', a: 'Yes. The site is responsive and designed for touch. For very large files, a computer will be faster and more reliable.' },
    { q: 'Will merging or splitting reduce the quality of my pages?', a: 'No. Merge, split, rotate, watermark and page-number tools copy your original pages into the new file without re-rendering them, so text stays selectable and images keep their original quality.' },
    { q: 'Why is the text in my new PDF still selectable?', a: 'Because the pages are copied, not turned into pictures. Only PDF to JPG deliberately turns pages into images.' },
    { q: 'Can I merge only some pages from each file?', a: 'Yes. In the Merge tool, type a range such as 1-3, 5 for a file, or open the file and click the thumbnails of the pages you want.' },
    { q: 'Can I reorder files before merging?', a: 'Yes. Drag files by their handle, use the up and down arrows, or sort them by name.' },
    { q: 'Does it work with password-protected PDFs?', a: 'Files that need a password to open are not supported. Remove the password in the program that created the file, then try again.' },
    { q: 'Can I add a watermark in a language other than English?', a: 'Text watermarks use the standard PDF fonts, which cover Latin characters. For other scripts, make the text as a PNG image and use the image watermark option.' },
    { q: 'What is DPI and which setting should I choose for PDF to JPG?', a: 'DPI means dots per inch and controls how detailed the exported image is. 72–100 DPI is enough for small previews, 150 DPI suits screens and sharing, and 300 DPI suits printing.' },
    { q: 'Which is better for PDF to image: JPG, PNG or WebP?', a: 'Use PNG for pages with sharp text and line art because it is lossless. Use JPG or WebP for pages full of photographs, where smaller files matter more than perfect edges.' },
    { q: 'Does the site work offline?', a: 'After the page has fully loaded, the tools can keep working without a connection because processing happens locally. You need to be online to load the site in the first place.' },
    { q: 'Which browsers are supported?', a: 'Recent versions of Chrome, Edge, Firefox and Safari. Older browsers may not support all the features the tools rely on.' },
    { q: 'I found a problem or want a new tool. What should I do?', a: 'Please use the Contact page or the feedback page and describe what happened, including your browser and device. Reports like this are how the tools improve.' },
    { q: 'How can I support the project?', a: 'Use the Support Project page. Sharing the site with people who need it also helps.' },
];

export const GLOSSARY: Term[] = [
    { term: 'PDF', def: 'Portable Document Format. A file type designed to look the same on every device, whatever software opened it.' },
    { term: 'Page range', def: 'A way to name pages. “1-3, 5” means pages 1, 2, 3 and 5.' },
    { term: 'DPI', def: 'Dots per inch. A higher number gives a sharper image and a bigger file.' },
    { term: 'Rasterize', def: 'To turn a page into a picture made of pixels, as the PDF to JPG tool does.' },
    { term: 'Thumbnail', def: 'A small preview image of a page, used to choose pages quickly.' },
    { term: 'Opacity', def: 'How solid something looks. 100% is fully solid and lower values show the page underneath.' },
    { term: 'Tile', def: 'A pattern in which a watermark repeats across the page.' },
    { term: 'ZIP file', def: 'A single archive that holds several files, used when a tool creates more than one output.' },
    { term: 'Client-side processing', def: 'Work done inside your own browser or device instead of on a remote server.' },
    { term: 'Metadata', def: 'Hidden information stored inside a PDF, such as its title and author.' },
    { term: 'Roman numerals', def: 'Numbering such as i, ii, iii, often used for the front pages of books and reports.' },
    { term: 'Encryption', def: 'Protection that locks a PDF with a password so only people who know it can open the file.' },
];

export const TOC: { id: string; label: string }[] = [
    { id: 'why', label: 'Why use it' },
    { id: 'tools', label: 'All tools' },
    { id: 'how-it-works', label: 'How it works' },
    { id: 'guides', label: 'Step-by-step guides' },
    { id: 'use-cases', label: 'Who uses it' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'comparison', label: 'Comparison' },
    { id: 'troubleshooting', label: 'Troubleshooting' },
    { id: 'faq', label: 'FAQ' },
    { id: 'glossary', label: 'Glossary' },
];

export { ShieldCheck, Zap, Cpu };
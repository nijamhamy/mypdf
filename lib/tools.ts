import {
    Files, Scissors, RotateCw, Stamp, Hash, Image as ImageIcon, FileText, Minimize2,
    type LucideIcon,
} from 'lucide-react';


export type ToolCategory = 'convert' | 'organize' | 'edit' | 'optimize';


export interface ToolFaq {
    q: string;
    a: string;
}


export interface ToolInfo {
    id: string;
    title: string;
    href: string;
    category: ToolCategory;
    short: string;
    points: string[];
    keywords: string[];
    icon: LucideIcon;
    iconColor: string;
    cardBg: string;
    badge?: string;
    seoTitle: string;
    seoDescription: string;
    faqs: ToolFaq[];
}


export const CATEGORY_LABELS: Record<ToolCategory, string> = {
    convert: 'Convert',
    organize: 'Organize',
    edit: 'Edit',
    optimize: 'Optimize',
};


export const TOOLS: ToolInfo[] = [
    {
        id: 'pdf-to-jpg', title: 'PDF to JPG', href: '/pdf-to-jpg', category: 'convert',
        short: 'Save PDF pages as JPG, PNG or WebP images at the resolution you choose.',
        points: ['72–300 DPI with pixel size preview', 'Pick pages from thumbnails', 'Several pages download as a ZIP'],
        keywords: ['pdf to jpg', 'pdf to image', 'pdf to png', 'convert pdf to jpg', 'webp', 'dpi'],
        icon: ImageIcon, iconColor: 'text-amber-500', cardBg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
        badge: 'Advanced',
        seoTitle: 'PDF to JPG Converter',
        seoDescription: 'Convert PDF pages to JPG, PNG or WebP at 72–300 DPI. Free, runs in your browser, no upload.',
        faqs: [
            { q: 'Is my PDF uploaded to a server?', a: 'No. The conversion runs in your browser, so your file stays on your device.' },
            { q: 'Can I convert only some pages?', a: 'Yes. Pick the pages you want from the thumbnails. Several images download as a ZIP.' },
            { q: 'Which resolution should I choose?', a: 'Use 72–100 DPI for screens and 150–300 DPI for printing or sharp detail.' },
        ],
    },
    {
        id: 'jpg-to-pdf', title: 'JPG to PDF', href: '/jpg-to-pdf', category: 'convert',
        short: 'Turn JPG, PNG, WebP and other images into one PDF with page size and quality options.',
        points: ['Reorder and rotate images', 'A4, Letter, Legal or fit to image', 'Quality presets to shrink the file'],
        keywords: ['jpg to pdf', 'image to pdf', 'photo to pdf', 'png to pdf', 'scan to pdf', 'webp'],
        icon: FileText, iconColor: 'text-purple-500', cardBg: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
        badge: 'Advanced',
        seoTitle: 'JPG to PDF Converter',
        seoDescription: 'Combine JPG, PNG and WebP images into one PDF. Reorder, rotate, pick A4 or Letter. Free, no upload.',
        faqs: [
            { q: 'Can I turn many images into one PDF?', a: 'Yes. Add the images, drag them into order, rotate if needed, then create one PDF.' },
            { q: 'Which page sizes are supported?', a: 'A4, Letter, Legal, or a page that fits each image.' },
            { q: 'Can I make the PDF smaller?', a: 'Yes. Use the quality presets to reduce the file size.' },
        ],
    },
    {
        id: 'merge-pdf', title: 'Merge PDF', href: '/merge-pdf', category: 'organize',
        short: 'Combine several PDFs into one document in exactly the order you want.',
        points: ['Drag and drop ordering', 'Choose pages from each file', 'Sort A–Z or reverse the list'],
        keywords: ['merge pdf', 'combine pdf', 'join pdf', 'append pdf', 'reorder pages'],
        icon: Files, iconColor: 'text-red-500', cardBg: 'bg-red-50 hover:bg-red-100 border-red-200',
        badge: 'Advanced',
        seoTitle: 'Merge PDF Files',
        seoDescription: 'Combine several PDFs into one document in any order. Free, private, runs in your browser.',
        faqs: [
            { q: 'How do I combine PDF files?', a: 'Add your PDFs, drag them into the order you want, and click merge.' },
            { q: 'Can I use only some pages from each file?', a: 'Yes. Choose the pages you want from each PDF before merging.' },
            { q: 'Are my files kept private?', a: 'Yes. Merging happens in your browser and nothing is uploaded.' },
        ],
    },
    {
        id: 'split-pdf', title: 'Split PDF', href: '/split-pdf', category: 'organize',
        short: 'Extract pages, delete pages, or cut a PDF into several smaller files.',
        points: ['Extract, delete, ranges or every N pages', 'Preview of the files before creating', 'Results delivered as a ZIP'],
        keywords: ['split pdf', 'extract pages from pdf', 'delete pdf pages', 'remove pages', 'divide pdf'],
        icon: Scissors, iconColor: 'text-blue-500', cardBg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
        badge: 'Advanced',
        seoTitle: 'Split PDF',
        seoDescription: 'Extract or delete pages and split a PDF into smaller files. Free, private, no upload.',
        faqs: [
            { q: 'How do I extract pages from a PDF?', a: 'Choose Extract, enter the pages or ranges, check the preview, then create the files.' },
            { q: 'Can I split every N pages?', a: 'Yes. Choose the every-N-pages option and download the results as a ZIP.' },
            { q: 'Can I delete pages instead?', a: 'Yes. Use the delete option to remove the pages you do not need.' },
        ],
    },
    {
        id: 'rotate-pdf', title: 'Rotate PDF', href: '/rotate-pdf', category: 'organize',
        short: 'Fix sideways or upside-down pages one by one or all at once.',
        points: ['Per-page rotate with live preview', 'Rotate odd, even or selected pages', 'Remove pages in the same step'],
        keywords: ['rotate pdf', 'rotate pdf pages', 'flip pdf', 'fix sideways pdf', 'landscape', 'portrait'],
        icon: RotateCw, iconColor: 'text-teal-500', cardBg: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
        badge: 'Advanced',
        seoTitle: 'Rotate PDF Pages',
        seoDescription: 'Rotate sideways or upside-down PDF pages one by one or all at once. Free, no upload.',
        faqs: [
            { q: 'Can I rotate only some pages?', a: 'Yes. Rotate single pages, odd pages, even pages or a selection.' },
            { q: 'Is the rotation saved in the file?', a: 'Yes. The PDF you download has the new orientation.' },
            { q: 'Can I delete pages while rotating?', a: 'Yes. You can remove pages in the same step.' },
        ],
    },
    {
        id: 'watermark-pdf', title: 'Add Watermark', href: '/watermark-pdf', category: 'edit',
        short: 'Stamp text or a logo on your pages with a live preview before you apply it.',
        points: ['Text or image watermarks', 'Opacity, rotation and tile mode', 'Apply to all, odd, even or chosen pages'],
        keywords: ['add watermark to pdf', 'pdf watermark', 'stamp pdf', 'logo on pdf', 'confidential watermark'],
        icon: Stamp, iconColor: 'text-indigo-500', cardBg: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
        badge: 'Advanced',
        seoTitle: 'Add Watermark to PDF',
        seoDescription: 'Add a text or logo watermark to a PDF with opacity, rotation and tiling. Free, no upload.',
        faqs: [
            { q: 'Can I use my logo as a watermark?', a: 'Yes. Upload a PNG or JPG image, or type text, then adjust opacity and rotation.' },
            { q: 'Can I watermark only certain pages?', a: 'Yes. Apply it to all, odd, even or chosen pages.' },
            { q: 'Can I see the result first?', a: 'Yes. A live preview shows the watermark before you apply it.' },
        ],
    },
    {
        id: 'page-numbers', title: 'Add Page Numbers', href: '/page-numbers', category: 'edit',
        short: 'Number your pages with the position, style and format you need.',
        points: ['Six positions and roman numerals', 'Formats like Page 1 of N', 'Skip the cover or number a range'],
        keywords: ['add page numbers to pdf', 'pdf page numbering', 'number pdf pages', 'roman numerals', 'footer'],
        icon: Hash, iconColor: 'text-pink-500', cardBg: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
        badge: 'Advanced',
        seoTitle: 'Add Page Numbers to PDF',
        seoDescription: 'Add page numbers to a PDF: six positions, roman numerals, Page 1 of N. Free, no upload.',
        faqs: [
            { q: 'Can I skip the cover page?', a: 'Yes. Tick the option to skip the first page, or number only a range of pages.' },
            { q: 'Which number formats are available?', a: 'Plain numbers, roman numerals, letters, and formats like Page 1 of N or 1 / N.' },
            { q: 'Where can the numbers go?', a: 'In any of six positions across the top and bottom of the page.' },
        ],
    },
    {
        id: 'compress-pdf', title: 'Compress PDF', href: '/compress-pdf', category: 'optimize',
        short: 'Optimize a PDF to reduce its size where possible, for easier email, upload and sharing.',
        points: ['Optimizes the PDF file structure', 'Runs in your browser', 'No sign-up needed'],
        keywords: ['compress pdf', 'reduce pdf size', 'shrink pdf', 'pdf smaller', 'pdf for email'],
        icon: Minimize2, iconColor: 'text-green-500', cardBg: 'bg-green-50 hover:bg-green-100 border-green-200',
        seoTitle: 'Compress PDF',
        seoDescription: 'Optimize and re-save your PDF to reduce its size where possible. Free, no sign-up, runs in your browser.',
        faqs: [
            { q: 'How much smaller will my PDF get?', a: 'This tool optimizes the PDF structure. Results vary: files with a lot of internal overhead shrink the most, while PDFs full of photos or scans may change very little.' },
            { q: 'Will compressing lower the quality?', a: 'No. The tool does not recompress images, so the pages look the same. The trade-off is that image-heavy files may not get much smaller.' },
            { q: 'Is my file uploaded?', a: 'No. Compression runs in your browser, so your file stays on your device.' },
        ],
    },
];
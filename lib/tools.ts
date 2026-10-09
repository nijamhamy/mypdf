import {
    Files,
    Scissors,
    RotateCw,
    Stamp,
    Hash,
    Image as ImageIcon,
    FileText,
    Minimize2,
    FileOutput,
    Type,
    LayoutGrid,
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
        id: 'pdf-to-jpg',
        title: 'PDF to JPG',
        href: '/pdf-to-jpg',
        category: 'convert',
        short: 'Save PDF pages as JPG, PNG or WebP images at the resolution you choose.',
        points: [
            '72–300 DPI with pixel size preview',
            'Pick pages from thumbnails',
            'Several pages download as a ZIP',
        ],
        keywords: [
            'pdf to jpg converter',
            'pdf to jpg online free',
            'convert pdf to jpg',
            'pdf to image converter',
            'pdf to png converter',
            'pdf to webp converter',
            'extract images from pdf',
            'pdf page to jpg',
            'save pdf as jpg',
        ],
        icon: ImageIcon,
        iconColor: 'text-amber-500',
        cardBg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
        badge: 'Advanced',
        seoTitle: 'PDF to JPG Converter Online Free – Convert PDF to Images',
        seoDescription:
            'Convert PDF to JPG online for free. Extract PDF pages as high-quality JPG, PNG or WebP images in your browser. No signup and no file upload.',
        faqs: [
            {
                q: 'How do I convert a PDF to JPG?',
                a: 'Upload your PDF, select the pages you want, choose JPG format and resolution, then click Convert and download the images.',
            },
            {
                q: 'Can I convert every PDF page to a JPG image?',
                a: 'Yes. You can select all pages or specific pages, and each selected page becomes a separate image.',
            },
            {
                q: 'Can I convert PDF pages to PNG or WebP?',
                a: 'Yes. You can choose JPG, PNG or WebP as the output format.',
            },
            {
                q: 'Can I choose the image quality and resolution?',
                a: 'Yes. You can select from 72 to 300 DPI and adjust the JPG or WebP quality.',
            },
            {
                q: 'What happens if I convert multiple pages?',
                a: 'If you convert more than one page, all images are downloaded together as a ZIP file.',
            },
            {
                q: 'Are my PDF files uploaded to a server?',
                a: 'No. The PDF to image conversion runs in your browser, so your file stays on your device.',
            },
        ],
    },
    {
        id: 'jpg-to-pdf',
        title: 'JPG to PDF',
        href: '/jpg-to-pdf',
        category: 'convert',
        short: 'Turn JPG, PNG, WebP and other images into one PDF with page size and quality options.',
        points: [
            'Reorder and rotate images',
            'A4, Letter, Legal or fit to image',
            'Quality presets to shrink the file',
        ],
        keywords: [
            'jpg to pdf converter',
            'jpg to pdf online free',
            'convert jpg to pdf',
            'png to pdf converter',
            'image to pdf converter',
            'combine images into pdf',
            'multiple images to pdf',
            'photo to pdf converter',
        ],
        icon: FileText,
        iconColor: 'text-purple-500',
        cardBg: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
        badge: 'Advanced',
        seoTitle: 'JPG to PDF Converter Online Free – Convert Images to PDF',
        seoDescription:
            'Convert JPG, JPEG, PNG, WebP and other images to PDF online for free. Combine multiple images into one PDF in your browser. No signup or upload.',
        faqs: [
            {
                q: 'How do I convert JPG to PDF?',
                a: 'Upload one or more JPG images, arrange them in the order you want, choose your PDF settings, then click Convert and download the PDF.',
            },
            {
                q: 'Can I convert multiple JPG images into one PDF?',
                a: 'Yes. You can add multiple images and combine them into a single PDF file.',
            },
            {
                q: 'Which image formats are supported?',
                a: 'You can convert JPG, JPEG, PNG, WebP, GIF, BMP and AVIF images to PDF.',
            },
            {
                q: 'Can I change the order of images?',
                a: 'Yes. Drag and drop images to reorder them, or use the move up and move down buttons.',
            },
            {
                q: 'Are my images uploaded to a server?',
                a: 'No. The JPG to PDF conversion runs in your browser, so your images stay on your device.',
            },
            {
                q: 'Is this JPG to PDF converter free?',
                a: 'Yes. You can convert images to PDF for free without creating an account.',
            },
        ],
    },
    {
        id: 'pdf-to-word',
        title: 'PDF to Word',
        href: '/pdf-to-word',
        category: 'convert',
        short: 'Convert a PDF to an editable Word document, with OCR for scanned files.',
        points: [
            'Editable text with headings and bullets',
            'OCR for scanned PDFs',
            'Pick pages and keep page breaks',
        ],
        keywords: [
            'pdf to word converter',
            'pdf to word online free',
            'convert pdf to word',
            'pdf to docx converter',
            'pdf to editable word',
            'extract text from pdf',
            'scanned pdf to word ocr',
            'tamil pdf to word',
            'arabic pdf to word',
            'pdf to word without upload',
        ],
        icon: FileOutput,
        iconColor: 'text-sky-500',
        cardBg: 'bg-sky-50 hover:bg-sky-100 border-sky-200',
        badge: 'Advanced',
        seoTitle: 'PDF to Word Converter Online Free – Editable DOCX',
        seoDescription:
            'Convert PDF to Word online for free. Extract editable DOCX text, tables and images from PDF files in your browser. OCR supports Tamil, Arabic and more.',
        faqs: [
            {
                q: 'How do I convert a PDF to Word?',
                a: 'Upload your PDF, choose Editable text, Scanned PDF OCR or Page images mode, select the pages, then convert and download the DOCX file.',
            },
            {
                q: 'Can I edit the text after converting PDF to Word?',
                a: 'Yes. Editable text mode creates a Word document with editable text, headings, bullet points, tables and images where possible.',
            },
            {
                q: 'Can I convert a scanned PDF to Word?',
                a: 'Yes. Choose Scanned PDF (OCR), select the language of the text, then convert the scanned pages into editable Word text.',
            },
            {
                q: 'Does it support Tamil and Arabic PDFs?',
                a: 'Yes. OCR supports Tamil, Arabic, Hindi, Urdu and many other languages. Editable text mode also handles right-to-left text.',
            },
            {
                q: 'Are my PDF files uploaded to a server?',
                a: 'No. The PDF to Word conversion and OCR run in your browser, so your file stays on your device.',
            },
            {
                q: 'Is this PDF to Word converter free?',
                a: 'Yes. You can convert PDF files to Word for free without creating an account.',
            },
        ],
    },
    {
        id: 'merge-pdf',
        title: 'Merge PDF',
        href: '/merge-pdf',
        category: 'organize',
        short: 'Combine several PDFs into one document in exactly the order you want.',
        points: [
            'Drag and drop ordering',
            'Choose pages from each file',
            'Sort A–Z or reverse the list',
        ],
        keywords: [
            'merge pdf files online',
            'merge pdf online free',
            'combine pdf files',
            'combine pdfs into one',
            'pdf merger',
            'join pdf files',
            'merge pdf without upload',
            'select pages from pdf and merge',
        ],
        icon: Files,
        iconColor: 'text-red-500',
        cardBg: 'bg-red-50 hover:bg-red-100 border-red-200',
        badge: 'Advanced',
        seoTitle: 'Merge PDF Files Online Free – Combine PDFs',
        seoDescription:
            'Merge PDF files online for free. Combine multiple PDFs into one document, select pages and arrange their order in your browser. No signup or upload.',
        faqs: [
            {
                q: 'How do I merge PDF files?',
                a: 'Upload two or more PDF files, arrange them in the order you want, choose the pages you need, then click Merge and download the combined PDF.',
            },
            {
                q: 'Can I combine multiple PDFs into one file?',
                a: 'Yes. You can merge two or more PDF documents into a single PDF file.',
            },
            {
                q: 'Can I select only specific pages from a PDF?',
                a: 'Yes. Open a file, preview its pages and select only the pages you want, or enter a range such as 1-3, 5.',
            },
            {
                q: 'Can I change the order of PDF files before merging?',
                a: 'Yes. Drag and drop files to reorder them, or use A–Z, Z–A and Reverse sorting options.',
            },
            {
                q: 'Are my PDF files uploaded to a server?',
                a: 'No. The PDF merging process runs in your browser, so your files stay on your device.',
            },
            {
                q: 'Is this PDF merger free?',
                a: 'Yes. You can merge PDF files for free without creating an account.',
            },
        ],
    },
    {
        id: 'split-pdf',
        title: 'Split PDF',
        href: '/split-pdf',
        category: 'organize',
        short: 'Extract pages, delete pages, or cut a PDF into several smaller files.',
        points: [
            'Extract, delete, ranges or every N pages',
            'Preview of the files before creating',
            'Results delivered as a ZIP',
        ],
        keywords: [
            'split pdf online',
            'split pdf online free',
            'extract pages from pdf',
            'pdf splitter',
            'separate pdf pages',
            'extract pdf pages online',
            'remove pages from pdf',
            'split pdf into multiple files',
            'split pdf by page range',
        ],
        icon: Scissors,
        iconColor: 'text-blue-500',
        cardBg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
        badge: 'Advanced',
        seoTitle: 'Split PDF Online Free – Extract PDF Pages',
        seoDescription:
            'Split PDF online for free. Extract selected pages, delete unwanted pages, split by ranges or divide a PDF into equal parts in your browser.',
        faqs: [
            {
                q: 'How do I split a PDF?',
                a: 'Upload your PDF, choose a split mode, select the pages or page ranges, then create and download the new PDF files.',
            },
            {
                q: 'Can I extract specific pages from a PDF?',
                a: 'Yes. Choose Extract pages, then select pages visually or enter a range such as 1-3, 5.',
            },
            {
                q: 'Can I remove pages from a PDF?',
                a: 'Yes. Choose Delete pages, select the pages you want to remove, then save the remaining pages as a new PDF.',
            },
            {
                q: 'Can I split a PDF into multiple files?',
                a: 'Yes. Use Split by ranges or Split every N pages to create several separate PDF files.',
            },
            {
                q: 'What happens when I create multiple PDF files?',
                a: 'Multiple PDF files are downloaded together as one ZIP file.',
            },
            {
                q: 'Are my PDF files uploaded to a server?',
                a: 'No. The PDF splitting process runs in your browser, so your file stays on your device.',
            },
        ],
    },
    {
        id: 'rotate-pdf',
        title: 'Rotate PDF',
        href: '/rotate-pdf',
        category: 'organize',
        short: 'Fix sideways or upside-down pages one by one or all at once.',
        points: [
            'Per-page rotate with live preview',
            'Rotate odd, even or selected pages',
            'Remove pages in the same step',
        ],
        keywords: [
            'rotate pdf pages',
            'rotate pdf online free',
            'rotate pdf pages online',
            'fix sideways pdf',
            'turn pdf pages',
            'change pdf page orientation',
            'rotate scanned pdf',
            'pdf rotator',
            'delete pages from pdf',
        ],
        icon: RotateCw,
        iconColor: 'text-teal-500',
        cardBg: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
        badge: 'Advanced',
        seoTitle: 'Rotate PDF Pages Online Free – Fix Sideways PDF',
        seoDescription:
            'Rotate PDF pages online for free. Fix sideways scans, turn selected pages left or right, remove pages and download a corrected PDF in your browser.',
        faqs: [
            {
                q: 'How do I rotate PDF pages?',
                a: 'Upload your PDF, rotate individual pages or select multiple pages, then apply the changes and download the updated PDF.',
            },
            {
                q: 'Can I rotate only selected pages?',
                a: 'Yes. Click the pages you want to select, then rotate them left or right together.',
            },
            {
                q: 'Can I fix a sideways scanned PDF?',
                a: 'Yes. Rotate the scanned pages by 90 or 270 degrees until they display correctly.',
            },
            {
                q: 'Can I rotate a PDF by 180 degrees?',
                a: 'Yes. Use the All 180° option, or rotate a page twice in the same direction.',
            },
            {
                q: 'Can I remove pages while rotating a PDF?',
                a: 'Yes. Select the pages you do not need, click Remove, then create the final PDF.',
            },
            {
                q: 'Are my PDF files uploaded to a server?',
                a: 'No. The PDF rotation and page removal run in your browser, so your file stays on your device.',
            },
        ],
    },
    {
        id: 'edit-pdf',
        title: 'Edit PDF',
        href: '/edit-pdf',
        category: 'edit',
        short: 'Edit text, add text, highlight, draw, whiteout and insert images in your PDF.',
        points: [
            'Click existing text to edit it',
            'Any language for new text',
            'Secure flatten for permanent redaction',
        ],
        keywords: [
            'edit pdf online free',
            'edit pdf text online',
            'add text to pdf',
            'pdf editor online',
            'highlight pdf online',
            'whiteout pdf',
            'add image to pdf',
            'pdf editor no upload',
        ],
        icon: Type,
        iconColor: 'text-orange-500',
        cardBg: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
        badge: 'Advanced',
        seoTitle: 'Edit PDF Online Free – Add Text, Images & Annotations',
        seoDescription:
            'Edit PDF online for free. Change text, add text, highlight, whiteout, draw and insert images in your browser. No signup and no file upload.',
        faqs: [
            {
                q: 'Is this PDF editor free?',
                a: 'Yes. You can edit PDF files online for free without creating an account.',
            },
            {
                q: 'Are my PDF files uploaded to a server?',
                a: 'No. Your PDF is opened and edited in your browser, so the file does not leave your device.',
            },
            {
                q: 'Can I edit existing text in a PDF?',
                a: 'Yes. Choose Edit text, then click a line of text to replace or update it.',
            },
            {
                q: 'Can I add Tamil or Arabic text to a PDF?',
                a: 'Yes. Use the Add text tool and select the Unicode font option for Tamil, Arabic and other languages.',
            },
            {
                q: 'Can I remove sensitive text permanently?',
                a: 'Yes. Use Whiteout to cover the text, then enable Secure flatten before saving the PDF.',
            },
        ],
    },
    {
        id: 'image-sheet',
        title: 'Image Sheet Maker',
        href: '/image-sheet',
        category: 'edit',
        short: 'Repeat one image or a single-page PDF 2, 4, 8 or any number of times on an A4 sheet, or fill a page with passport-size photos.',
        points: [
            'Copies per sheet, custom grid or fixed photo size',
            'A4, Letter and other paper sizes with margins and cut lines',
            'Save as PDF, PNG or JPG at up to 600 DPI',
        ],
        keywords: [
            'images to pdf converter',
            'jpg to pdf online free',
            'png to pdf converter',
            'create pdf from images',
            'passport photo sheet maker',
            'photo grid pdf',
            'multiple images to one pdf',
            'print photo sheet online',
        ],
        icon: LayoutGrid,
        iconColor: 'text-cyan-500',
        cardBg: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200',
        badge: 'Advanced',
        seoTitle: 'Images to PDF Converter Online Free – Create PDF Sheets',
        seoDescription:
            'Convert JPG, PNG and WebP images to PDF online for free. Create photo sheets, passport photo layouts and printable grids in your browser.',
        faqs: [
            {
                q: 'How do I convert images to PDF?',
                a: 'Upload your image, choose the number of copies or grid layout, check the preview, then create and download the PDF.',
            },
            {
                q: 'Which image formats are supported?',
                a: 'You can use JPG, JPEG, PNG, WebP, GIF, BMP and AVIF images. You can also use a single-page PDF.',
            },
            {
                q: 'Can I make a passport photo sheet?',
                a: 'Yes. Choose Fixed photo size, select the passport photo preset, then create a printable sheet with cut lines.',
            },
            {
                q: 'Can I put multiple copies of one image on one page?',
                a: 'Yes. Choose Copies per sheet and select 2, 4, 8, 9, 12 or any number up to 200.',
            },
            {
                q: 'Are my images uploaded to a server?',
                a: 'No. The image sheet is created in your browser, so your image stays on your device.',
            },
            {
                q: 'Can I save the sheet as PNG or JPG?',
                a: 'Yes. You can save the first sheet as PNG or JPG, or save all sheets together as a PDF.',
            },
        ],
    },
    {
        id: 'watermark-pdf',
        title: 'Add Watermark',
        href: '/watermark-pdf',
        category: 'edit',
        short: 'Stamp text or a logo on your pages with a live preview before you apply it.',
        points: [
            'Text or image watermarks',
            'Opacity, rotation and tile mode',
            'Apply to all, odd, even or chosen pages',
        ],
        keywords: [
            'add watermark to pdf',
            'add watermark to pdf online free',
            'pdf watermark generator',
            'text watermark pdf',
            'image watermark pdf',
            'confidential pdf watermark',
            'draft pdf watermark',
            'logo watermark pdf',
            'watermark pdf without upload',
        ],
        icon: Stamp,
        iconColor: 'text-indigo-500',
        cardBg: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
        badge: 'Advanced',
        seoTitle: 'Add Watermark to PDF Online Free – Text or Image Watermark',
        seoDescription:
            'Add a watermark to PDF online for free. Add text or image watermarks, choose position, opacity, rotation and pages. Works in your browser with no upload.',
        faqs: [
            {
                q: 'How do I add a watermark to a PDF?',
                a: 'Upload your PDF, choose a text or image watermark, set its position, opacity and rotation, then apply and download the watermarked PDF.',
            },
            {
                q: 'Can I add a text watermark to a PDF?',
                a: 'Yes. You can add text such as CONFIDENTIAL, DRAFT, COPY or your business name.',
            },
            {
                q: 'Can I use an image or logo as a PDF watermark?',
                a: 'Yes. Upload a PNG or JPG logo and place it as a watermark on selected PDF pages.',
            },
            {
                q: 'Can I repeat the watermark across the page?',
                a: 'Yes. Enable Repeat across page (tile) to cover the entire page with repeated watermark copies.',
            },
            {
                q: 'Can I choose which pages get the watermark?',
                a: 'Yes. Apply the watermark to all pages, odd pages, even pages or a custom page range.',
            },
            {
                q: 'Are my PDF files uploaded to a server?',
                a: 'No. The watermark is added in your browser, so your PDF stays on your device.',
            },
        ],
    },
    {
        id: 'page-numbers',
        title: 'Add Page Numbers',
        href: '/page-numbers',
        category: 'edit',
        short: 'Number your pages with the position, style and format you need.',
        points: [
            'Six positions and roman numerals',
            'Formats like Page 1 of N',
            'Skip the cover or number a range',
        ],
        keywords: [
            'add page numbers to pdf',
            'add page numbers to pdf online free',
            'pdf page number generator',
            'number pdf pages',
            'insert page numbers in pdf',
            'pdf page numbering tool',
            'add footer page numbers pdf',
            'skip cover page numbering',
        ],
        icon: Hash,
        iconColor: 'text-pink-500',
        cardBg: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
        badge: 'Advanced',
        seoTitle: 'Add Page Numbers to PDF Online Free – Number PDF Pages',
        seoDescription:
            'Add page numbers to PDF online for free. Choose position, format, starting number and font. Number PDF pages in your browser without uploading files.',
        faqs: [
            {
                q: 'How do I add page numbers to a PDF?',
                a: 'Upload your PDF, choose the page number position, format and starting number, then apply the changes and download the updated PDF.',
            },
            {
                q: 'Can I choose where the page number appears?',
                a: 'Yes. You can place page numbers at the top or bottom, and select left, center or right alignment.',
            },
            {
                q: 'Can I start page numbering from a specific number?',
                a: 'Yes. You can choose the starting number for the first numbered page.',
            },
            {
                q: 'Can I skip the cover page?',
                a: 'Yes. Enable Skip the first page, or enter a custom page range to number only selected pages.',
            },
            {
                q: 'Can I use Roman numerals or letters?',
                a: 'Yes. You can use Arabic numbers, lowercase or uppercase Roman numerals, and lowercase or uppercase letters.',
            },
            {
                q: 'Are my PDF files uploaded to a server?',
                a: 'No. Page numbers are added in your browser, so your PDF stays on your device.',
            },
        ],
    },
    {
        id: 'compress-pdf',
        title: 'Compress PDF',
        href: '/compress-pdf',
        category: 'optimize',
        short: 'Optimize a PDF to reduce its size where possible, for easier email, upload and sharing.',
        points: [
            'Optimizes the PDF file structure',
            'Runs in your browser',
            'No sign-up needed',
        ],
        keywords: [
            'compress pdf online free',
            'compress pdf',
            'reduce pdf file size',
            'make pdf smaller',
            'pdf compressor',
            'compress pdf for email',
            'shrink pdf file',
        ],
        icon: Minimize2,
        iconColor: 'text-green-500',
        cardBg: 'bg-green-50 hover:bg-green-100 border-green-200',
        seoTitle: 'Compress PDF Online Free – Reduce PDF File Size',
        seoDescription:
            'Compress PDF online for free. Reduce PDF file size for email and uploads. Private browser-based PDF compressor with no signup.',
        faqs: [
            {
                q: 'How much smaller will my PDF get?',
                a: 'This tool optimizes the PDF structure. Results vary: files with a lot of internal overhead shrink the most, while PDFs full of photos or scans may change very little.',
            },
            {
                q: 'Will compressing lower the quality?',
                a: 'No. The tool does not recompress images, so the pages look the same. The trade-off is that image-heavy files may not get much smaller.',
            },
            {
                q: 'Is my file uploaded?',
                a: 'No. Compression runs in your browser, so your file stays on your device.',
            },
            {
                q: 'Is this PDF compressor free?',
                a: 'Yes. You can compress PDF files for free without creating an account.',
            },
        ],
    },
];
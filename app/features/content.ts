import {
    Files, Scissors, RotateCw, Stamp, Hash, Image as ImageIcon, FileText, Minimize2, FileOutput, Type, LayoutGrid,
    ShieldCheck, Zap, Cpu, Smartphone, Wallet, Layers, Languages, Pencil, BadgeCheck,
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
export interface Chooser { goal: string; tool: string; href: string; note: string }
export interface Limit { area: string; text: string }


export const CORE_FEATURES: Feature[] = [
    {
        icon: ShieldCheck, bg: 'bg-red-50', fg: 'text-red-600',
        title: 'Your files stay on your device',
        text: 'Every tool runs inside your browser. When you pick a file, it is read into your device’s memory, edited there, and saved back to your device. It is not sent to our servers, so there is no upload step to wait for and no copy left behind.',
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
        icon: Pencil, bg: 'bg-orange-50', fg: 'text-orange-600',
        title: 'Edit, convert and print in one place',
        text: 'Besides merging, splitting and rotating, you can edit text, highlight, whiteout and draw on a PDF, convert a PDF to an editable Word document, turn pages into images, or lay out several copies of a photo on one sheet ready to print.',
    },
    {
        icon: Languages, bg: 'bg-sky-50', fg: 'text-sky-600',
        title: 'Built with many languages in mind',
        text: 'PDF to Word and Edit PDF handle right-to-left scripts such as Arabic, Hebrew and Urdu and scripts such as Tamil, Hindi and Chinese. OCR for scanned files supports about forty languages. Results still depend on how the original PDF was made, and the limits are explained below.',
    },
    {
        icon: Smartphone, bg: 'bg-amber-50', fg: 'text-amber-600',
        title: 'Works on phones and tablets',
        text: 'The layout adapts to small screens and touch input. Everything works on a phone, though very large PDFs are easier to handle on a computer because phones have less memory available to the browser.',
    },
    {
        icon: BadgeCheck, bg: 'bg-emerald-50', fg: 'text-emerald-600',
        title: 'Honest about what each tool can do',
        text: 'A PDF is not a word-processing file, so no converter is perfect. Each tool page and this help center say plainly what is rebuilt, what is approximated and what is not supported, so you can choose the right option before you start.',
    },
    {
        icon: Wallet, bg: 'bg-teal-50', fg: 'text-teal-600',
        title: 'Free to use',
        text: 'The tools are free. There are no watermarks added by us, no page limits that we impose, and no sign-up wall. The site is supported by voluntary donations and advertising, never by locking features.',
    },
];


export const CHOOSER: Chooser[] = [
    { goal: 'Combine several PDFs into one', tool: 'Merge PDF', href: '/merge-pdf', note: 'Reorder files and pick pages from each.' },
    { goal: 'Take a few pages out, or delete pages', tool: 'Split PDF', href: '/split-pdf', note: 'Extract, delete, split by ranges or every N pages.' },
    { goal: 'Fix sideways or upside-down scans', tool: 'Rotate PDF', href: '/rotate-pdf', note: 'Rotate single pages, odd or even pages, or all pages.' },
    { goal: 'Make a PDF smaller for email', tool: 'Compress PDF', href: '/compress-pdf', note: 'Optimizes structure; results vary for photo-heavy files.' },
    { goal: 'Mark a document as DRAFT or add a logo', tool: 'Add Watermark', href: '/watermark-pdf', note: 'Text or image, with opacity, rotation and tiling.' },
    { goal: 'Number the pages of a report', tool: 'Add Page Numbers', href: '/page-numbers', note: 'Six positions, roman numerals, Page 1 of N.' },
    { goal: 'Fix a typo, add a note, highlight or sign', tool: 'Edit PDF', href: '/edit-pdf', note: 'Click text to edit it, or add text, shapes, drawings and images.' },
    { goal: 'Hide sensitive text permanently', tool: 'Edit PDF', href: '/edit-pdf', note: 'Cover the text with Whiteout, then save with Secure flatten.' },
    { goal: 'Print 2, 4 or 8 copies of one photo on one page', tool: 'Image Sheet Maker', href: '/image-sheet', note: 'Pick copies per sheet or a custom grid, then save a PDF.' },
    { goal: 'Make a passport photo sheet', tool: 'Image Sheet Maker', href: '/image-sheet', note: 'Choose a photo size preset and fit as many as the page allows.' },
    { goal: 'Turn photos or scans into one PDF', tool: 'JPG to PDF', href: '/jpg-to-pdf', note: 'Reorder, rotate and choose page size and quality.' },
    { goal: 'Use a PDF page as a picture', tool: 'PDF to JPG', href: '/pdf-to-jpg', note: 'JPG, PNG or WebP at 72–300 DPI.' },
    { goal: 'Edit a PDF in Microsoft Word', tool: 'PDF to Word', href: '/pdf-to-word', note: 'Editable text, bordered tables and images.' },
    { goal: 'Get text out of a scanned PDF', tool: 'PDF to Word', href: '/pdf-to-word', note: 'Use the OCR mode and choose the language of the text.' },
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
        name: 'Compress PDF', href: '/compress-pdf', icon: Minimize2, bg: 'bg-green-50', fg: 'text-green-600',
        tagline: 'Optimize a PDF to reduce its size where possible.',
        description: 'The tool re-saves your PDF with an optimized internal structure. Pages keep their original look because images are not recompressed, which also means the saving depends on how the file was built.',
        features: [
            'Optimizes the internal structure of the PDF',
            'Pages keep their original quality, because images are not recompressed',
            'Runs in your browser with no sign-up',
        ],
        bestFor: 'Files with extra internal overhead, such as documents saved many times or assembled from many parts, when you need a smaller attachment.',
        limits: 'PDFs full of large photos or scans may shrink very little. If you need a much smaller file and can accept that text becomes part of an image, export the pages with PDF to JPG at a lower quality and rebuild the PDF with JPG to PDF.',
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
        name: 'Edit PDF', href: '/edit-pdf', icon: Type, bg: 'bg-orange-50', fg: 'text-orange-600',
        tagline: 'Edit text, annotate and add images.',
        description: 'Open a PDF in an editor that runs in your browser. Click a line of existing text to change it, or add new text anywhere. Highlight, cover areas with whiteout, draw shapes and lines, sketch freehand, and insert images such as a signature. Select, move, resize, undo and redo any change.',
        features: [
            'Edit text: click a line, and the original is covered and replaced with editable text of the same size and color',
            'Add text with font, size, color, bold and italic, including Arabic, Tamil and other scripts',
            'Highlight, whiteout, rectangle, ellipse, line and freehand draw',
            'Insert images and resize them on the page',
            'Secure flatten option that turns pages into images so covered text is permanently removed',
        ],
        bestFor: 'Fixing a typo or date, adding a note or signature, highlighting key lines for review, or covering personal details before sharing.',
        limits: 'Editing replaces one line at a time and cannot reflow a whole paragraph. Replacement text uses a standard font, so it may look slightly different from the original. Covered text stays inside the file unless you use Secure flatten, which makes the saved PDF image-only.',
    },
    {
        name: 'Image Sheet Maker', href: '/image-sheet', icon: LayoutGrid, bg: 'bg-cyan-50', fg: 'text-cyan-600',
        tagline: 'Repeat one image or PDF page on a printable sheet.',
        description: 'Upload one image, or a PDF with a single page, and place it on a page as many times as you need. Choose copies per sheet, a custom grid of rows and columns, or a fixed photo size such as a passport photo, and let the tool fit as many as the page allows. A live preview shows the sheet before you save it.',
        features: [
            'Copies per sheet (1 to 200) with the best rows and columns picked automatically',
            'Custom grid of rows and columns, or a fixed photo size with presets such as 35 × 45 mm, 2 × 2 in and 4 × 6 in',
            'A3, A4, A5, A6, Letter, Legal, photo paper or a custom page size, in millimetres, centimetres or inches',
            'Margin, gap, fit (whole image, crop to fill or stretch), rotation, background color and solid or dashed cut lines',
            'Save as PDF with every sheet, or as PNG or JPG of the first sheet, at 150 to 600 DPI',
        ],
        bestFor: 'Printing passport or ID photo sheets, labels, stickers, stamps or several copies of a document page on a single piece of paper.',
        limits: 'Only a PDF with exactly one page is accepted; use Split PDF to extract a page first. A PDF page is drawn as a picture, so very small images enlarged on the sheet can look blurry, and the tool shows the effective print resolution. PNG and JPG save the first sheet only. Print at Actual size or 100% so the copies keep their exact size.',
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
    {
        name: 'PDF to Word', href: '/pdf-to-word', icon: FileOutput, bg: 'bg-sky-50', fg: 'text-sky-600',
        tagline: 'Convert a PDF to an editable Word document.',
        description: 'Create a .docx file you can open in Microsoft Word. Three modes cover different PDFs: Editable text for PDFs with selectable text, Scanned PDF (OCR) for scans, and Page images when the exact look matters more than editing.',
        features: [
            'Editable text mode rebuilds headings, paragraphs, bullets, bordered tables and images',
            'Right-to-left text such as Arabic, Hebrew and Urdu is read in the correct direction',
            'OCR mode reads scanned pages in about forty languages, including Arabic, Tamil, Hindi and Chinese',
            'Page images mode keeps the exact look of every page in any language',
            'Choose pages, page breaks, fonts, and whether to detect headings, tables and images',
        ],
        bestFor: 'Reusing the text of a report or letter, extracting text from a scanned document, or moving a PDF table into Word to continue working on it.',
        limits: 'A PDF stores where each line is drawn, not the paragraphs, so the Word file approximates the original. Tables without borders, merged cells, multi-column layouts, text colors and drawings are not recreated. PDFs that use older font encodings (for example some Tamil fonts) store text as Latin letters, so use OCR or Page images for those.',
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
        id: 'how-to-compress-pdf', title: 'How to make a PDF smaller', href: '/compress-pdf',
        intro: 'Use this when a PDF is slightly too large for an email attachment or an upload form.',
        steps: [
            'Open the Compress PDF tool and choose your file.',
            'Start the optimization and wait for the progress window to finish.',
            'Compare the size of the downloaded file with the original.',
            'If the file is still too large, remove pages you do not need with Split PDF, or follow the image-based option in the tips.',
        ],
        tips: [
            'The tool does not recompress images, so photo-heavy PDFs may barely change.',
            'For a much smaller file, export pages with PDF to JPG at a lower quality and rebuild the PDF with JPG to PDF. Text will then be part of the image and no longer selectable.',
            'Remove unneeded pages first. Fewer pages is the most reliable way to reduce size.',
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
        id: 'how-to-edit-pdf', title: 'How to edit text and annotate a PDF', href: '/edit-pdf',
        intro: 'Use this to correct a detail, add a note, highlight important lines or cover personal information.',
        steps: [
            'Open the Edit PDF tool and choose your file. Use the page strip on the left to move between pages.',
            'To change existing text, choose Edit text and click the line. Type the new wording and click elsewhere when done.',
            'To add something new, choose Add text, Highlight, Whiteout, a shape, Draw or Image and click or drag on the page.',
            'Switch to Select to move or resize what you added. Use Undo and Redo if you change your mind.',
            'Click Save PDF and download the result.',
        ],
        tips: [
            'Editing covers the original line and places new text on top. Check that the new text lines up before saving.',
            'To remove sensitive information for good, cover it with Whiteout and turn on Secure flatten before saving.',
            'Pick the Any language font when typing Arabic, Tamil or other non-Latin text.',
            'Use a small image of your signature on a transparent PNG for the cleanest result.',
        ],
    },
    {
        id: 'how-to-make-photo-sheet', title: 'How to put several copies of an image on one page', href: '/image-sheet',
        intro: 'Use this for passport photos, labels, stickers, or any time you want the same picture repeated on one sheet of paper.',
        steps: [
            'Open the Image Sheet Maker and choose your image, or a PDF that has a single page.',
            'Choose a layout. Copies per sheet repeats the image a set number of times, Custom grid uses rows and columns you choose, and Fixed photo size fits as many photos of an exact size as the page allows.',
            'Set the paper size, margin, gap, fit and cut lines. The preview updates as you change each option.',
            'Check the print resolution message under the preview. It should say good for printing.',
            'Choose PDF, PNG or JPG, then click Create and download your sheet.',
        ],
        tips: [
            'For a passport photo sheet, upload a photo that is already cropped to the correct proportions, then pick the matching size preset.',
            'Keep a small gap and turn on cut lines to make cutting easier.',
            'Print at Actual size or 100% in your print dialog. Fit to page changes the real size of each copy.',
            'Use Whole image to avoid cropping, or Fill the box if you want every box completely filled.',
            'A multi-page PDF is not accepted. Use Split PDF to extract the page you need first.',
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
    {
        id: 'how-to-convert-pdf-to-word', title: 'How to convert a PDF to Word', href: '/pdf-to-word',
        intro: 'Use this when you want to keep working on a PDF’s content in Microsoft Word.',
        steps: [
            'Open the PDF to Word tool and choose your PDF. The tool tells you if the file looks scanned.',
            'Choose a mode: Editable text for PDFs where you can select the text, Scanned PDF (OCR) for scans, or Page images for an exact look.',
            'For OCR, choose the language of the text. Tick the English option if the page mixes languages.',
            'Select the pages you need, and set options such as headings, tables, images and page breaks.',
            'Click Convert to Word, wait for 100% and download the .docx file.',
        ],
        tips: [
            'Try the first two or three pages before converting a long document, to check the result.',
            'If Tamil or other text appears as strange Latin letters, the PDF uses an older font encoding. Use OCR with the matching language instead.',
            'Choose Page images when the layout matters more than editing the text.',
            'Open the result in Word and use the Show/Hide paragraph marks button to check headings and line breaks.',
        ],
    },
];


export const USE_CASES: UseCase[] = [
    { icon: GraduationCap, title: 'Students', text: 'Combine lecture notes, remove cover pages from downloaded papers, number a thesis, highlight key passages, and turn photographed handwritten pages into a single PDF for submission.' },
    { icon: Briefcase, title: 'Freelancers and small businesses', text: 'Merge quotations and terms into one proposal, add your logo as a watermark, correct a date or amount with the editor, and send a single tidy file rather than a folder of attachments.' },
    { icon: Receipt, title: 'Accounting and invoicing', text: 'Join the month’s invoices, add page numbers to a statement, move a bordered table into Word, and extract just the pages a client needs without exposing the rest of the file.' },
    { icon: Scale, title: 'Legal and compliance', text: 'Number bundles consistently, mark documents as CONFIDENTIAL or DRAFT, cover personal details before sharing, and keep sensitive files on your own device while you work on them.' },
    { icon: Camera, title: 'Photographers, crafters and designers', text: 'Export PDF pages as high-resolution PNG or JPG, lay out passport photos, labels or stickers on a printable sheet, and assemble image sets into a presentation-ready PDF.' },
    { icon: Users, title: 'Teachers and offices', text: 'Split a scanned stack into one file per student, fix sideways scans in seconds, turn a scanned worksheet into editable Word text, and prepare handouts for printing.' },
];


export const LIMITS: Limit[] = [
    { area: 'Merge, split, rotate, watermark and page numbers', text: 'These tools copy your original pages into a new file, so text stays selectable and images keep their quality. They cannot open password-protected files.' },
    { area: 'Compress PDF', text: 'It optimizes the file structure and does not recompress images. Files built mostly from photos or scans may stay almost the same size.' },
    { area: 'Edit PDF', text: 'Existing text is edited one line at a time by covering the original and placing new text on top. The original text remains inside the file unless you save with Secure flatten, which converts pages to images. Edit text is not available on rotated pages.' },
    { area: 'Image Sheet Maker', text: 'It accepts an image or a PDF with exactly one page. A PDF page is drawn as a picture, so enlarging a small image can look blurry; the tool shows the effective print resolution. PNG and JPG downloads contain the first sheet only. HEIC photos are not supported by most browsers, so convert them to JPG or PNG first.' },
    { area: 'Text in other scripts when editing or stamping', text: 'Standard PDF fonts cover Latin characters. In Edit PDF, text in other scripts is saved as a sharp image so it displays correctly, which means that text is not selectable. The watermark tool uses standard fonts only, so use its image option for other scripts.' },
    { area: 'PDF to Word', text: 'The result is an approximation. Headings, paragraphs, bullets, bordered tables and images are rebuilt. Tables without borders, merged cells, multi-column layouts, text colors, shading and drawings are not recreated.' },
    { area: 'Older font encodings', text: 'Some PDFs, including many older Tamil and Devanagari documents, store text as Latin letters that only look correct in a special font. No converter can recover the real text from the file itself, so use OCR or Page images for these.' },
    { area: 'OCR', text: 'OCR reads the picture of a page, so accuracy depends on scan quality, resolution and the language you choose. Handwriting, very small print and decorative scripts are the hardest. The first run downloads the language data for the chosen language.' },
    { area: 'Large files', text: 'All work happens in your device’s memory. Very large PDFs, or conversions that render every page, are slower and can fail on phones. Work with fewer pages at a time if you see problems.' },
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
        { label: 'Editing text inside a PDF', values: ['Line by line, with a standard replacement font', 'Varies by provider', 'Most complete, including paragraph reflow'] },
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
    { problem: 'Word shows strange Latin letters instead of Tamil or another script', fix: 'The PDF probably uses an older font encoding that stores the text as Latin letters. Convert with Scanned PDF (OCR) and the matching language, or use Page images mode to keep the look.' },
    { problem: 'The Word file is missing a table or the columns are mixed together', fix: 'Only tables with drawn borders are detected, and multi-column pages are read line by line. Use Page images mode for those pages, or copy the table from the PDF viewer.' },
    { problem: 'OCR is slow or fails to start the first time', fix: 'The first run downloads the language data, which needs an internet connection and a little time. Try again with fewer pages, check your connection, and make sure you chose the right language.' },
    { problem: 'Edited text looks slightly different from the original', fix: 'Replacement text uses a standard font. Adjust the size, color and bold or italic in the options bar, or choose another font family to get closer.' },
    { problem: 'I covered text in Edit PDF but it can still be selected in another viewer', fix: 'Covering hides text visually but keeps it in the file. Save again with Secure flatten turned on to remove it permanently.' },
    { problem: 'Image Sheet Maker says my PDF has several pages', fix: 'Only a PDF with a single page is accepted. Open Split PDF, extract the page you need, and upload that file instead.' },
    { problem: 'The printed copies are smaller or larger than expected', fix: 'Your print dialog is probably scaling the page. Choose Actual size or 100% instead of Fit to page, and check that the paper size in the dialog matches the sheet.' },
    { problem: 'My printed photos look blurry', fix: 'The image has too few pixels for the size you chose. The Image Sheet Maker shows the print resolution; below about 150 DPI, use a larger original or fewer, smaller copies.' },
];


export const PRIVACY_POINTS: string[] = [
    'The files you choose are read by your browser using standard web features and are held in memory only while you work.',
    'Processing is done by JavaScript libraries that run on your device. The result is created as a temporary file inside your browser and offered to you as a download.',
    'The OCR option in PDF to Word downloads language data the first time you use a language. Your PDF itself is never sent anywhere.',
    'Closing the tab or choosing “Start over” discards the working data.',
    'Like most free websites, this site can load advertising and analytics scripts. Those scripts run separately from the PDF tools and do not receive the contents of your files. See the Privacy Policy for what is collected and why.',
];


export const SUPPORTED: { tool: string; input: string; output: string }[] = [
    { tool: 'Merge PDF', input: 'PDF', output: 'PDF' },
    { tool: 'Split PDF', input: 'PDF', output: 'PDF, or ZIP of PDFs' },
    { tool: 'Rotate PDF', input: 'PDF', output: 'PDF' },
    { tool: 'Compress PDF', input: 'PDF', output: 'PDF' },
    { tool: 'Add Watermark', input: 'PDF, plus PNG or JPG for logos', output: 'PDF' },
    { tool: 'Add Page Numbers', input: 'PDF', output: 'PDF' },
    { tool: 'Edit PDF', input: 'PDF, plus any common image for insertion', output: 'PDF' },
    { tool: 'Image Sheet Maker', input: 'One image, or a PDF with a single page', output: 'PDF, or PNG or JPG of the first sheet' },
    { tool: 'JPG to PDF', input: 'JPG, PNG, WebP, GIF, BMP, AVIF', output: 'PDF' },
    { tool: 'PDF to JPG', input: 'PDF', output: 'JPG, PNG or WebP, or ZIP of images' },
    { tool: 'PDF to Word', input: 'PDF (text-based or scanned)', output: 'Word document (.docx)' },
];


export const FAQS: Faq[] = [
    { q: 'Are my uploaded files stored anywhere?', a: 'No. Nothing is uploaded for processing. Your files are opened and edited inside your own browser, and the finished file is created on your device. We do not receive, view or keep copies of your documents.' },
    { q: 'How can I check that my files really stay on my device?', a: 'Open your browser’s developer tools (press F12), go to the Network tab, and then run any tool. You will see that no request carries your file to a server. The only extra download you may see is OCR language data the first time you use that feature.' },
    { q: 'What file formats are supported?', a: 'PDF is supported by every PDF tool. Images in JPG, PNG, WebP, GIF, BMP and AVIF can be turned into a PDF or placed on a sheet, and PDF pages can be saved as JPG, PNG or WebP. PDF to Word creates .docx files. Logos for watermarks can be PNG or JPG.' },
    { q: 'Is mypdf.site completely free?', a: 'Yes. The tools are free to use, with no sign-up and no limits set by us. The site is supported by advertising and optional donations.' },
    { q: 'Is there a file size limit?', a: 'We do not set one. The practical limit is your device’s memory. Desktop computers usually handle PDFs of several hundred pages, while phones are more comfortable with smaller files. Exporting images from PDF is capped at around 25 megapixels per page to avoid crashes.' },
    { q: 'Can I use it on my mobile phone?', a: 'Yes. The site is responsive and designed for touch. For very large files, a computer will be faster and more reliable.' },
    { q: 'Will merging or splitting reduce the quality of my pages?', a: 'No. Merge, split, rotate, watermark and page-number tools copy your original pages into the new file without re-rendering them, so text stays selectable and images keep their original quality.' },
    { q: 'Why is the text in my new PDF still selectable?', a: 'Because the pages are copied, not turned into pictures. Only PDF to JPG, Page images mode in PDF to Word, Image Sheet Maker, and Secure flatten in Edit PDF deliberately turn pages into images.' },
    { q: 'Can I merge only some pages from each file?', a: 'Yes. In the Merge tool, type a range such as 1-3, 5 for a file, or open the file and click the thumbnails of the pages you want.' },
    { q: 'Can I reorder files before merging?', a: 'Yes. Drag files by their handle, use the up and down arrows, or sort them by name.' },
    { q: 'Does it work with password-protected PDFs?', a: 'Files that need a password to open are not supported. Remove the password in the program that created the file, then try again.' },
    { q: 'How do I print several copies of one photo on a single page?', a: 'Open Image Sheet Maker, upload the image, choose Copies per sheet, pick a number such as 4 or 8, keep the page on A4, and save the PDF. Print it at Actual size or 100%.' },
    { q: 'Can I make a passport photo sheet?', a: 'Yes. Choose Fixed photo size, pick a preset such as 35 × 45 mm or 2 × 2 in, and the tool fits as many photos as the page allows. Use a photo that is already cropped to the right proportions, and check the requirements of the office that will receive it.' },
    { q: 'Can I upload a PDF to the Image Sheet Maker?', a: 'Yes, but only a PDF with a single page. The page is drawn as a sharp picture and repeated on the sheet. For a longer PDF, use Split PDF to extract the page you need first.' },
    { q: 'Can I change the existing text in a PDF?', a: 'Yes, with Edit PDF. Click a line, type the new text, and the original is covered and replaced. It works one line at a time and uses a standard replacement font, so it suits corrections such as dates, names and typos rather than rewriting whole pages.' },
    { q: 'Is the original text really removed when I edit or cover it?', a: 'Not by default. Covering hides the original but it stays inside the file. To remove it permanently, turn on Secure flatten when saving. The saved PDF then consists of page images, so its text can no longer be selected.' },
    { q: 'Will the Word file look exactly like my PDF?', a: 'Not always. PDF to Word rebuilds headings, paragraphs, bullets, bordered tables and images, but tables without borders, merged cells, multi-column layouts and text colors are not recreated. Page images mode keeps the exact look but the text is not editable.' },
    { q: 'Can I convert a scanned PDF to editable text?', a: 'Yes. Choose Scanned PDF (OCR) in PDF to Word and pick the language of the text. Accuracy depends on scan quality, and the first use of a language downloads its language data.' },
    { q: 'Does it support Arabic, Tamil, Hindi, Chinese and other languages?', a: 'Yes, with some conditions. Text-based PDFs in Unicode fonts convert as text, right-to-left scripts keep their direction, and OCR supports about forty languages. PDFs that use older font encodings need OCR or Page images, because the real text is not stored in the file.' },
    { q: 'Why does my converted Tamil text look like random English letters?', a: 'Many older documents use fonts that store Tamil as Latin letters and only look correct in that font. The letters in the file are not Tamil characters, so a converter cannot recover them. Use OCR with Tamil selected, or keep the exact look with Page images.' },
    { q: 'Can I add a watermark in a language other than English?', a: 'Text watermarks use the standard PDF fonts, which cover Latin characters. For other scripts, make the text as a PNG image and use the image watermark option.' },
    { q: 'How much smaller will Compress PDF make my file?', a: 'It depends on the file. The tool optimizes the PDF structure and does not recompress images, so files with extra internal overhead shrink the most while photo-heavy files may change very little.' },
    { q: 'What is DPI and which setting should I choose for PDF to JPG?', a: 'DPI means dots per inch and controls how detailed the exported image is. 72–100 DPI is enough for small previews, 150 DPI suits screens and sharing, and 300 DPI suits printing.' },
    { q: 'Which is better for PDF to image: JPG, PNG or WebP?', a: 'Use PNG for pages with sharp text and line art because it is lossless. Use JPG or WebP for pages full of photographs, where smaller files matter more than perfect edges.' },
    { q: 'Does the site work offline?', a: 'After the page has fully loaded, most tools can keep working without a connection because processing happens locally. OCR needs a connection the first time you use a language. You need to be online to load the site in the first place.' },
    { q: 'Which browsers are supported?', a: 'Recent versions of Chrome, Edge, Firefox and Safari. Older browsers may not support all the features the tools rely on.' },
    { q: 'I found a problem or want a new tool. What should I do?', a: 'Please use the Contact page or the feedback page and describe what happened, including your browser and device. Reports like this are how the tools improve.' },
    { q: 'How can I support the project?', a: 'Use the Support Project page. Sharing the site with people who need it also helps.' },
];


export const GLOSSARY: Term[] = [
    { term: 'PDF', def: 'Portable Document Format. A file type designed to look the same on every device, whatever software opened it.' },
    { term: 'Page range', def: 'A way to name pages. “1-3, 5” means pages 1, 2, 3 and 5.' },
    { term: 'DPI', def: 'Dots per inch. A higher number gives a sharper image and a bigger file.' },
    { term: 'Effective resolution', def: 'How many pixels of the picture land in each inch of paper at the size you chose. Around 300 is sharp, and below about 150 print starts to look soft.' },
    { term: 'Rasterize', def: 'To turn a page into a picture made of pixels, as the PDF to JPG tool does.' },
    { term: 'Thumbnail', def: 'A small preview image of a page, used to choose pages quickly.' },
    { term: 'Opacity', def: 'How solid something looks. 100% is fully solid and lower values show the page underneath.' },
    { term: 'Tile', def: 'A pattern in which a watermark repeats across the page.' },
    { term: 'Cut lines', def: 'Thin outlines drawn around each copy on a printed sheet so it is easy to cut along them.' },
    { term: 'Fit (contain, cover, stretch)', def: 'How a picture fills its box. Contain shows the whole picture, cover fills the box and crops the edges, and stretch fills the box by changing the proportions.' },
    { term: 'ZIP file', def: 'A single archive that holds several files, used when a tool creates more than one output.' },
    { term: 'Client-side processing', def: 'Work done inside your own browser or device instead of on a remote server.' },
    { term: 'Metadata', def: 'Hidden information stored inside a PDF, such as its title and author.' },
    { term: 'Roman numerals', def: 'Numbering such as i, ii, iii, often used for the front pages of books and reports.' },
    { term: 'Encryption', def: 'Protection that locks a PDF with a password so only people who know it can open the file.' },
    { term: 'OCR', def: 'Optical character recognition. Software that reads the letters in a picture of a page and turns them into text you can edit.' },
    { term: 'Unicode', def: 'The worldwide standard that gives every letter in every script its own code, so text in Arabic, Tamil or Chinese can be shared between programs.' },
    { term: 'Legacy font encoding', def: 'An older way of storing non-Latin text as Latin letters that only look right in a special font. The file does not contain the real characters.' },
    { term: 'Right-to-left (RTL)', def: 'Scripts such as Arabic, Hebrew and Urdu that are read from right to left.' },
    { term: 'Annotation', def: 'Something added on top of a page, such as a highlight, note, shape or drawing, without rewriting the page itself.' },
    { term: 'Whiteout', def: 'A filled box placed over part of a page to hide what is underneath. On its own it hides content visually without deleting it.' },
    { term: 'Flatten', def: 'To merge everything on a page into a single picture. Flattening makes covered content impossible to recover but also removes selectable text.' },
    { term: 'DOCX', def: 'The file format used by modern versions of Microsoft Word.' },
];


export const TOC: { id: string; label: string }[] = [
    { id: 'why', label: 'Why use it' },
    { id: 'overview', label: 'Tools at a glance' },
    { id: 'choose', label: 'Which tool?' },
    { id: 'tools', label: 'Tool details' },
    { id: 'how-it-works', label: 'How it works' },
    { id: 'guides', label: 'Step-by-step guides' },
    { id: 'use-cases', label: 'Who uses it' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'limits', label: 'Limits' },
    { id: 'comparison', label: 'Comparison' },
    { id: 'troubleshooting', label: 'Troubleshooting' },
    { id: 'faq', label: 'FAQ' },
    { id: 'glossary', label: 'Glossary' },
];


export { ShieldCheck, Zap, Cpu };
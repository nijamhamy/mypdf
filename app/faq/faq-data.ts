export type CategoryId = 'general' | 'tools' | 'convert' | 'files' | 'privacy' | 'trouble' | 'support';


export interface FaqItem {
    id: string;
    category: CategoryId;
    question: string;
    answer: string;
}


export const CATEGORIES: { id: CategoryId; label: string; description: string }[] = [
    { id: 'general', label: 'General', description: 'What the site offers and how it works.' },
    { id: 'tools', label: 'Using the tools', description: 'Merge, split, rotate, watermark, page numbers and image conversion.' },
    { id: 'convert', label: 'Convert & edit', description: 'PDF to Word, OCR for scans, editing text, compressing and flattening.' },
    { id: 'files', label: 'Files & limits', description: 'File sizes, quality, languages, passwords and offline use.' },
    { id: 'privacy', label: 'Privacy & security', description: 'How your documents are handled and how to check it yourself.' },
    { id: 'trouble', label: 'Troubleshooting', description: 'Fixes for the most common problems.' },
    { id: 'support', label: 'Support & site', description: 'Feedback, donations and how the site is funded.' },
];


export const FAQ_ITEMS: FaqItem[] = [
    {
        id: 'is-it-free', category: 'general',
        question: 'Is mypdf.site completely free to use?',
        answer: 'Yes. The tools are free to use, with no sign-up and no usage limits set by us. The site is supported by advertising and optional donations.',
    },
    {
        id: 'what-can-i-do', category: 'general',
        question: 'What can I do with mypdf.site?',
        answer: 'You can merge PDFs, split or extract pages, rotate and delete pages, compress a PDF, add text or image watermarks, add page numbers, edit text and annotate a PDF, convert images to a PDF, convert PDF pages to JPG, PNG or WebP images, and convert a PDF to an editable Word document, with OCR for scanned files.',
    },
    {
        id: 'which-tool', category: 'general',
        question: 'Which tool should I use for my task?',
        answer: 'To combine files use Merge PDF. To remove or pull out pages use Split PDF. To fix sideways pages use Rotate PDF. To make a file smaller use Compress PDF. To label or brand pages use Add Watermark. To number pages use Add Page Numbers. To fix a typo, highlight or sign use Edit PDF. To work on a PDF in Word use PDF to Word. The Features page has a table that matches goals to tools.',
    },
    {
        id: 'install', category: 'general',
        question: 'Do I need to install any software or plugins?',
        answer: 'No. The tools run in a modern web browser such as Chrome, Edge, Firefox or Safari on a computer, tablet or phone. There is nothing to download or install.',
    },
    {
        id: 'account', category: 'general',
        question: 'Do I need to create an account?',
        answer: 'No. You can open any tool and start working straight away. There is no login, and your files are not linked to any profile.',
    },
    {
        id: 'browsers', category: 'general',
        question: 'Which browsers are supported?',
        answer: 'Recent versions of Chrome, Edge, Firefox and Safari. Older browsers may be missing features that the tools rely on, so update your browser if something does not work.',
    },
    {
        id: 'mobile', category: 'general',
        question: 'Can I use mypdf.site on my mobile phone?',
        answer: 'Yes. The site is responsive and works with touch. Phones have less memory than computers, so very large PDFs, OCR and PDF to Word conversions are easier to handle on a computer.',
    },


    {
        id: 'merge-how', category: 'tools',
        question: 'How do I merge multiple PDF files?',
        answer: 'Open Merge PDF, select your files, and arrange them by dragging or with the arrow buttons. Optionally type a page range or pick pages from thumbnails for each file, choose the output name, and click the merge button. A progress window appears and a Download button shows when it reaches 100%.',
    },
    {
        id: 'merge-order', category: 'tools',
        question: 'Can I merge only some pages of each file?',
        answer: 'Yes. For each file you can type a range such as 1-3, 5, or open the file and click the thumbnails of the pages you want. Pages you leave out are not copied into the merged file.',
    },
    {
        id: 'split-modes', category: 'tools',
        question: 'What are the different ways to split a PDF?',
        answer: 'There are four modes. Extract pages creates one PDF from the pages you choose. Delete pages removes the pages you choose and keeps the rest. Split by ranges creates one PDF for each range you type. Split every N pages cuts the document into equal parts. Several results are delivered together as a ZIP file.',
    },
    {
        id: 'rotate-some', category: 'tools',
        question: 'Can I rotate just one page instead of the whole document?',
        answer: 'Yes. Every page has its own rotate buttons, and there are bulk buttons for all, odd, even or selected pages. The thumbnail turns immediately so you can see the result before saving.',
    },
    {
        id: 'watermark-options', category: 'tools',
        question: 'What can I do with the watermark tool?',
        answer: 'You can add a text or image watermark, change its size, opacity and rotation, place it on a 3×3 grid or repeat it across the page, and apply it to all, odd, even or specific pages. Text can include {page}, {total} and {date}, which are replaced on each page.',
    },
    {
        id: 'page-number-styles', category: 'tools',
        question: 'What page number styles are available?',
        answer: 'You can use 1 2 3, i ii iii, I II III, a b c or A B C, in formats such as Page 1 of N, 1 / N or - 1 -, or write your own template. You can also choose the start number, number only a range of pages, skip the cover page and mirror the position on even pages.',
    },
    {
        id: 'jpg-to-pdf-formats', category: 'tools',
        question: 'Which image types can I turn into a PDF?',
        answer: 'JPG, PNG, WebP, GIF, BMP and AVIF. You can reorder and rotate images, then choose the page size, orientation, margin and quality.',
    },
    {
        id: 'pdf-to-jpg-dpi', category: 'tools',
        question: 'Which DPI should I choose when converting PDF to images?',
        answer: 'Use 72–100 DPI for small previews, 150 DPI for screens and sharing, and 300 DPI for printing. Higher values create larger and sharper images. The tool shows the final pixel size before you convert.',
    },
    {
        id: 'jpg-png-webp', category: 'tools',
        question: 'Should I choose JPG, PNG or WebP?',
        answer: 'Choose PNG for pages with sharp text and line art because it is lossless. Choose JPG or WebP for pages that are mostly photographs, where a smaller file matters more than perfect edges.',
    },


    {
        id: 'word-how', category: 'convert',
        question: 'How do I convert a PDF to a Word document?',
        answer: 'Open PDF to Word and choose your file. Pick Editable text for PDFs with selectable text, Scanned PDF (OCR) for scans, or Page images for an exact look. Select the pages and options, click Convert to Word, and download the .docx file when the progress window reaches 100%.',
    },
    {
        id: 'word-modes', category: 'convert',
        question: 'What is the difference between the three PDF to Word modes?',
        answer: 'Editable text reads the text already stored in the PDF and rebuilds headings, paragraphs, bullets, bordered tables and images. Scanned PDF (OCR) reads the letters from a picture of each page, so it also works on scans. Page images puts each page into Word as a picture, so the look is exact but the text cannot be edited.',
    },
    {
        id: 'word-exact', category: 'convert',
        question: 'Will the Word file look exactly like my PDF?',
        answer: 'Not always. A PDF stores where each line is drawn, not the paragraphs, so the conversion is an approximation. Tables without borders, merged cells, multi-column layouts, text colors and drawings are not recreated. Use Page images mode when the exact look matters more than editing.',
    },
    {
        id: 'word-tables-images', category: 'convert',
        question: 'Does PDF to Word keep tables and images?',
        answer: 'Tables drawn with border lines are detected and rebuilt as real Word tables, and images are cropped from the page and placed in the document. Tables without borders are treated as normal text with gaps, and images inside table cells are skipped. You can turn table and image detection off in the options.',
    },
    {
        id: 'ocr-what', category: 'convert',
        question: 'What is OCR and when do I need it?',
        answer: 'OCR means optical character recognition. It reads the letters in a picture of a page and turns them into text. You need it when a PDF is a scan or a photo, so you cannot select the text, or when the text in the file is stored in an older font encoding that does not contain real characters.',
    },
    {
        id: 'ocr-languages', category: 'convert',
        question: 'Which languages does OCR support?',
        answer: 'About forty, including English, Arabic, Persian, Urdu, Hebrew, Tamil, Hindi, Bengali, Telugu, Kannada, Malayalam, Thai, Chinese (Simplified and Traditional), Japanese, Korean, Russian, Greek, Turkish and many European languages. Choose the language of the text, and tick the English option if the page mixes languages.',
    },
    {
        id: 'ocr-download', category: 'convert',
        question: 'Why does OCR need to download data the first time?',
        answer: 'The recognition engine needs a language file for each language. It is downloaded once when you first use that language, so you need an internet connection at that point. Your PDF is not uploaded; only the language data is downloaded.',
    },
    {
        id: 'word-rtl', category: 'convert',
        question: 'Does PDF to Word work with Arabic, Hebrew and Urdu?',
        answer: 'Yes, for PDFs that store real Unicode text. Right-to-left lines are read in the correct direction and marked as right-to-left in Word, and accent marks are reattached to their letters. PDFs that use special Quran or calligraphy fonts, or older encodings, may still need OCR or Page images.',
    },
    {
        id: 'word-legacy', category: 'convert',
        question: 'Why does my converted Tamil or Hindi text look like random English letters?',
        answer: 'Many older documents use fonts that store Tamil, Hindi and other scripts as Latin letters, and only look correct while that font is used. The file does not contain the real characters, so no converter can recover them. Convert with Scanned PDF (OCR) and the matching language, or use Page images to keep the look.',
    },
    {
        id: 'edit-how', category: 'convert',
        question: 'How do I edit the text in a PDF?',
        answer: 'Open Edit PDF and choose Edit text. Click a line, change the wording, and click elsewhere. The original line is covered with a box that matches the page color, and the new text is placed on top with a similar size and color. You can also use Add text to place new text anywhere, then click Save PDF.',
    },
    {
        id: 'edit-limits', category: 'convert',
        question: 'What are the limits of editing text in a PDF?',
        answer: 'Editing works one line at a time and cannot reflow a whole paragraph. The replacement text uses a standard font, so it may look slightly different from the original. Edit text is not available on rotated pages, but Add text and the drawing tools still are.',
    },
    {
        id: 'edit-remove-original', category: 'convert',
        question: 'Is the original text really removed when I edit or cover it?',
        answer: 'Not by default. Covering hides the original visually, but the text stays inside the file and could be copied by someone who knows how. To remove it permanently, turn on Secure flatten before saving. The saved PDF then consists of page images.',
    },
    {
        id: 'flatten-what', category: 'convert',
        question: 'What does Secure flatten do?',
        answer: 'Flattening renders every page, including your edits, into a single picture and builds a new PDF from those pictures. Covered text can no longer be recovered, but the text in the saved file also can no longer be selected, searched or copied, and the file may be larger.',
    },
    {
        id: 'edit-languages', category: 'convert',
        question: 'Can I add Arabic, Tamil or other languages in Edit PDF?',
        answer: 'Yes. Choose the Any language font and type your text. Latin text is saved as real PDF text, while text in other scripts is saved as a sharp image so it displays correctly everywhere. That means non-Latin text you add is not selectable.',
    },
    {
        id: 'edit-signature', category: 'convert',
        question: 'Can I add my signature to a PDF?',
        answer: 'Yes. Use the Image button to insert a picture of your signature, ideally a transparent PNG, then move and resize it on the page. You can also sign with the Draw tool using a mouse, trackpad or finger.',
    },
    {
        id: 'edit-undo', category: 'convert',
        question: 'Can I undo changes in Edit PDF?',
        answer: 'Yes. Use the Undo and Redo buttons, or Ctrl+Z and Ctrl+Y (Cmd on a Mac). Select an item and press Delete to remove it, and drag it or its corner handle to move or resize it.',
    },
    {
        id: 'compress-how', category: 'convert',
        question: 'How does Compress PDF work, and how much smaller will my file get?',
        answer: 'It re-saves the PDF with an optimized internal structure. It does not recompress images, so pages look the same, but the saving depends on the file. Files with extra internal overhead shrink the most, while PDFs full of large photos or scans may change very little.',
    },
    {
        id: 'compress-more', category: 'convert',
        question: 'What can I do if the file is still too large?',
        answer: 'First remove pages you do not need with Split PDF. If you can accept that text becomes part of a picture, export the pages with PDF to JPG at a lower quality and rebuild the PDF with JPG to PDF using a smaller quality preset.',
    },


    {
        id: 'file-size', category: 'files',
        question: 'What is the maximum file size?',
        answer: 'We do not set a fixed limit. The practical limit is your device’s memory. Computers usually manage large documents, while phones are more comfortable with smaller ones. If a very large file is slow, work on fewer pages at a time.',
    },
    {
        id: 'quality-loss', category: 'files',
        question: 'Will my pages lose quality?',
        answer: 'Merge, split, rotate, watermark and page-number tools copy your original pages into the new file without re-rendering them, so text stays sharp and selectable. PDF to JPG, Page images mode in PDF to Word and Secure flatten in Edit PDF deliberately turn pages into images, and JPG to PDF may recompress images if you choose a lower quality setting.',
    },
    {
        id: 'password', category: 'files',
        question: 'Can I use password-protected PDFs?',
        answer: 'Files that require a password to open are not supported. Remove the password in the program that created the file, then try again.',
    },
    {
        id: 'languages', category: 'files',
        question: 'Can I add text in languages other than English?',
        answer: 'In Edit PDF, yes: choose the Any language font and the text is saved as a sharp image. Text watermarks and page numbers use the standard fonts built into the PDF format, which cover Latin characters, so for other scripts create the text as a PNG image and use the image watermark option.',
    },
    {
        id: 'offline', category: 'files',
        question: 'Does it work offline?',
        answer: 'After a page has loaded completely, most tools can keep working without a connection because the processing happens locally. OCR needs a connection the first time you use a language, and you need to be online to open the site in the first place.',
    },
    {
        id: 'zip', category: 'files',
        question: 'Why did I get a ZIP file?',
        answer: 'When a tool creates more than one file, for example splitting a PDF into several parts or converting several pages to images, the results are packed into one ZIP so you can download them in a single step.',
    },
    {
        id: 'docx-format', category: 'files',
        question: 'Which programs can open the Word file?',
        answer: 'The file is a standard .docx document. It opens in Microsoft Word and in other programs that support the format, such as LibreOffice Writer and Google Docs, though fonts and spacing can differ slightly between programs.',
    },


    {
        id: 'files-uploaded', category: 'privacy',
        question: 'Are my documents uploaded to a server?',
        answer: 'No. The tools process your files inside your own browser. The file is read into your device’s memory, changed there, and the result is saved back to your device. It is not sent to our servers.',
    },
    {
        id: 'verify-privacy', category: 'privacy',
        question: 'How can I check that my files stay on my device?',
        answer: 'Open your browser’s developer tools with F12, go to the Network tab, and then run a tool. You will not see your file being sent anywhere. The only extra download you may see is OCR language data the first time you use that feature.',
    },
    {
        id: 'stored', category: 'privacy',
        question: 'Do you keep copies of my files?',
        answer: 'No. We never receive your files, so there is nothing for us to store, read or share. The temporary working data lives in your browser and is discarded when you close the tab or start over.',
    },
    {
        id: 'ads-privacy', category: 'privacy',
        question: 'Do the ads or analytics see my documents?',
        answer: 'No. Advertising and analytics scripts run separately from the PDF tools and do not receive the contents of your files. They may use cookies to show ads or measure traffic, which is explained in the Privacy Policy.',
    },
    {
        id: 'sensitive', category: 'privacy',
        question: 'Is it safe to use for contracts, ID cards or bank statements?',
        answer: 'Because the files are processed on your own device and are not uploaded for processing, browser-based tools avoid the main risk of upload sites. As with any sensitive work, use a trusted device and browser and close the tab when you finish.',
    },
    {
        id: 'redact-safely', category: 'privacy',
        question: 'How do I remove personal details from a PDF before sharing it?',
        answer: 'Open Edit PDF, cover each detail with the Whiteout tool, check every page, and turn on Secure flatten before saving. Then try selecting text where the details were in another PDF viewer to confirm nothing remains. Also check for details in other places such as headers, footers and the file name.',
    },


    {
        id: 'not-opening', category: 'trouble',
        question: 'My PDF will not open in a tool. What should I do?',
        answer: 'The file may be password protected or damaged. Remove the password, or open the file in a PDF viewer and save a fresh copy, then try again.',
    },
    {
        id: 'slow', category: 'trouble',
        question: 'The page is slow or the browser tab crashes. How can I fix it?',
        answer: 'Close other tabs, work with fewer pages, lower the DPI when exporting images, and try on a computer instead of a phone. Large files, OCR and high resolutions need a lot of memory.',
    },
    {
        id: 'thumbnails', category: 'trouble',
        question: 'The page thumbnails keep saying “Loading”.',
        answer: 'Thumbnails are drawn one after another, so long documents take longer. The tools still work before all previews appear. If nothing loads, refresh the page and choose the file again.',
    },
    {
        id: 'no-download', category: 'trouble',
        question: 'I clicked Download but nothing happened.',
        answer: 'Check your browser’s downloads list and make sure downloads or pop-ups are not blocked for this site. On some phones the file is saved in the Downloads folder without opening.',
    },
    {
        id: 'missing-letters', category: 'trouble',
        question: 'Some letters are missing from my watermark or page numbers.',
        answer: 'The standard PDF fonts support Latin characters only, so unsupported characters are skipped. Use an image watermark for other writing systems.',
    },
    {
        id: 'word-missing-table', category: 'trouble',
        question: 'My Word file is missing a table or the columns are mixed together.',
        answer: 'Only tables with drawn borders are detected, and pages with several columns are read line by line across the page. Use Page images mode for those pages, or copy the table from a PDF viewer.',
    },
    {
        id: 'ocr-slow', category: 'trouble',
        question: 'OCR is slow, or it does not start the first time.',
        answer: 'The first run downloads the language data, which needs an internet connection and a little time. Try again with fewer pages, check your connection, and make sure you chose the right language. Recognition itself takes longer on large pages and on phones.',
    },
    {
        id: 'edit-text-differs', category: 'trouble',
        question: 'The text I edited looks slightly different from the original.',
        answer: 'Replacement text uses a standard font. Adjust the size, color, bold or italic in the options bar, or try another font family, to get closer to the original. Zooming in helps you line it up before you save.',
    },
    {
        id: 'edit-text-not-appearing', category: 'trouble',
        question: 'I clicked with Add text but I cannot see or type my text.',
        answer: 'Click once on the page where the text should go and wait for the dashed box to appear, then type. Press Escape or click elsewhere when you finish. If the box is empty when you finish, it is removed. Switch to Select to move text you already added.',
    },
    {
        id: 'covered-still-selectable', category: 'trouble',
        question: 'I covered text, but I can still select it in another viewer.',
        answer: 'Covering only hides the text visually. Save again with Secure flatten turned on to remove it from the file permanently.',
    },


    {
        id: 'make-money', category: 'support',
        question: 'How does the site pay for itself?',
        answer: 'Through advertising and optional donations. We do not lock features behind payment, and we do not sell your documents, because we never receive them.',
    },
    {
        id: 'feature-request', category: 'support',
        question: 'Can I suggest a new tool or report a bug?',
        answer: 'Yes. Please use the Contact page or the feedback page and describe what happened, including your browser and device. For conversion problems, mention the language and what the PDF came from. Clear reports help us fix problems faster.',
    },
    {
        id: 'support-project', category: 'support',
        question: 'How can I support the project?',
        answer: 'You can use the Support Project page to make a voluntary contribution. Telling friends and colleagues about the site also helps.',
    },
];
export type CategoryId = 'general' | 'privacy' | 'tools' | 'files' | 'trouble' | 'support';

export interface FaqItem {
    id: string;
    category: CategoryId;
    question: string;
    answer: string;
}

export const CATEGORIES: { id: CategoryId; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'privacy', label: 'Privacy & security' },
    { id: 'tools', label: 'Using the tools' },
    { id: 'files', label: 'Files & limits' },
    { id: 'trouble', label: 'Troubleshooting' },
    { id: 'support', label: 'Support & site' },
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
        answer: 'You can merge PDFs, split or extract pages, rotate and delete pages, add text or image watermarks, add page numbers, convert images to a PDF, and convert PDF pages to JPG, PNG or WebP images.',
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
        answer: 'Yes. The site is responsive and works with touch. Phones have less memory than computers, so very large PDFs are easier to handle on a computer.',
    },

    {
        id: 'files-uploaded', category: 'privacy',
        question: 'Are my documents uploaded to a server?',
        answer: 'No. The tools process your files inside your own browser. The file is read into your device’s memory, changed there, and the result is saved back to your device. It is not sent to our servers.',
    },
    {
        id: 'verify-privacy', category: 'privacy',
        question: 'How can I check that my files stay on my device?',
        answer: 'Open your browser’s developer tools with F12, go to the Network tab, and then run a tool. You will not see your file being sent anywhere. You can also switch off your internet connection after the page has loaded and the tools will keep working.',
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
        id: 'file-size', category: 'files',
        question: 'What is the maximum file size?',
        answer: 'We do not set a fixed limit. The practical limit is your device’s memory. Computers usually manage large documents, while phones are more comfortable with smaller ones. If a very large file is slow, work on fewer pages at a time.',
    },
    {
        id: 'quality-loss', category: 'files',
        question: 'Will my pages lose quality?',
        answer: 'Merge, split, rotate, watermark and page-number tools copy your original pages into the new file without re-rendering them, so text stays sharp and selectable. Only PDF to JPG deliberately turns pages into images, and JPG to PDF may recompress images if you choose a lower quality setting.',
    },
    {
        id: 'password', category: 'files',
        question: 'Can I use password-protected PDFs?',
        answer: 'Files that require a password to open are not supported. Remove the password in the program that created the file, then try again.',
    },
    {
        id: 'languages', category: 'files',
        question: 'Can I add text in languages other than English?',
        answer: 'Text watermarks and page numbers use the standard fonts built into the PDF format, which cover Latin characters. For other scripts, such as Tamil or Arabic, create the text as a PNG image and use the image watermark option.',
    },
    {
        id: 'offline', category: 'files',
        question: 'Does it work offline?',
        answer: 'After a page has loaded completely, the tools can keep working without a connection because the processing happens locally. You need to be online to open the site in the first place.',
    },
    {
        id: 'zip', category: 'files',
        question: 'Why did I get a ZIP file?',
        answer: 'When a tool creates more than one file, for example splitting a PDF into several parts or converting several pages to images, the results are packed into one ZIP so you can download them in a single step.',
    },

    {
        id: 'not-opening', category: 'trouble',
        question: 'My PDF will not open in a tool. What should I do?',
        answer: 'The file may be password protected or damaged. Remove the password, or open the file in a PDF viewer and save a fresh copy, then try again.',
    },
    {
        id: 'slow', category: 'trouble',
        question: 'The page is slow or the browser tab crashes. How can I fix it?',
        answer: 'Close other tabs, work with fewer pages, lower the DPI when exporting images, and try on a computer instead of a phone. Large files and high resolutions need a lot of memory.',
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
        id: 'make-money', category: 'support',
        question: 'How does the site pay for itself?',
        answer: 'Through advertising and optional donations. We do not lock features behind payment, and we do not sell your documents, because we never receive them.',
    },
    {
        id: 'feature-request', category: 'support',
        question: 'Can I suggest a new tool or report a bug?',
        answer: 'Yes. Please use the Contact page or the feedback page and describe what happened, including your browser and device. Clear reports help us fix problems faster.',
    },
    {
        id: 'support-project', category: 'support',
        question: 'How can I support the project?',
        answer: 'You can use the Support Project page to make a voluntary contribution. Telling friends and colleagues about the site also helps.',
    },
];
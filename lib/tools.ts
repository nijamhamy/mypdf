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
} from "lucide-react";

export type ToolCategory = "convert" | "organize" | "edit" | "optimize";

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
  /** Unique introduction shown in the guide section. */
  intro?: string;
  /** Real situations where the tool helps. */
  useCases?: string[];
  /** Practical tips based on how the tool behaves. */
  tips?: string[];
  /** Honest limits of the tool. */
  limitations?: string[];
}

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  convert: "Convert",
  organize: "Organize",
  edit: "Edit",
  optimize: "Optimize",
};

export const TOOLS: ToolInfo[] = [
  {
    id: "pdf-to-jpg",
    title: "PDF to JPG",
    href: "/pdf-to-jpg",
    category: "convert",
    short: "Save PDF pages as JPG, PNG or WebP images at the resolution you choose.",
    points: [
      "72–300 DPI with pixel size preview",
      "Pick pages from thumbnails",
      "Several pages download as a ZIP",
    ],
    keywords: [
      "pdf to jpg converter",
      "pdf to jpg online free",
      "convert pdf to jpg",
      "pdf to image converter",
      "pdf to png converter",
      "pdf to webp converter",
      "pdf page to jpg",
      "save pdf as jpg",
    ],
    icon: ImageIcon,
    iconColor: "text-amber-500",
    cardBg: "bg-amber-50 hover:bg-amber-100 border-amber-200",
    badge: "Advanced",
    seoTitle: "PDF to JPG Converter Online – Save PDF Pages as Images",
    seoDescription:
      "Convert selected PDF pages to JPG, PNG or WebP images in your browser. Choose the resolution and pages; the file is not uploaded to our server.",
    intro:
      "This tool draws each page you select as a picture at the resolution you choose and saves it as JPG, PNG or WebP. It creates an image of the whole page; it does not pull out the separate photos stored inside the PDF.",
    useCases: [
      "Share one page of a document as a picture in a chat or email.",
      "Place a page in a slide deck or another document that accepts images.",
      "Create a preview image of the first page of a report.",
    ],
    tips: [
      "Use 150 DPI for screen use and 300 DPI when you plan to print.",
      "Choose PNG for sharp text and diagrams, and JPG or WebP for smaller files.",
      "Select only the pages you need; several pages are delivered together as a ZIP.",
    ],
    limitations: [
      "Very large pages or high DPI settings are reduced automatically to stay near 25 megapixels per page.",
      "Password-protected PDFs cannot be opened by this tool.",
      "WebP output depends on your browser; choose JPG or PNG if it is not available.",
    ],
    faqs: [
      {
        q: "How do I convert a PDF to JPG?",
        a: "Choose a PDF, select the pages you want, pick JPG, PNG or WebP and a resolution, then convert and download the images.",
      },
      {
        q: "Does this extract the photos inside my PDF?",
        a: "No. It saves each selected page as an image, including its text and graphics. It does not extract embedded pictures separately.",
      },
      {
        q: "Which DPI should I choose?",
        a: "72 to 150 DPI is usually enough for screens. Use 200 to 300 DPI for printing, remembering that higher values create larger files.",
      },
      {
        q: "What happens if I convert more than one page?",
        a: "The images are packaged together in one ZIP file, with the page number in each file name.",
      },
      {
        q: "Why was my image smaller than I expected?",
        a: "Pages that would exceed about 25 megapixels at the chosen DPI are scaled down to avoid running out of browser memory. The estimated size is shown before you convert.",
      },
      {
        q: "Is my PDF uploaded?",
        a: "No. The pages are drawn in your browser on your own device, and the file is not sent to our server for this tool.",
      },
    ],
  },
  {
    id: "jpg-to-pdf",
    title: "JPG to PDF",
    href: "/jpg-to-pdf",
    category: "convert",
    short: "Turn JPG, PNG, WebP and other images into one PDF with page size and quality options.",
    points: [
      "Reorder and rotate images",
      "A4, Letter, Legal or fit to image",
      "Quality presets to shrink the file",
    ],
    keywords: [
      "jpg to pdf converter",
      "jpg to pdf online free",
      "convert jpg to pdf",
      "png to pdf converter",
      "image to pdf converter",
      "combine images into pdf",
      "multiple images to pdf",
      "photo to pdf converter",
    ],
    icon: FileText,
    iconColor: "text-purple-500",
    cardBg: "bg-purple-50 hover:bg-purple-100 border-purple-200",
    badge: "Advanced",
    seoTitle: "JPG to PDF Converter Online – Combine Images into One PDF",
    seoDescription:
      "Combine JPG, PNG, WebP and other images into one PDF in your browser. Reorder, rotate and choose the page size; images are not uploaded to our server.",
    intro:
      "This tool places each image on its own page of a single PDF, in the order you set. You choose the page size and a quality preset that trades file size against sharpness.",
    useCases: [
      "Combine photographed pages of a document into one PDF.",
      "Send several photos or receipts as a single attachment.",
      "Prepare scanned images for a form that accepts only PDF files.",
    ],
    tips: [
      "Arrange the images in the right order before creating the PDF.",
      "Use Fit to image to avoid white borders, or A4 or Letter if the PDF will be printed.",
      "Choose a smaller quality preset when the PDF has to stay under an upload limit.",
    ],
    limitations: [
      "Many large photos can use a lot of browser memory; try fewer images at a time if the page slows down.",
      "The result is made of pictures, so the PDF has no selectable text unless the source images were already processed with OCR.",
    ],
    faqs: [
      {
        q: "How do I convert JPG to PDF?",
        a: "Add one or more images, arrange them in order, choose the page size and quality, then create and download the PDF.",
      },
      {
        q: "Can I put several images into one PDF?",
        a: "Yes. Each image becomes one page, in the order shown in the list.",
      },
      {
        q: "Which image formats can I use?",
        a: "JPG, JPEG, PNG, WebP, GIF, BMP and AVIF images can be added, depending on what your browser can open.",
      },
      {
        q: "Can I change the order or rotate an image?",
        a: "Yes. Drag images into a new order or use the move buttons, and rotate any image before creating the PDF.",
      },
      {
        q: "Will the PDF contain searchable text?",
        a: "No. The pages are images. Use an OCR tool if you need to search or copy the text.",
      },
      {
        q: "Are my images uploaded?",
        a: "No. The PDF is created in your browser on your device, and the images are not sent to our server for this tool.",
      },
    ],
  },
  {
    id: "pdf-to-word",
    title: "PDF to Word",
    href: "/pdf-to-word",
    category: "convert",
    short: "Convert a PDF to an editable Word document, with OCR for scanned files.",
    points: [
      "Editable text with headings and bullets",
      "OCR for scanned PDFs",
      "Pick pages and keep page breaks",
    ],
    keywords: [
      "pdf to word converter",
      "pdf to word online free",
      "convert pdf to word",
      "pdf to docx converter",
      "pdf to editable word",
      "extract text from pdf",
      "scanned pdf to word ocr",
      "tamil pdf to word",
      "arabic pdf to word",
      "pdf to word without upload",
    ],
    icon: FileOutput,
    iconColor: "text-sky-500",
    cardBg: "bg-sky-50 hover:bg-sky-100 border-sky-200",
    badge: "Advanced",
    seoTitle: "PDF to Word Converter Online – Editable DOCX with OCR",
    seoDescription:
      "Convert PDF pages to a Word DOCX in your browser, with OCR for scans in many languages including Tamil and Arabic. Layout may differ from the original.",
    intro:
      "This tool rebuilds a PDF as a Word document in your browser. It has three methods: editable text for PDFs that already contain selectable text, OCR for scanned pages, and page images when keeping the appearance matters more than editing.",
    useCases: [
      "Edit the wording of a document when you no longer have the original Word file.",
      "Turn a scanned page into text you can copy and correct, using OCR.",
      "Reuse a simple table or list from a PDF in another document.",
    ],
    tips: [
      "Try Editable text first for PDFs that let you select text with the mouse; use OCR only for scans.",
      "For OCR, choose the language that matches the document and proofread names and numbers.",
      "Convert only the pages you need to keep processing fast.",
    ],
    limitations: [
      "The Word layout is rebuilt, so complex columns, borderless tables, merged cells, charts and exact colors may not match the PDF.",
      "OCR can make mistakes, especially with poor scans, small print or handwriting.",
      "Some older fonts store text in a way that does not convert to readable text; OCR or page images may work better.",
      "The first OCR run may download language data.",
    ],
    faqs: [
      {
        q: "How do I convert a PDF to Word?",
        a: "Choose a PDF, pick Editable text, Scanned PDF (OCR) or Page images, select the pages, then convert and download the DOCX.",
      },
      {
        q: "Will the Word file look exactly like the PDF?",
        a: "Not always. The document is rebuilt from the text and shapes the tool can read, so complex layouts can differ. Compare the result with your PDF.",
      },
      {
        q: "Can I convert a scanned PDF?",
        a: "Yes. Choose Scanned PDF (OCR) and select the language of the text. Accuracy depends on scan quality.",
      },
      {
        q: "Which languages does OCR support?",
        a: "The list includes English, Tamil, Arabic, Hindi, Urdu and many others. Pick the one that matches your document.",
      },
      {
        q: "When should I choose Page images?",
        a: "Choose it when the exact look of each page matters more than editing. The text in the Word file will not be editable.",
      },
      {
        q: "Is my PDF uploaded?",
        a: "No. Conversion and OCR run in your browser. OCR may download language data the first time you use it.",
      },
    ],
  },
  {
    id: "merge-pdf",
    title: "Merge PDF",
    href: "/merge-pdf",
    category: "organize",
    short: "Combine several PDFs into one document in exactly the order you want.",
    points: [
      "Drag and drop ordering",
      "Choose pages from each file",
      "Sort A–Z or reverse the list",
    ],
    keywords: [
      "merge pdf files online",
      "merge pdf online free",
      "combine pdf files",
      "combine pdfs into one",
      "pdf merger",
      "join pdf files",
      "merge pdf without upload",
      "select pages from pdf and merge",
    ],
    icon: Files,
    iconColor: "text-red-500",
    cardBg: "bg-red-50 hover:bg-red-100 border-red-200",
    badge: "Advanced",
    seoTitle: "Merge PDF Files Online – Combine and Reorder PDFs",
    seoDescription:
      "Combine several PDFs into one in your browser. Reorder files, choose pages from each, and download a new PDF; files are not uploaded to our server.",
    intro:
      "This tool joins several PDF files into one new PDF. You decide the order of the files and which pages of each file to include, and you can check pages in thumbnails before merging.",
    useCases: [
      "Assemble an application or claim from separate forms and supporting documents.",
      "Join scanned pages that were saved as separate files.",
      "Combine monthly invoices or reports into one document for filing.",
    ],
    tips: [
      "Use the page range box to leave out cover sheets or blank pages from a file.",
      "Sort by name when your files are numbered, then adjust the order by hand.",
      "Open the merged file and scroll through it before you share it.",
    ],
    limitations: [
      "Password-protected PDFs cannot be merged by this tool.",
      "Features such as bookmarks, links and form fields may not carry over to the merged file.",
      "Very large files can use a lot of browser memory; merge in smaller groups if the page slows down.",
    ],
    faqs: [
      {
        q: "How do I merge PDF files?",
        a: "Add two or more PDFs, put them in the order you want, choose the pages to include, then merge and download the new PDF.",
      },
      {
        q: "Can I use only some pages of a file?",
        a: "Yes. Open a file to see its pages and select the ones you want, or type a range such as 1-3, 5.",
      },
      {
        q: "How do I change the order?",
        a: "Drag files to a new position, use the move buttons, or sort A–Z, Z–A or reverse the list.",
      },
      {
        q: "Will bookmarks and links still work?",
        a: "They may not be kept. Check the merged PDF if you rely on them.",
      },
      {
        q: "Why can't I merge my file?",
        a: "The PDF may be damaged or password-protected. Remove the password in the program that created it and try again.",
      },
      {
        q: "Are my files uploaded?",
        a: "No. The merge happens in your browser, and the files are not sent to our server for this tool.",
      },
    ],
  },
  {
    id: "split-pdf",
    title: "Split PDF",
    href: "/split-pdf",
    category: "organize",
    short: "Extract pages, delete pages, or cut a PDF into several smaller files.",
    points: [
      "Extract, delete, ranges or every N pages",
      "Preview of the files before creating",
      "Results delivered as a ZIP",
    ],
    keywords: [
      "split pdf online",
      "split pdf online free",
      "extract pages from pdf",
      "pdf splitter",
      "separate pdf pages",
      "extract pdf pages online",
      "remove pages from pdf",
      "split pdf into multiple files",
      "split pdf by page range",
    ],
    icon: Scissors,
    iconColor: "text-blue-500",
    cardBg: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    badge: "Advanced",
    seoTitle: "Split PDF Online – Extract or Remove PDF Pages",
    seoDescription:
      "Extract pages, delete pages, split by ranges or every N pages in your browser. Preview the output before creating it; files are not uploaded to our server.",
    intro:
      "This tool creates new PDFs from parts of an existing one. It can extract chosen pages, delete pages and keep the rest, split by page ranges you type, or cut the file into equal groups of pages.",
    useCases: [
      "Send only the relevant pages of a long document.",
      "Separate a combined scan into one file per document.",
      "Remove a page with information you do not want to share.",
    ],
    tips: [
      "In ranges mode, a list such as 1-3, 4-6, 8 creates three separate PDFs.",
      "Check the output list before creating files to confirm each part and its page count.",
      "Several output files are downloaded together as a ZIP.",
    ],
    limitations: [
      "Password-protected PDFs cannot be split by this tool.",
      "Bookmarks, links and form fields may not carry over to the new files.",
      "You cannot delete every page; at least one page must remain.",
    ],
    faqs: [
      {
        q: "How do I split a PDF?",
        a: "Choose a PDF, pick Extract, Delete, Split by ranges or Split every N pages, set the pages, then create and download the files.",
      },
      {
        q: "How do I extract specific pages?",
        a: "Choose Extract pages, then click thumbnails or type a range such as 1-3, 5.",
      },
      {
        q: "How do I remove pages?",
        a: "Choose Delete pages, select the pages to remove, and save the remaining pages as a new PDF.",
      },
      {
        q: "What does Split every N pages do?",
        a: "It divides the PDF into equal groups. The last file may be shorter if the page count does not divide evenly.",
      },
      {
        q: "How are several files delivered?",
        a: "Multiple PDFs are packaged in one ZIP file.",
      },
      {
        q: "Are my files uploaded?",
        a: "No. The PDF is split in your browser, and the file is not sent to our server for this tool.",
      },
    ],
  },
  {
    id: "rotate-pdf",
    title: "Rotate PDF",
    href: "/rotate-pdf",
    category: "organize",
    short: "Fix sideways or upside-down pages one by one or all at once.",
    points: [
      "Per-page rotate with live preview",
      "Rotate odd, even or selected pages",
      "Remove pages in the same step",
    ],
    keywords: [
      "rotate pdf pages",
      "rotate pdf online free",
      "rotate pdf pages online",
      "fix sideways pdf",
      "turn pdf pages",
      "change pdf page orientation",
      "rotate scanned pdf",
      "pdf rotator",
      "delete pages from pdf",
    ],
    icon: RotateCw,
    iconColor: "text-teal-500",
    cardBg: "bg-teal-50 hover:bg-teal-100 border-teal-200",
    badge: "Advanced",
    seoTitle: "Rotate PDF Pages Online – Fix Sideways or Upside-Down Pages",
    seoDescription:
      "Rotate single, selected, odd or even PDF pages and remove pages you do not need, in your browser. Your file is not uploaded to our server.",
    intro:
      "This tool turns pages of a PDF the right way up. You can rotate one page, a selection, or all, odd or even pages, check each page in the thumbnails, and remove pages in the same step.",
    useCases: [
      "Correct a scan that came out sideways or upside down.",
      "Fix every second page when a double-sided scan flipped alternate pages.",
      "Turn one landscape page in a portrait document.",
    ],
    tips: [
      "Use the odd or even buttons for alternate-page problems.",
      "Check the rotated and removed counts before you create the file.",
      "Test the downloaded PDF in the program where it will be used.",
    ],
    limitations: [
      "Some PDF viewers ignore page rotation settings, so check the result where you will use it.",
      "Password-protected PDFs cannot be changed by this tool.",
    ],
    faqs: [
      {
        q: "How do I rotate PDF pages?",
        a: "Choose a PDF, rotate pages with the buttons under each thumbnail or select several pages, then apply the changes and download.",
      },
      {
        q: "Can I rotate only some pages?",
        a: "Yes. Select pages, then rotate them left or right together, or use the odd and even buttons.",
      },
      {
        q: "Can I rotate a page by 180 degrees?",
        a: "Yes. Use the All 180° button, or rotate a page twice in the same direction.",
      },
      {
        q: "Does rotating reduce quality?",
        a: "No. The tool changes the page rotation setting and does not redraw the page content.",
      },
      {
        q: "Can I remove pages at the same time?",
        a: "Yes. Remove pages you do not need; you can restore them until you create the file.",
      },
      {
        q: "Are my files uploaded?",
        a: "No. The PDF is changed in your browser, and the file is not sent to our server for this tool.",
      },
    ],
  },
  {
    id: "edit-pdf",
    title: "Edit PDF",
    href: "/edit-pdf",
    category: "edit",
    short: "Edit text, add text, highlight, draw, whiteout and insert images in your PDF.",
    points: [
      "Click existing text to edit it",
      "Any language for new text",
      "Optional flatten when saving",
    ],
    keywords: [
      "edit pdf online",
      "edit pdf text online",
      "add text to pdf",
      "pdf editor online",
      "highlight pdf online",
      "whiteout pdf",
      "add image to pdf",
      "pdf editor no upload",
    ],
    icon: Type,
    iconColor: "text-orange-500",
    cardBg: "bg-orange-50 hover:bg-orange-100 border-orange-200",
    badge: "Advanced",
    seoTitle: "Edit PDF Online – Add Text, Highlights, Images and Drawings",
    seoDescription:
      "Edit text, add text, highlight, draw, whiteout and insert images in a PDF in your browser. The file is not uploaded to our server.",
    intro:
      "This tool lets you make changes to a PDF in your browser: edit existing text, add new text, highlight, draw, cover content with a whiteout box and place images. How well existing text can be edited depends on how the PDF stores it.",
    useCases: [
      "Add a name, date or short note to a form.",
      "Highlight or mark up a document for review.",
      "Correct a small typo in a simple text PDF.",
    ],
    tips: [
      "Zoom in and check each change before saving.",
      "Use the Add text tool with the Unicode font option for languages such as Tamil or Arabic.",
      "Keep your original PDF and save the edited file under a new name.",
    ],
    limitations: [
      "Editing existing text works best on PDFs with simple selectable text; results can differ with fonts and complex layouts.",
      "A whiteout box covers content visually. Do not assume the covered text is removed; open the saved file and try to search or select it to confirm.",
      "Password-protected PDFs cannot be edited by this tool.",
    ],
    faqs: [
      {
        q: "Can I edit existing text in a PDF?",
        a: "Often yes. Choose Edit text and click a line of text. Results depend on how the PDF stores its text and fonts.",
      },
      {
        q: "Can I add Tamil or Arabic text?",
        a: "Yes. Use the Add text tool and select the Unicode font option.",
      },
      {
        q: "Does whiteout permanently remove text?",
        a: "Whiteout covers content. If you enable the flatten option when saving, check the saved PDF by searching and selecting text to confirm that the covered text is gone.",
      },
      {
        q: "Can I add images?",
        a: "Yes. You can insert images and place them on the page.",
      },
      {
        q: "Are my files uploaded?",
        a: "No. The PDF is opened and edited in your browser, and the file is not sent to our server for this tool.",
      },
    ],
  },
  {
    id: "image-sheet",
    title: "Image Sheet Maker",
    href: "/image-sheet",
    category: "edit",
    short: "Repeat one image or a single-page PDF 2, 4, 8 or any number of times on an A4 sheet, or fill a page with passport-size photos.",
    points: [
      "Copies per sheet, custom grid or fixed photo size",
      "A4, Letter and other paper sizes with margins and cut lines",
      "Save as PDF, PNG or JPG at up to 600 DPI",
    ],
    keywords: [
      "image sheet maker",
      "repeat image on a4 page",
      "passport photo sheet maker",
      "photo grid pdf",
      "multiple copies of image on one page",
      "print photo sheet online",
      "photo layout for printing",
      "id photo sheet",
    ],
    icon: LayoutGrid,
    iconColor: "text-cyan-500",
    cardBg: "bg-cyan-50 hover:bg-cyan-100 border-cyan-200",
    badge: "Advanced",
    seoTitle: "Print Image Copies on a PDF Sheet – Photo Sheet Maker",
    seoDescription:
      "Repeat one image on a printable sheet, set a grid or a fixed photo size such as 35 x 45 mm, and save a PDF, PNG or JPG in your browser. Not an images-to-PDF merger.",
    intro:
      "This tool repeats one image, or one PDF page, across a printable sheet. It is meant for several identical prints on one page, such as small photos, labels or cards. To combine different images into one PDF, use the JPG to PDF tool.",
    useCases: [
      "Print several small photos on one sheet of photo paper.",
      "Lay out labels, cards or stickers with cut lines.",
      "Fill a page with copies of the same artwork.",
    ],
    tips: [
      "Print at Actual size or 100% so the copies keep their exact size, and measure a test print first.",
      "Watch the estimated print resolution; below about 150 DPI the image may look blurry.",
      "Increase the margin if your printer cuts off the edges.",
    ],
    limitations: [
      "It uses one image per sheet design; it does not place different images on the same sheet.",
      "Photo size presets only set the box size. They do not check any official photo requirements.",
      "PNG and JPG downloads contain the first sheet only; choose PDF to get every sheet.",
    ],
    faqs: [
      {
        q: "How do I put several copies of one image on a page?",
        a: "Choose a file, pick Copies per sheet or a grid, set the paper size, check the preview and create the PDF.",
      },
      {
        q: "Can I combine different images into one PDF?",
        a: "Not with this tool. Use the JPG to PDF tool to place different images on separate pages.",
      },
      {
        q: "Can I make a passport-style photo sheet?",
        a: "You can choose a fixed photo size and add cut lines. Check the requirements of the organisation that will receive the photo yourself, because the tool does not verify them.",
      },
      {
        q: "Which files can I use?",
        a: "JPG, PNG, WebP and other image types your browser can open, or a PDF with exactly one page.",
      },
      {
        q: "Why do my printed copies look the wrong size?",
        a: "The print dialog may be set to fit the page. Choose Actual size or 100%.",
      },
      {
        q: "Is my image uploaded?",
        a: "No. The sheet is created in your browser, and the file is not sent to our server for this tool.",
      },
    ],
  },
  {
    id: "watermark-pdf",
    title: "Add Watermark",
    href: "/watermark-pdf",
    category: "edit",
    short: "Stamp text or a logo on your pages with a live preview before you apply it.",
    points: [
      "Text or image watermarks",
      "Opacity, rotation and tile mode",
      "Apply to all, odd, even or chosen pages",
    ],
    keywords: [
      "add watermark to pdf",
      "add watermark to pdf online free",
      "pdf watermark generator",
      "text watermark pdf",
      "image watermark pdf",
      "confidential pdf watermark",
      "draft pdf watermark",
      "logo watermark pdf",
      "watermark pdf without upload",
    ],
    icon: Stamp,
    iconColor: "text-indigo-500",
    cardBg: "bg-indigo-50 hover:bg-indigo-100 border-indigo-200",
    badge: "Advanced",
    seoTitle: "Add a Watermark to PDF Online – Text or Image",
    seoDescription:
      "Add a visible text or image watermark to selected PDF pages in your browser. Set position, opacity and rotation; the file is not uploaded to our server.",
    intro:
      "This tool adds a visible mark, either text or a PNG/JPG image, to chosen pages of a copy of your PDF. You control the position, opacity and rotation, and you can repeat the mark across the page.",
    useCases: [
      "Mark a document as DRAFT, COPY or CONFIDENTIAL.",
      "Add a company logo to a proposal or report.",
      "Show the page number or date on each page with the text tokens.",
    ],
    tips: [
      "Lower the opacity so the page text stays readable.",
      "Use a small size and an edge position for logos, and the center for status labels.",
      "Leave a cover page unmarked by choosing a custom page range.",
    ],
    limitations: [
      "A watermark is a visible mark. It does not encrypt the file or stop anyone from copying or removing it.",
      "The built-in fonts support basic Latin characters only; use an image watermark for other scripts.",
      "Password-protected PDFs cannot be changed by this tool.",
    ],
    faqs: [
      {
        q: "How do I add a watermark to a PDF?",
        a: "Choose a PDF, create a text or image watermark, set its position, opacity and rotation, choose the pages, then apply and download.",
      },
      {
        q: "Can I use my logo?",
        a: "Yes. Select a PNG or JPG that you have the right to use. A PNG with a transparent background usually looks best.",
      },
      {
        q: "Can I repeat the watermark across the page?",
        a: "Yes. Turn on tiling. If the settings would create too many copies, a single mark is used, so increase the size or spacing.",
      },
      {
        q: "Does a watermark protect my document?",
        a: "No. It is only a visible mark and can be removed. Do not rely on it as the only protection for sensitive documents.",
      },
      {
        q: "Why are some letters missing?",
        a: "The built-in PDF fonts skip characters outside basic Latin. Use an image of the text instead.",
      },
      {
        q: "Is my PDF uploaded?",
        a: "No. The watermark is added in your browser, and the file is not sent to our server for this tool.",
      },
    ],
  },
  {
    id: "page-numbers",
    title: "Add Page Numbers",
    href: "/page-numbers",
    category: "edit",
    short: "Number your pages with the position, style and format you need.",
    points: [
      "Six positions and roman numerals",
      "Formats like Page 1 of N",
      "Skip the cover or number a range",
    ],
    keywords: [
      "add page numbers to pdf",
      "add page numbers to pdf online free",
      "pdf page number generator",
      "number pdf pages",
      "insert page numbers in pdf",
      "pdf page numbering tool",
      "add footer page numbers pdf",
      "skip cover page numbering",
    ],
    icon: Hash,
    iconColor: "text-pink-500",
    cardBg: "bg-pink-50 hover:bg-pink-100 border-pink-200",
    badge: "Advanced",
    seoTitle: "Add Page Numbers to PDF Online – Choose Position and Format",
    seoDescription:
      "Add page numbers to a PDF in your browser. Choose the position, format, start number and pages; the file is not uploaded to our server.",
    intro:
      "This tool prints page numbers onto the pages of a copy of your PDF. You choose where the number appears, the format, the starting number and which pages to number, for example skipping the cover.",
    useCases: [
      "Number a report, thesis or set of scanned pages.",
      "Start numbering after a cover page or table of contents.",
      "Use Roman numerals for front matter in a separate run.",
    ],
    tips: [
      "Enable Skip the first page when you have a cover page.",
      "Pick a position that does not collide with existing footers or headers.",
      "Open the result and check a few pages with different layouts.",
    ],
    limitations: [
      "Numbers are drawn on top of the existing page, so they can overlap content near the margin.",
      "Password-protected PDFs cannot be changed by this tool.",
    ],
    faqs: [
      {
        q: "How do I add page numbers to a PDF?",
        a: "Choose a PDF, set the position, format and starting number, choose the pages, then apply and download the PDF.",
      },
      {
        q: "Can I skip the cover page?",
        a: "Yes. Enable Skip the first page, or enter a custom page range to number only some pages.",
      },
      {
        q: "Can I start from a number other than 1?",
        a: "Yes. Set the starting number for the first numbered page.",
      },
      {
        q: "Can I use Roman numerals or letters?",
        a: "Yes. You can use Arabic numbers, lowercase or uppercase Roman numerals, and lowercase or uppercase letters.",
      },
      {
        q: "Why does a number overlap my text?",
        a: "The number is placed over the page. Choose another position or margin, then check the result.",
      },
      {
        q: "Is my PDF uploaded?",
        a: "No. Page numbers are added in your browser, and the file is not sent to our server for this tool.",
      },
    ],
  },
  {
    id: "compress-pdf",
    title: "Compress PDF",
    href: "/compress-pdf",
    category: "optimize",
    short: "Optimize a PDF to reduce its size where possible, for easier email, upload and sharing.",
    points: [
      "Optimizes the PDF file structure",
      "Runs in your browser",
      "No sign-up needed",
    ],
    keywords: [
      "compress pdf online",
      "compress pdf",
      "reduce pdf file size",
      "make pdf smaller",
      "pdf compressor",
      "compress pdf for email",
      "shrink pdf file",
    ],
    icon: Minimize2,
    iconColor: "text-green-500",
    cardBg: "bg-green-50 hover:bg-green-100 border-green-200",
    seoTitle: "Compress PDF Online – Optimize PDF Structure to Reduce Size",
    seoDescription:
      "Optimize a PDF in your browser to reduce its size where possible. Results vary, and image-heavy files may shrink very little. Not uploaded to our server.",
    intro:
      "This tool optimizes the internal structure of a PDF to make it smaller where it can. It does not recompress the images inside, so the pages look the same, but files full of photos or scans may not get much smaller.",
    useCases: [
      "Try to bring a PDF closer to an email attachment limit.",
      "Prepare a file for an upload form that has a size limit.",
      "Tidy a PDF that has extra internal data from repeated editing.",
    ],
    tips: [
      "Compare the new size with the original before you use the file.",
      "If the file barely shrinks, it is probably mostly images; try a tool that lowers image quality if you can accept that.",
      "Keep the original until you have checked the compressed PDF.",
    ],
    limitations: [
      "A smaller file is not guaranteed; some PDFs are already well optimized.",
      "Because images are not recompressed, scanned or photo-heavy PDFs may change very little.",
      "Password-protected PDFs cannot be processed by this tool.",
    ],
    faqs: [
      {
        q: "How much smaller will my PDF get?",
        a: "It varies. Files with a lot of internal overhead shrink the most, while PDFs full of photos or scans may change very little.",
      },
      {
        q: "Will compressing lower the quality?",
        a: "The tool does not recompress images, so the pages look the same. The trade-off is that image-heavy files may not get much smaller.",
      },
      {
        q: "Why did my file not get smaller?",
        a: "It may already be optimized, or it may be mostly images, which this tool leaves unchanged.",
      },
      {
        q: "Is my file uploaded?",
        a: "No. Compression runs in your browser, and the file is not sent to our server for this tool.",
      },
    ],
  },
];

import {
    Files, Scissors, RotateCw, Stamp, Hash, Image as ImageIcon, FileText, Minimize2,
    type LucideIcon,
} from 'lucide-react';

export type ToolCategory = 'convert' | 'organize' | 'edit' | 'optimize';

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
        keywords: ['image', 'picture', 'png', 'webp', 'export', 'photo', 'dpi'],
        icon: ImageIcon, iconColor: 'text-amber-500', cardBg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
        badge: 'Advanced',
    },
    {
        id: 'jpg-to-pdf', title: 'JPG to PDF', href: '/jpg-to-pdf', category: 'convert',
        short: 'Turn JPG, PNG, WebP and other images into one PDF with page size and quality options.',
        points: ['Reorder and rotate images', 'A4, Letter, Legal or fit to image', 'Quality presets to shrink the file'],
        keywords: ['image', 'photo', 'picture', 'scan', 'png', 'webp', 'camera'],
        icon: FileText, iconColor: 'text-purple-500', cardBg: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
        badge: 'Advanced',
    },
    {
        id: 'merge-pdf', title: 'Merge PDF', href: '/merge-pdf', category: 'organize',
        short: 'Combine several PDFs into one document in exactly the order you want.',
        points: ['Drag and drop ordering', 'Choose pages from each file', 'Sort A–Z or reverse the list'],
        keywords: ['combine', 'join', 'append', 'together', 'order', 'reorder'],
        icon: Files, iconColor: 'text-red-500', cardBg: 'bg-red-50 hover:bg-red-100 border-red-200',
        badge: 'Advanced',
    },
    {
        id: 'split-pdf', title: 'Split PDF', href: '/split-pdf', category: 'organize',
        short: 'Extract pages, delete pages, or cut a PDF into several smaller files.',
        points: ['Extract, delete, ranges or every N pages', 'Preview of the files before creating', 'Results delivered as a ZIP'],
        keywords: ['extract', 'separate', 'cut', 'delete', 'remove', 'pages', 'divide'],
        icon: Scissors, iconColor: 'text-blue-500', cardBg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
        badge: 'Advanced',
    },
    {
        id: 'rotate-pdf', title: 'Rotate PDF', href: '/rotate-pdf', category: 'organize',
        short: 'Fix sideways or upside-down pages one by one or all at once.',
        points: ['Per-page rotate with live preview', 'Rotate odd, even or selected pages', 'Remove pages in the same step'],
        keywords: ['turn', 'sideways', 'landscape', 'portrait', 'flip', 'orientation', 'delete'],
        icon: RotateCw, iconColor: 'text-teal-500', cardBg: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
        badge: 'Advanced',
    },
    {
        id: 'watermark-pdf', title: 'Add Watermark', href: '/watermark-pdf', category: 'edit',
        short: 'Stamp text or a logo on your pages with a live preview before you apply it.',
        points: ['Text or image watermarks', 'Opacity, rotation and tile mode', 'Apply to all, odd, even or chosen pages'],
        keywords: ['stamp', 'logo', 'confidential', 'draft', 'brand', 'protect', 'text'],
        icon: Stamp, iconColor: 'text-indigo-500', cardBg: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
        badge: 'Advanced',
    },
    {
        id: 'page-numbers', title: 'Add Page Numbers', href: '/page-numbers', category: 'edit',
        short: 'Number your pages with the position, style and format you need.',
        points: ['Six positions and roman numerals', 'Formats like Page 1 of N', 'Skip the cover or number a range'],
        keywords: ['number', 'numbering', 'footer', 'header', 'roman', 'pagination', 'index'],
        icon: Hash, iconColor: 'text-pink-500', cardBg: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
        badge: 'Advanced',
    },
    {
        id: 'compress-pdf', title: 'Compress PDF', href: '/compress-pdf', category: 'optimize',
        short: 'Reduce the size of a PDF so it is easier to email, upload and share.',
        points: ['Smaller files for email and forms', 'Runs in your browser', 'No sign-up needed'],
        keywords: ['reduce', 'smaller', 'size', 'shrink', 'optimize', 'email', 'compress', 'mb'],
        icon: Minimize2, iconColor: 'text-green-500', cardBg: 'bg-green-50 hover:bg-green-100 border-green-200',
    },
];
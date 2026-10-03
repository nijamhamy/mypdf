'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, FileText } from 'lucide-react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { name: 'PDF Converter', href: '/pdf-converter' },
        { name: 'Features / Help', href: '/features' },
        { name: 'FAQ / Problems', href: '/faq' },
        { name: 'Feedback', href: '/feedback' },
        { name: 'Support project', href: '/support-project' },
        { name: 'Contact', href: '/contact' },
    ];

    return (
        <header className="bg-red-700 text-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-wider">
                            <FileText className="w-8 h-8 text-white" />
                            <span>mypdf.site</span>
                        </Link>
                    </div>

                    {/* Desktop Nav Links */}
                    <nav className="hidden md:flex space-x-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-white hover:text-red-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-white hover:text-red-200 focus:outline-none"
                        >
                            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-red-800 border-t border-red-600 px-2 pt-2 pb-3 space-y-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-red-700"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>
            )}
        </header>
    );
}
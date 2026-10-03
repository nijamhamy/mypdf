'use client';

import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Minimize2, Upload, Download, Loader2, FileText } from 'lucide-react';

export default function CompressPDFPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [compressedPdfUrl, setCompressedPdfUrl] = useState<string | null>(null);
    const [originalSize, setOriginalSize] = useState<string>('');
    const [compressedSize, setCompressedSize] = useState<string>('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                alert('Please upload a valid PDF file.');
                return;
            }
            setSelectedFile(file);
            setOriginalSize((file.size / 1024 / 1024).toFixed(2) + ' MB');
            setCompressedPdfUrl(null);
        }
    };

    const handleCompressPDF = async () => {
        if (!selectedFile) return;

        setIsProcessing(true);
        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
            const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            setCompressedPdfUrl(url);
            setCompressedSize((blob.size / 1024 / 1024).toFixed(2) + ' MB');
        } catch (error) {
            console.error('Error compressing PDF:', error);
            alert('Failed to compress PDF. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 text-green-600 rounded-2xl mb-4">
                        <Minimize2 className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Compress PDF File</h1>
                    <p className="text-gray-600 mt-2">
                        Reduce your PDF file size while optimizing for maximal quality.
                    </p>
                </div>

                {!selectedFile ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-green-500 transition-colors bg-gray-50/50">
                        <input
                            type="file"
                            id="pdf-compress-upload"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <label
                            htmlFor="pdf-compress-upload"
                            className="cursor-pointer flex flex-col items-center justify-center"
                        >
                            <Upload className="w-12 h-12 text-green-500 mb-3" />
                            <span className="text-lg font-semibold text-gray-700">Click to upload PDF file</span>
                            <span className="text-sm text-gray-500 mt-1">or drag and drop PDF here</span>
                        </label>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                            <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-green-600" />
                                <div>
                                    <p className="font-semibold text-gray-800">{selectedFile.name}</p>
                                    <p className="text-xs text-green-600 font-medium">Original Size: {originalSize}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedFile(null);
                                    setCompressedPdfUrl(null);
                                }}
                                className="text-sm text-red-600 hover:underline font-medium"
                            >
                                Change File
                            </button>
                        </div>

                        <button
                            onClick={handleCompressPDF}
                            disabled={isProcessing}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Compressing PDF...</span>
                                </>
                            ) : (
                                <span>Compress PDF Now</span>
                            )}
                        </button>
                    </div>
                )}

                {compressedPdfUrl && (
                    <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-2xl text-center">
                        <h3 className="text-xl font-bold text-green-800 mb-2">PDF Compressed Successfully!</h3>
                        <p className="text-sm text-green-600 mb-2">New Size: <span className="font-semibold">{compressedSize}</span></p>
                        <p className="text-xs text-gray-500 mb-4">Your optimized PDF file is ready for download.</p>
                        <a
                            href={compressedPdfUrl}
                            download="compressed.pdf"
                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-md"
                        >
                            <Download className="w-5 h-5" />
                            <span>Download Compressed PDF</span>
                        </a>
                    </div>
                )}

            </div>
        </main>
    );
}
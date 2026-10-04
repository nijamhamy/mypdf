import type { NextConfig } from 'next';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mypdf.site').replace(/\/$/, '');
const siteHost = new URL(siteUrl).hostname;
const isLocal = siteHost === 'localhost' || siteHost.startsWith('127.');

const securityHeaders = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig: NextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,

    async redirects() {
        if (isLocal || siteHost.startsWith('www.')) return [];
        return [
            {
                source: '/:path*',
                has: [{ type: 'host', value: `www.${siteHost}` }],
                destination: `${siteUrl}/:path*`,
                permanent: true,
            },
        ];
    },

    async headers() {
        return [
            {
                source: '/:path*',
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;
import { toolMetadata } from '@/lib/seo';

export const metadata = toolMetadata('jpg-to-pdf');

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
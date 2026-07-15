import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Shop - VAM Enterprises",
  description: "Explore the full range of exclusive and premium gifts from VAM Enterprises. From corporate gifting to personal presents, find the perfect item for any occasion.",
  keywords: "shop, all products, VAM Enterprises, premium gifts, luxury gifts, corporate gifts, gifting solution",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

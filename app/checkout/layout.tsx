import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout - VAM Enterprises',
  description: 'Manage your products, view sales, and update your profile in the seller dashboard.',
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

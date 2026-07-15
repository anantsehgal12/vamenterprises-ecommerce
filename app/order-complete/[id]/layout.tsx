import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Complete - VAM Enterprises'
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

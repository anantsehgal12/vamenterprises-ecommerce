// app/custom-order/[token]/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/src/db/index";
import { CustomOrder } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import CustomOrderCheckout from "@/app/_components/custom-order/CustomOrderCheckout";
import CustomOrderState from "@/app/_components/custom-order/CustomOrderState";

export default async function CustomOrderPage({
  params,
}: {
  params: { token: string };
}) {
  const { userId } = await auth();

  // Not signed in -> straight to your sign-in page, which redirects back
  // here once auth completes. See patches/ for the sign-in/sign-up changes
  // that make `redirect_url` work.
  if (!userId) {
    redirect(`/auth/sign-in?redirect_url=${encodeURIComponent(`/custom-order/${params.token}`)}`);
  }

  const [order] = await db
    .select()
    .from(CustomOrder)
    .where(eq(CustomOrder.token, params.token))
    .limit(1);

  if (!order) {
    return <CustomOrderState variant="invalid" />;
  }
  if (order.status === "completed" || order.status === "claimed") {
    return <CustomOrderState variant="completed" />;
  }
  if (order.status === "cancelled") {
    return <CustomOrderState variant="cancelled" />;
  }
  if (order.expiresAt && new Date(order.expiresAt) < new Date()) {
    return <CustomOrderState variant="expired" />;
  }

  return <CustomOrderCheckout order={order} token={params.token} />;
}

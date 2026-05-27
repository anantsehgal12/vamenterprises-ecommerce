'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/_components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface OrderItem {
  id: string;
  quantity: number;
  price: number | string;
  product: {
    id: string;
    name: string;
    price: string;
    category: { name: string };
    images?: { id: string; url: string; altText: string }[];
  };
  variant?: string;
}

interface Order {
  id: string;
  orderId: string;
  totalAmount: number | string;
  status: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  invoiceUrl?: string;
  items: OrderItem[];
  createdAt: string;
}

export default function OrdersPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDescription, setCancelDescription] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, isLoaded, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReason) return;

    setCancelling(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancelReason,
          cancelDescription
        })
      });

      if (response.ok) {
        setCancelDialogOpen(false);
        setCancelReason('');
        setCancelDescription('');
        setSelectedOrder(null);
        fetchOrders(); // Refresh orders
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const openCancelDialog = (order: Order) => {
    setSelectedOrder(order);
    setCancelDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'shipped':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'delivered':
        return 'bg-[#4ca626]/20 text-[#9be274] border-[#4ca626]/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
    }
  };

  const cancelReasons = [
    { value: 'changed_mind', label: 'Changed my mind' },
    { value: 'wrong_item', label: 'Wrong item ordered' },
    { value: 'better_price', label: 'Found better price elsewhere' },
    { value: 'delivery_delay', label: 'Delivery delay' },
    { value: 'other', label: 'Other' }
  ];

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#4ca626]/20 border-t-[#4ca626]" />
            <p className="text-lg text-zinc-400">Loading Orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
      <div className="min-h-screen bg-black">
        <Navbar />

        {/* Background Glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-0 h-[500px] w-[500px] rounded-full bg-[#4ca626]/15 blur-3xl" />
          <div className="absolute bottom-0 right-[-10%] h-[500px] w-[500px] rounded-full bg-[#4ca626]/10 blur-3xl" />
        </div>

        <div className="py-8 relative z-10">
          <div className="container mx-auto px-4 max-w-5xl">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">My Orders</h1>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-zinc-300 text-lg mb-4">You haven't placed any orders yet</div>
                <Button onClick={() => router.push('/shop')} className="rounded-3xl bg-[#4ca626] text-white hover:bg-[#5cbf32] p-6 text-md">
                  Start Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <Card key={order.id} className="bg-gradient-to-b from-zinc-900 to-black border-white/10 shadow-[0_20px_80px_-20px_rgba(76,166,38,0.2)] backdrop-blur-xl rounded-[2rem] overflow-hidden">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white flex items-center space-x-4">
                            <span>Order #{order.orderId}</span>
                            <Badge variant="outline" className={`${getStatusColor(order.status)}`}>
                              {order.status}
                            </Badge>
                          </CardTitle>
                          <p className="text-zinc-400 text-sm mt-2">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-zinc-400 text-sm">Total Amount</p>
                          <p className="text-white text-xl font-bold">₹{Number(order.totalAmount).toFixed(2)}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-4 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl">
                            <div className="flex-shrink-0">
                              {item.product.images?.[0] ? (
                                <img
                                  src={item.product.images[0].url}
                                  alt={item.product.images[0].altText || item.product.name}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-zinc-800 rounded flex items-center justify-center">
                                  <span className="text-zinc-500 text-xs">No Image</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-grow">
                              <h3 className="text-white font-medium">{item.product.name}</h3>
                              {item.variant && (
                                <p className="text-zinc-400 text-sm">Variant: {item.variant}</p>
                              )}
                              <p className="text-zinc-400 text-sm">Category: {item.product.category.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white">Qty: {item.quantity}</p>
                              <p className="text-white font-medium">₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center">
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => router.push(`/order-complete/${order.id}`)}
                              variant="outline"
                              className="border-white/10 text-white hover:bg-zinc-800"
                            >
                              View Order Details
                            </Button>
                            {!['shipped', 'delivered', 'cancelled'].includes(order.status.toLowerCase()) && (
                              <Button
                                onClick={() => openCancelDialog(order)}
                                className="bg-red-600 text-white hover:bg-red-700 rounded-xl"
                              >
                                Cancel Order
                              </Button>
                            )}
                          </div>
                          {order.invoiceUrl && (
                            <Button
                              onClick={() => window.open(order.invoiceUrl, '_blank')}
                              variant="outline"
                              className="border-white/10 text-white hover:bg-zinc-800"
                            >
                              View Invoice
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="bg-[#111111] text-white border-white/10 rounded-[2rem] shadow-2xl p-6 sm:max-w-md">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold text-red-500">Cancel Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              <p className="text-zinc-400 text-sm">
                Are you sure you want to cancel Order #{selectedOrder?.orderId}? Please let us know why you're cancelling.
              </p>
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Reason for Cancellation <span className="text-red-500">*</span></label>
                <Select value={cancelReason} onValueChange={setCancelReason}>
                  <SelectTrigger className="w-full bg-[#181818] border-white/10 text-white focus:border-red-500 focus:ring-red-500/20 rounded-xl h-12">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#181818] border-white/10 text-white rounded-xl">
                    {cancelReasons.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value} className="focus:bg-zinc-800 focus:text-white cursor-pointer py-2">
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Additional Description (Optional)</label>
                <Textarea
                  value={cancelDescription}
                  onChange={(e) => setCancelDescription(e.target.value)}
                  placeholder="Provide more details about your cancellation..."
                  className="w-full bg-[#181818] border-white/10 text-white focus:border-red-500 focus:ring-red-500/20 rounded-xl resize-none"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setCancelDialogOpen(false)}
                className="border-white/10 bg-transparent text-white hover:bg-white/5 rounded-xl px-6"
              >
                Keep Order
              </Button>
              <Button
                onClick={handleCancelOrder}
                disabled={!cancelReason || cancelling}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
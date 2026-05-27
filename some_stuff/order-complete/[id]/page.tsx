'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/app/_components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "react-hot-toast";
import { Loader2 } from 'lucide-react';

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
  cancelReason?: string;
  cancelDescription?: string;
}

export default function OrderCompletePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDescription, setCancelDescription] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (user && params.id) {
      fetchOrder();
    }
  }, [user, isLoaded, params.id, router]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      } else {
        router.push('/my-orders');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      router.push('/my-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReason) return;

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancelReason,
          cancelDescription,
        }),
      });

      if (response.ok) {
        toast.success('Order cancelled successfully', { style: { fontSize: '18px' } });
        setSelectedOrder(null);
        setCancelReason('');
        setCancelDescription('');
        fetchOrder(); // Refresh order
      } else {
        toast.error('Failed to cancel order', { style: { fontSize: '18px' } });
      }
    } catch (error) {
      toast.error('Error cancelling order', { style: { fontSize: '18px' } });
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isLoaded || loading) {
    return (
        <div>
          <Navbar />
          <div className="min-h-screen flex items-center justify-center text-white">
            <div>Loading...</div>
          </div>
        </div>
    );
  }

  if (!user || !order) {
    return null; // Will redirect
  }

  return (
    <main>
        <Navbar />
        <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <div className="text-green-400 text-4xl md:text-6xl mb-4">✓</div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Order Completed Successfully!</h1>
            <p className="text-gray-300">Thank you for your purchase</p>
          </div>

          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex justify-between items-center">
                <span>Order Details</span>
                <Badge variant="secondary" className="bg-green-600 text-white">
                  {order.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-300">Order ID:</p>
                  <p className="text-xl font-bold text-green-400">{order.orderId}</p>
                </div>
                <div>
                  <p className="text-gray-300">Total Amount:</p>
                  <p className="text-xl font-bold">₹{Number(order.totalAmount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-300">Razorpay Order ID:</p>
                  <p className="text-sm font-mono">{order.razorpayOrderId}</p>
                </div>
                <div>
                  <p className="text-gray-300">Payment ID:</p>
                  <p className="text-sm font-mono">{order.razorpayPaymentId}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-300">Order Date:</p>
                <p>{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              {order.invoiceUrl && (
                <div className="mt-4">
                  <p className="text-gray-300">Invoice:</p>
                  <Button
                    onClick={() => window.open(order.invoiceUrl, '_blank')}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-gray-600 text-white hover:bg-gray-700"
                  >
                    View Invoice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
                    <div className="flex-shrink-0">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.images[0].altText || item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-600 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-white font-medium">{item.product.name}</h3>
                      {item.variant && (
                        <p className="text-gray-300 text-sm">Variant: {item.variant}</p>
                      )}
                      <p className="text-gray-300 text-sm">Category: {item.product.category.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white">Qty: {item.quantity}</p>
                      <p className="text-white font-medium">₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center space-x-4 mt-8">
            {order.status === 'PENDING' || order.status === 'CONFIRMED' && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    onClick={() => setSelectedOrder(order)}
                  >
                    Cancel Order
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Order</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reason">Reason for cancellation</Label>
                      <Select value={cancelReason} onValueChange={setCancelReason}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="changed-mind">Changed my mind</SelectItem>
                          <SelectItem value="wrong-item">Ordered wrong item</SelectItem>
                          <SelectItem value="delivery-delay">Delivery delay</SelectItem>
                          <SelectItem value="found-better-price">Found better price</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Additional description (optional)</Label>
                      <Textarea
                        id="description"
                        value={cancelDescription}
                        onChange={(e) => setCancelDescription(e.target.value)}
                        placeholder="Provide more details..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(null);
                          setCancelReason('');
                          setCancelDescription('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancelOrder}
                        disabled={!cancelReason || isCancelling}
                      >
                        {isCancelling ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Cancelling...
                          </>
                        ) : (
                          'Confirm Cancellation'
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <Button
              onClick={() => router.push('/my-orders')}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              View All Orders
            </Button>
            <Button onClick={() => router.push('/shop')} className="rounded-xl">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/app/_components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "react-hot-toast";
import { Loader2, Download, Eye } from 'lucide-react';
import BottomNav from '@/app/_components/BottomNav';
import ShiprocketTrackingDisplay from '@/app/_components/ShiprocketTrackingDisplay';

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

interface Address {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  contactNo?: string;
  email?: string;
  [key: string]: any;
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
  paymentMethod?: string;
  address?: Address | string;
  shippingAddress?: Address | string;
  fullName?: string;
  email?: string;
  contactNo?: string;
  phone?: string;
  city?: string;
  state?: string;
  pincode?: string;
  postalCode?: string;
  country?: string;
  awb?: string;
}
const getAddressValue = (
  value?: string | null,
  fallback?: string | null,
  secondFallback?: string | null
) => {
  return value || fallback || secondFallback || "";
};

const formatAddressLine = (addressObj: any) => {
  return [
    addressObj?.city,
    getAddressValue(
      addressObj?.state,
      addressObj?.State,
      addressObj?.region
    ),
    getAddressValue(
      addressObj?.pincode,
      addressObj?.postalCode
    ),
  ]
    .filter(Boolean)
    .join(", ");
};

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
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

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
        toast.success('Order cancelled successfully',{
        style: {
          fontSize: '18px',
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
        setCancelDialogOpen(false);
        setSelectedOrder(null);
        setCancelReason('');
        setCancelDescription('');
        fetchOrder(); // Refresh order
      } else {
        toast.error('Failed to cancel order', { style:{fontSize: '18px', borderRadius: "10px",
          background: "#333",
          color: "#fff",}});
      }
    } catch (error) {
      toast.error('Error cancelling order', { style: { fontSize: '18px', borderRadius: "10px",
          background: "#333",
          color: "#fff", } });
    } finally {
      setIsCancelling(false);
    }
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

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />

        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-5">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#4ca626]/20 border-t-[#4ca626]" />
            <p className="text-lg text-zinc-400">Loading Order Details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !order) {
    return null; // Will redirect
  }

  return (
    <main className="min-h-screen bg-black">
        <Navbar />
        <p></p>
        
        {/* Background Glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-0 h-[500px] w-[500px] rounded-full bg-[#4ca626]/15 blur-3xl" />
          <div className="absolute bottom-0 right-[-10%] h-[500px] w-[500px] rounded-full bg-[#4ca626]/10 blur-3xl" />
        </div>

        <div className="min-h-screen py-8 relative z-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <div className="text-[#4ca626] text-4xl md:text-6xl mb-4">✓</div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Order Completed Successfully!</h1>
            <p className="text-zinc-400">Thank you for your purchase</p>
          </div>

          <Card className="bg-gradient-to-b from-zinc-900 to-black border-white/10 shadow-[0_20px_80px_-20px_rgba(76,166,38,0.2)] mb-6 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex justify-between items-center">
                <span>Order Details</span>
                <Badge variant="outline" className={`${getStatusColor(order.status)}`}>
                  {order.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-4">
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Order ID</p>
                      <p className="text-lg font-bold text-[#4ca626]">{order.orderId}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Total Amount</p>
                      <p className="text-lg font-bold">₹{Number(order.totalAmount).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Order Date</p>
                      <p className="text-white text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Payment Method</p>
                      <p className="text-white text-sm uppercase">{order.paymentMethod || 'Razorpay'}</p>
                    </div>
                  </div>
                  {(order.razorpayOrderId || order.razorpayPaymentId) && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      {order.razorpayOrderId && (
                        <div>
                          <p className="text-zinc-400 text-sm mb-1">Gateway Order ID</p>
                          <p className="text-xs font-mono text-zinc-300 break-all">{order.razorpayOrderId}</p>
                        </div>
                      )}
                      {order.razorpayPaymentId && (
                        <div>
                          <p className="text-zinc-400 text-sm mb-1">Payment ID</p>
                          <p className="text-xs font-mono text-zinc-300 break-all">{order.razorpayPaymentId}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {order.invoiceUrl && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-zinc-400 text-sm mb-3">Invoice Details</p>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => window.open(order.invoiceUrl, '_blank')}
                          variant="outline"
                          size="sm"
                          className="border-white/10 text-white hover:bg-zinc-800 rounded-xl"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Invoice
                        </Button>
                        <Button
                          onClick={() => window.open(`${order.invoiceUrl}?download=`, '_blank')}
                          variant="outline"
                          size="sm"
                          className="border-white/10 text-white hover:bg-zinc-800 rounded-xl"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
              {order.awb && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-zinc-400 text-sm mb-3">Shipment Tracking</p>
                  <div className="bg-[#181818] p-4 rounded-xl border border-white/5">
                    <ShiprocketTrackingDisplay awb={order.awb} />
                  </div>
                </div>
              )}
                </div>

                <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 h-fit">
                  <h3 className="text-white font-semibold mb-4 flex items-center">
                    <span className="bg-[#4ca626] w-2 h-6 rounded-full mr-3"></span>
                    Shipping Address
                  </h3>
                  {(() => {
                    let addr: any = order.shippingAddress || order.address || {};
                    
                    // Safely parse if the API returns stringified JSON
                    if (typeof addr === 'string') {
                      try {
                        addr = JSON.parse(addr);
                        // Occasionally frameworks double-stringify JSON, safeguard against it:
                        if (typeof addr === 'string') addr = JSON.parse(addr);
                      } catch (e) {
                        addr = { address: addr };
                      }
                    }

                    const name = addr.fullName || addr.name || (addr.firstName ? `${addr.firstName} ${addr.lastName || ''}`.trim() : null) || order.fullName;
                    const street = addr.address || addr.addressLine1 || '';
                    const state = addr.state || order.state || addr.State || addr.region || addr.province;
                    const cityStateZip = [
                      addr.city || order.city, 
                      state, 
                      addr.pincode || addr.postalCode || order.pincode || order.postalCode
                    ].filter(Boolean).join(', ');
                    const phone = addr.contactNo || addr.phone || order.contactNo || order.phone || '';
                    const email = addr.email || order.email || '';
                    const country = addr.country || order.country || '';

                    if (!name && !street && !cityStateZip) {
                      return <p className="text-zinc-500 italic text-sm">No shipping details provided.</p>;
                    }

                    return (
                      <div className="text-zinc-300 space-y-2 text-sm">
                        {name && (
                          <p className="font-medium text-white text-base pb-1">
                            {name}
                          </p>
                        )}
                        {street && <p className="whitespace-pre-wrap">{street}</p>}
                        {cityStateZip && <p>{cityStateZip}</p>}
                        {country && <p>{country}</p>}
                        
                        {(phone || email) && (
                          <div className="pt-4 mt-4 border-t border-white/5 space-y-2">
                            {phone && (
                            <p className="flex items-center">
                              <span className="text-zinc-500 w-16">Phone:</span>
                                <span className="text-white font-medium">{phone}</span>
                            </p>
                          )}
                          {email && (
                            <p className="flex items-center">
                              <span className="text-zinc-500 w-16">Email:</span>
                              <span className="text-white font-medium break-all">{email}</span>
                            </p>
                          )}
                        </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-zinc-900 to-black border-white/10 shadow-[0_20px_80px_-20px_rgba(76,166,38,0.2)] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Order Items</CardTitle>
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
            </CardContent>
          </Card>

          <div className="flex justify-center space-x-4 mt-8">
            {!['shipped', 'delivered', 'cancelled'].includes(order.status.toLowerCase()) && (
              <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    onClick={() => setSelectedOrder(order)}
                    className="bg-red-600 text-white hover:bg-red-700 rounded-xl"
                  >
                    Cancel Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#111111] text-white border-white/10 rounded-[2rem] shadow-2xl p-6 sm:max-w-md">
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-bold text-red-500">Cancel Order</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-5">
                    <p className="text-zinc-400 text-sm">
                      Are you sure you want to cancel Order #{selectedOrder?.orderId || order.orderId}? Please let us know why you're cancelling.
                    </p>
                    <div>
                      <Label htmlFor="reason" className="block text-sm font-medium mb-2 text-zinc-300">Reason for Cancellation <span className="text-red-500">*</span></Label>
                      <Select value={cancelReason} onValueChange={setCancelReason}>
                        <SelectTrigger className="w-full bg-[#181818] border-white/10 text-white focus:border-red-500 focus:ring-red-500/20 rounded-xl h-12">
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#181818] border-white/10 text-white rounded-xl">
                          <SelectItem value="changed_mind" className="focus:bg-zinc-800 focus:text-white cursor-pointer py-2">Changed my mind</SelectItem>
                          <SelectItem value="wrong_item" className="focus:bg-zinc-800 focus:text-white cursor-pointer py-2">Ordered wrong item</SelectItem>
                          <SelectItem value="delivery_delay" className="focus:bg-zinc-800 focus:text-white cursor-pointer py-2">Delivery delay</SelectItem>
                          <SelectItem value="found_better_price" className="focus:bg-zinc-800 focus:text-white cursor-pointer py-2">Found better price</SelectItem>
                          <SelectItem value="other" className="focus:bg-zinc-800 focus:text-white cursor-pointer py-2">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description" className="block text-sm font-medium mb-2 text-zinc-300">Additional Description (Optional)</Label>
                      <Textarea
                        id="description"
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
                      onClick={() => {
                        setSelectedOrder(null);
                        setCancelReason('');
                        setCancelDescription('');
                        setCancelDialogOpen(false);
                      }}
                      className="border-white/10 bg-transparent text-white hover:bg-white/5 rounded-xl px-6"
                    >
                      Keep Order
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancelOrder}
                      disabled={!cancelReason || isCancelling}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6"
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
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button
              onClick={() => router.push('/my-orders')}
              variant="outline"
              className="border-white/10 text-white hover:bg-zinc-800 rounded-xl"
            >
              View All Orders
            </Button>
            <Button onClick={() => router.push('/shop')} className="rounded-xl bg-[#4ca626] text-white hover:bg-[#5cbf32]">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
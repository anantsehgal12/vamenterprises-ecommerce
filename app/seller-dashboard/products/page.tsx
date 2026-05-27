'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/app/_components/App-sidebar'
import Header from '@/app/_components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Edit, Trash2, Plus, Search, Inbox, ExternalLink, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { isAdmin } from "@/app/extras/isAdmis"
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation"
import Navbar from '@/app/_components/Navbar'
import Link from 'next/link'
import { toast } from "react-hot-toast"

interface Product {
  id: string
  name: string
  price: string
  taxRate: string
  description: string
  isLive: boolean
  category: { id: string; name: string }
  variants: { name?: string }[]
  images: { id: string; url: string; altText: string }[]
}

export default function ProductsPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?all=true')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete product')
      }
      setProducts(products.filter(product => product.id !== productId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleEdit = (productId: string) => {
    router.push(`/seller-dashboard/edit-product/${productId}`)
  }

  const handleToggleLive = async (productId: string, newIsLive: boolean) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isLive: newIsLive }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error === 'Cannot set product to live when stock is 0') {
          const product = products.find(p => p.id === productId)
          if (product) {
            toast.error(`Due to zero stock, the product "${product.name}" cannot be set to live.`, {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        }},)
          }
        } else {
          throw new Error(errorData.error || 'Failed to update product live status')
        }
        return
      }

      const updatedProduct = await response.json()
      setProducts(products.map(product =>
        product.id === productId ? updatedProduct : product
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isLoaded || !isSignedIn) {
    return (
        <main className="w-full">
          <Navbar/>
          <div className="p-6 mt-30">
            <div className="text-center">Please sign in with the admin account to access the Seller Dashboard.</div>
          </div>
        </main>
    )
  }

  if (!isAdmin(user)) {
    notFound()
  }

  if (loading && isAdmin(user)) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
        <main className="w-full bg-[#0a0a0a] text-white min-h-screen">
          <Header />
          <div className="p-6 text-center text-zinc-400">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#4ca626]" />
            <p className="mt-2">Loading products...</p>
          </div>
        </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (isLoaded && isAdmin(user))
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
      <main className="w-full bg-[#0a0a0a] text-white min-h-screen">
        <Header />
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-5 items-center">
              <Inbox className="text-[#7ddc56]"/>
              <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            </div>
            <Button asChild className="bg-[#4ca626] hover:bg-[#5bbd31] rounded-xl">
              <Link href="/seller-dashboard/add-product">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search products by name, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 rounded-2xl bg-[#181818] border-white/10 focus-visible:ring-[#4ca626]"
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {error}
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <Card className="shadow-lg bg-[#111111] border-white/10 rounded-3xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <p className="text-zinc-500 mb-4">No products found.</p>
                  <Button onClick={() => router.push('/seller-dashboard/add-product')} className="bg-[#4ca626] hover:bg-[#5bbd31] rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total Price</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Live</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const price = parseFloat(product.price);
                      const taxAmount = price * (parseFloat(product.taxRate) / 100);
                      const totalPrice = price + taxAmount;
                      const productImage = product.images?.[0];

                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="w-12 h-12 bg-zinc-800 rounded-md flex items-center justify-center">
                              {productImage ? (
                                <img
                                  src={productImage.url}
                                  alt={productImage.altText || product.name}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              ) : (
                                <Inbox className="h-6 w-6 text-zinc-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{product.name.length > 15 ? `${product.name.substring(0, 15)}....` : product.name}</TableCell>
                          <TableCell className="text-[#7ddc56] font-bold">₹{Math.round(price)}</TableCell>
                          <TableCell className="text-[#7ddc56] font-bold">₹{Math.round(totalPrice)}</TableCell>
                          <TableCell className="text-sm text-zinc-400">{product.description.length > 15 ? `${product.description.substring(0, 15)}....` : product.description}</TableCell>
                          <TableCell className="text-sm text-zinc-400">{product.category.name}</TableCell>
                          <TableCell>
                            <Switch
                              checked={product.isLive}
                              onCheckedChange={(checked) => handleToggleLive(product.id, checked)}
                              aria-label={`Toggle ${product.name} live status`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/shop/${product.id}`}>
                                  <ExternalLink />
                                  View
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(product.id)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the product "{product.name}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f]">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden grid grid-cols-1 gap-4">
              {filteredProducts.map((product) => {
                const price = parseFloat(product.price);
                const taxAmount = price * (parseFloat(product.taxRate) / 100);
                const totalPrice = price + taxAmount;

                // Get the first image from product images
                const productImage = product.images && product.images.length > 0
                  ? product.images[0]
                  : null;

                return (
                  <Card key={product.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-[#111111] border-white/10 rounded-3xl">
                    <CardHeader className="p-0">
                      {productImage && (
                        <div className="w-full aspect-square overflow-hidden rounded-t-lg p-6">
                          <img
                            src={productImage.url}
                            alt={productImage.altText || product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 rounded-md"
                          />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 text-white">
                      <CardTitle className="text-lg font-semibold mb-2 line-clamp-2">{product.name}</CardTitle>
                      <p className="text-sm text-zinc-400 mb-3 line-clamp-3">{product.description}</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-500">Price:</span>
                          <span className="text-[#7ddc56] font-bold">₹{price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-500">Total:</span>
                          <span className="text-[#7ddc56] font-bold">₹{totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">
                          {product.category.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">Live:</span>
                          <Switch
                            checked={product.isLive}
                            onCheckedChange={(checked) => handleToggleLive(product.id, checked)}
                            aria-label={`Toggle ${product.name} live status`}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs text-zinc-500">Live:</span>
                          <Switch
                            checked={product.isLive}
                            onCheckedChange={(checked) => handleToggleLive(product.id, checked)}
                            aria-label={`Toggle ${product.name} live status`}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm" className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f] flex-1"
                          onClick={() => handleEdit(product.id)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 flex-1">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#111111] border-white/10 text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the product "{product.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f]">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            </>
          )}
        </div>
      </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

"use client";

import { useState, useEffect } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/admin/App-sidebar";
import Header from "@/app/_components/admin/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, Plus, Search, Megaphone, Loader2, Calendar } from "lucide-react";
import { isAdmin } from "@/app/extras/isAdmis";
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import Navbar from "@/app/_components/home/Navbar";
import { toast } from "react-hot-toast";
import RefreshButton from "@/app/_components/admin/RefreshApis";

interface Announcement {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", message: "" });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch("/api/announcement");
      if (!response.ok) {
        throw new Error("Failed to fetch announcements");
      }
      const data = await response.json();
      // Sort by newest first
      const sorted = data.sort((a: Announcement, b: Announcement) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAnnouncements(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setFormData({ name: "", message: "" });
    setIsAddOpen(true);
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({ name: announcement.name, message: announcement.message });
    setIsEditOpen(true);
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.message) {
      toast.error("Name and message are required.", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    try {
      const response = await fetch("/api/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to create announcement");
      
      const newAnnouncement = await response.json();
      setAnnouncements([newAnnouncement, ...announcements]);
      setIsAddOpen(false);
      toast.success("Announcement created!", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleEdit = async () => {
    if (!formData.name || !formData.message) {
      toast.error("Name and message are required.", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    try {
      const response = await fetch("/api/announcement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...formData }),
      });
      if (!response.ok) throw new Error("Failed to update announcement");
      
      const updatedAnnouncement = await response.json();
      setAnnouncements(
        announcements.map((a) => (a.id === editingId ? updatedAnnouncement : a))
      );
      setIsEditOpen(false);
      setEditingId(null);
      toast.success("Announcement updated!", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/announcement?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete announcement");
      }
      setAnnouncements(announcements.filter((a) => a.id !== id));
      toast.success("Announcement deleted", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const filteredAnnouncements = announcements.filter(
    (announcement) =>
      announcement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoaded || !isSignedIn) {
    return (
      <main className="w-full">
        <Navbar />
        <div className="p-6 mt-30">
          <div className="text-center">
            Please sign in with the admin account to access the Seller Dashboard.
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin(user)) {
    notFound();
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
              <p className="mt-2">Loading announcements...</p>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
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
                  <Megaphone className="text-[#7ddc56]" />
                  <h1 className="text-3xl font-bold tracking-tight">
                    Announcements
                  </h1>
                </div>
                
                <section className="inline-flex gap-5">
                   <RefreshButton />
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={openAddDialog}
                      className="bg-[#4ca626] hover:bg-[#5bbd31] rounded-xl"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#111111] border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle>Create New Announcement</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Announcement Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="bg-[#181818] border-white/10"
                          placeholder="E.g., Holiday Sale!"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="message">Message</Label>
                        <textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="flex min-h-[120px] w-full rounded-md border border-white/10 bg-[#181818] px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Enter the details of your announcement here..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f]" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                      <Button onClick={handleAdd} className="bg-[#4ca626] hover:bg-[#5bbd31]">Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                </section>
              </div>

              <div className="mb-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search announcements by name or message..."
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

              {/* Edit Dialog - Rendered once and controlled via state */}
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-[#111111] border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle>Edit Announcement</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-name">Announcement Name</Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-[#181818] border-white/10"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-message">Message</Label>
                      <textarea
                        id="edit-message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="flex min-h-[120px] w-full rounded-md border border-white/10 bg-[#181818] px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f]" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                    <Button onClick={handleEdit} className="bg-[#4ca626] hover:bg-[#5bbd31]">Save Changes</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {filteredAnnouncements.length === 0 ? (
                <Card className="shadow-lg bg-[#111111] border-white/10 rounded-3xl">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <p className="text-zinc-500 mb-4">No announcements found.</p>
                      <Button
                        onClick={openAddDialog}
                        className="bg-[#4ca626] hover:bg-[#5bbd31] rounded-xl"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create One Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Desktop View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Name</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead className="w-[150px]">Created Date</TableHead>
                          <TableHead className="w-[150px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAnnouncements.map((ann) => (
                          <TableRow key={ann.id}>
                            <TableCell className="font-medium">{ann.name}</TableCell>
                            <TableCell className="text-sm text-zinc-400 max-w-xs">
                              <div 
                                className="line-clamp-2"
                                dangerouslySetInnerHTML={{ __html: ann.message }}
                              />
                            </TableCell>
                            <TableCell className="text-sm text-zinc-400">
                              {new Date(ann.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f]" onClick={() => openEditDialog(ann)}>
                                  <Edit className="h-4 w-4 mr-1" /> Edit
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-900/10 border-white/10 bg-[#181818]">
                                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-[#111111] border-white/10 text-white">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-zinc-400">
                                        This will permanently delete the announcement "{ann.name}".
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f]">Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(ann.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Mobile View */}
                  <div className="md:hidden grid grid-cols-1 gap-4">
                    {filteredAnnouncements.map((ann) => (
                      <Card key={ann.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-[#111111] border-white/10 rounded-3xl">
                        <CardContent className="p-5 text-white">
                          <CardTitle className="text-lg font-semibold mb-2 line-clamp-2 text-[#7ddc56]">
                            {ann.name}
                          </CardTitle>
                          <div 
                            className="text-sm text-zinc-400 mb-4 line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: ann.message }}
                          />
                          <div className="flex items-center text-xs text-zinc-500 mb-4">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f] flex-1" onClick={() => openEditDialog(ann)}>
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 flex-1">
                                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#111111] border-white/10 text-white">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete "{ann.name}"?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-zinc-400">
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-white/10 bg-[#181818] hover:bg-[#1f1f1f]">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(ann.id)} className="bg-red-600 hover:bg-red-700 text-white">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
}
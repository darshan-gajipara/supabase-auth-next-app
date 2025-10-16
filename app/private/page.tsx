/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface Book {
  id: number;
  title: string;
  author: string;
  publish_year: number;
  description: string;
}

export default function BookManager() {
  const supabase = createClient();

  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState({
    title: "",
    author: "",
    publish_year: "",
    description: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  // 🔹 Fetch books
  const fetchBooks = async () => {
    const { data, error } = await supabase.from("books").select("*").order("id");
    if (error) console.error(error);
    else setBooks(data || []);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // 🔹 Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // 🔹 Open Add Dialog
  const openAddDialog = () => {
    setForm({ title: "", author: "", publish_year: "", description: "" });
    setEditingId(null);
    setDialogOpen(true);
  };

  // 🔹 Open Edit Dialog
  const openEditDialog = (book: Book) => {
    setForm({
      title: book.title,
      author: book.author,
      publish_year: book.publish_year.toString(),
      description: book.description,
    });
    setEditingId(book.id);
    setDialogOpen(true);
  };

  // 🔹 Add or Update Book
  const saveBook = async () => {
    const { title, author, publish_year, description } = form;
    if (!title || !author) return alert("Title and Author are required.");

    if (editingId) {
      // Update
      const { error } = await supabase
        .from("books")
        .update({ title, author, publish_year: +publish_year, description })
        .eq("id", editingId);
      if (error) console.error(error);
    } else {
      // Add
      const { error } = await supabase
        .from("books")
        .insert([{ title, author, publish_year: +publish_year, description }]);
      if (error) console.error(error);
    }

    setDialogOpen(false);
    fetchBooks();
  };

  // 🔹 Handle Delete Confirmation
  const confirmDelete = (book: Book) => {
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  };

  // 🔹 Delete Book
  const deleteBook = async () => {
    if (!bookToDelete) return;
    const { error } = await supabase.from("books").delete().eq("id", bookToDelete.id);
    if (error) console.error(error);
    setDeleteDialogOpen(false);
    setBookToDelete(null);
    fetchBooks();
  };

  return (
    <div className="flex flex-col items-center gap-6 p-10">
      <Card className="w-full max-w-2xl shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Book List</CardTitle>
          <Button onClick={openAddDialog}>+ Add Book</Button>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {books.length === 0 && (
            <p className="text-gray-500">No books available.</p>
          )}
          {books.map((book) => (
            <div
              key={book.id}
              className="flex justify-between items-start border-b pb-2"
            >
              <div>
                <p className="font-semibold">{book.title}</p>
                <p className="text-sm text-gray-600">
                  {book.author} • {book.publish_year}
                </p>
                <p className="text-sm">{book.description}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(book)}>
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDelete(book)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 🔹 Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Book" : "Add New Book"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <Input
              placeholder="Book Title"
              name="title"
              value={form.title}
              onChange={handleChange}
            />
            <Input
              placeholder="Author"
              name="author"
              value={form.author}
              onChange={handleChange}
            />
            <Input
              placeholder="Publish Year"
              name="publish_year"
              type="number"
              value={form.publish_year}
              onChange={handleChange}
            />
            <Textarea
              placeholder="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveBook}>
              {editingId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔹 Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this book?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The book “{bookToDelete?.title}” will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={deleteBook} className="bg-destructive text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

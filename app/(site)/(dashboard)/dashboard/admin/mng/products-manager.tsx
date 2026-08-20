"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Plus,
  PinIcon,
  EyeIcon,
  ArrowDownLeftFromSquareIcon,
} from "lucide-react";
import PhonecaseCard from "@/components/phonecaseCard";
import PosterCard from "@/components/poster-card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  image_url: string;
  type: "phonecase" | "poster";
  feed: boolean;
  pin: boolean;
  created_at: string;
}

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    image_url: "",
    type: "phonecase" as "phonecase" | "poster",
    feed: false,
    pin: false,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data || []);
    } catch (error) {
      console.error("[v0] Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const res = await fetch("/api/admin/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...formData }),
        });
        if (!res.ok) throw new Error("Failed to update product");
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Failed to create product");
      }

      setIsDialogOpen(false);
      setFormData({
        name: "",
        image_url: "",
        type: "phonecase",
        feed: false,
        pin: false,
      });
      setEditingId(null);
      await fetchProducts();
    } catch (error) {
      console.error("[v0] Error saving product:", error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      image_url: product.image_url,
      type: product.type,
      feed: product.feed,
      pin: product.pin,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("آیا مطمئن هستید؟")) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast({
          title: "حذف نشد!",
          variant: "destructive",
        });
      } else {
        toast({
          title: "حذف شد",
        });
      }
      await fetchProducts();
    } catch (error: any) {
      toast({
        title: "حذف نشد!",
        description: error?.message,
      });
    } finally {
      setIsDialogOpen(false);
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      name: "",
      image_url: "",
      type: "phonecase",
      feed: false,
      pin: false,
    });
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2 font-semibold mb-4">
        <p>محصولات ({products.length})</p>
      </div>
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          در حال بارگذاری...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              محصولی وجود ندارد
            </p>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                onClick={() => handleEdit(product)}
                className="
                flex items-center gap-4 p-3 border rounded-xl bg-card cursor-pointer"
              >
                {/* content */}
                <div className="flex flex-col justify-between h-full flex-1">
                  <div className="flex flex-col">
                    {/* name */}
                    <p className="font-medium">{product.name}</p>

                    {/* type */}
                    <p className="text-sm text-muted-foreground">
                      {product.type === "phonecase" ? "قاب موبایل" : "پوستر"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/${product.type}/${product.id}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        className="pointer-events-none"
                        variant={"outline"}
                        size={"icon-xs"}
                      >
                        <ArrowDownLeftFromSquareIcon />
                      </Button>
                    </Link>
                    {product.pin && (
                      <Button
                        className="pointer-events-none"
                        variant={"outline"}
                        size={"icon-xs"}
                      >
                        <PinIcon />
                      </Button>
                    )}
                    {!product.feed && (
                      <Button
                        className="pointer-events-none relative"
                        variant={"outline"}
                        size={"icon-xs"}
                      >
                        <div className="absolute h-px w-4 -rotate-45 bg-white"></div>
                        <EyeIcon />
                      </Button>
                    )}
                  </div>
                </div>

                {/* image */}
                <div className="w-20 shrink-0 flex items-center justify-center pointer-events-none">
                  {product.type === "phonecase" ? (
                    <PhonecaseCard
                      size="small"
                      quality="low"
                      image_url={product.image_url}
                      className="w-full"
                    />
                  ) : (
                    <PosterCard
                      size="small"
                      quality="low"
                      image_url={product.image_url}
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "ویرایش محصول" : "محصول جدید"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">نام محصول</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="مثال: iPhone 15"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">نوع</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    type: value as "phonecase" | "poster",
                  })
                }
              >
                <SelectTrigger
                  id="type"
                  dir="rtl"
                  className="bg-input/40 dark:bg-input/30"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="phonecase">قاب موبایل</SelectItem>
                  <SelectItem value="poster">پوستر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="feed"
                checked={formData.feed}
                onChange={(e) =>
                  setFormData({ ...formData, feed: e.target.checked })
                }
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="feed" className="font-normal">
                نمایش در فید
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pin"
                checked={formData.pin}
                onChange={(e) =>
                  setFormData({ ...formData, pin: e.target.checked })
                }
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="pin" className="font-normal">
                پین بشه؟
              </Label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleDelete(editingId || "")}
              >
                <Trash2 />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                انصراف
              </Button>
              <Button type="submit">ذخیره</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

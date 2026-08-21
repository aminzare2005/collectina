"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { TomanIcon } from "@/components/ui/toman-icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Edit2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Poster {
  id: string;
  attribute: string;
  price: number;
  available: boolean;
  created_at: string;
}

export default function PostersManager() {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    attribute: "",
    price: "",
    available: true,
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchPosters();
  }, []);

  const fetchPosters = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/posters");
      if (!res.ok) throw new Error("Failed to fetch posters");
      const data = await res.json();
      setPosters(data || []);
    } catch (error) {
      console.error("[v0] Error fetching posters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        id: formData.id,
        attribute: formData.attribute,
        price: parseFloat(formData.price),
        available: formData.available,
      };

      if (editingId) {
        const res = await fetch("/api/admin/posters", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        if (!res.ok) throw new Error("Failed to update poster");
      } else {
        const res = await fetch("/api/admin/posters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create poster");
      }

      setIsDialogOpen(false);
      setFormData({
        id: "",
        attribute: "",
        price: "",
        available: true,
      });
      setEditingId(null);
      await fetchPosters();
    } catch (error) {
      console.error("[v0] Error saving poster:", error);
    }
  };

  const handleEdit = (poster: Poster) => {
    setEditingId(poster.id);
    setFormData({
      id: poster.id,
      attribute: poster.attribute,
      price: poster.price.toString(),
      available: poster.available,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("آیا مطمئن هستید؟")) return;

    try {
      const res = await fetch(`/api/admin/posters?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast({
          title: "حذف نشد!",
        });
      }
      await fetchPosters();
    } catch (error) {
      console.error("[v0] Error deleting poster:", error);
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      id: "",
      attribute: "",
      price: "",
      available: true,
    });
    setIsDialogOpen(true);
  };

  return (
    <>
      <div>
        <div className="flex items-center gap-2 font-semibold mb-4">
          <p>پوستر ({posters.length})</p>
          <Button onClick={handleAddNew} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            جدید
          </Button>
        </div>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            در حال بارگذاری...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {posters.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                پوستری وجود ندارد
              </p>
            ) : (
              posters.map((poster) => (
                <div
                  key={poster.id}
                  onClick={() => handleEdit(poster)}
                  dir="ltr"
                  className="flex items-center cursor-pointer justify-between p-3 border rounded-lg bg-card"
                >
                  <div className="flex-1 min-w-0 text-center -mt-1">
                    <p className="font-medium">{poster.attribute}</p>
                    <div className="flex mt-2 md:flex-row flex-col justify-center items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className={
                          poster.available
                            ? "hidden"
                            : "text-red-600"
                        }
                      >
                        {poster.available ? "موجود" : "ناموجود"}
                      </span>
                      {poster.available && (
                        <span className="inline-flex items-center gap-1"><span>{poster.price.toLocaleString()}</span><TomanIcon className="size-3" /></span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "ویرایش پوستر" : "پوستر جدید"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="attribute">صفت/نام</Label>
              <Input
                id="attribute"
                value={formData.attribute}
                onChange={(e) =>
                  setFormData({ ...formData, attribute: e.target.value })
                }
                placeholder="مثال: پوستر تیم ملی"
                required
              />
            </div>

            <div>
              <Label htmlFor="price" className="inline-flex items-center gap-1">قیمت (<TomanIcon className="size-3" />)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="0"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="available"
                checked={formData.available}
                onChange={(e) =>
                  setFormData({ ...formData, available: e.target.checked })
                }
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="available" className="font-normal">
                موجود است
              </Label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant={"destructive"}
                onClick={() => {
                  setIsDialogOpen(false);
                  handleDelete(formData.id);
                }}
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

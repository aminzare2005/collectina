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
import { Trash2, Edit2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhoneCase {
  id: string;
  brand: string;
  model: string;
  price: number;
  available: boolean;
  created_at: string;
}

export default function PhoneCasesManager() {
  const [cases, setCases] = useState<PhoneCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    brand: "",
    model: "",
    price: "",
    available: true,
  });

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/phone-cases");
      if (!res.ok) throw new Error("Failed to fetch phone cases");
      const data = await res.json();
      setCases(data || []);
    } catch (error) {
      console.error("[v0] Error fetching phone cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        id: formData.id,
        brand: formData.brand,
        model: formData.model,
        price: parseFloat(formData.price),
        available: formData.available,
      };

      if (editingId) {
        const res = await fetch("/api/admin/phone-cases", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        if (!res.ok) throw new Error("Failed to update phone case");
      } else {
        const res = await fetch("/api/admin/phone-cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create phone case");
      }

      setIsDialogOpen(false);
      setFormData({
        id: "",
        brand: "",
        model: "",
        price: "",
        available: true,
      });
      setEditingId(null);
      await fetchCases();
    } catch (error) {
      console.error("[v0] Error saving phone case:", error);
    }
  };

  const handleEdit = (phoneCase: PhoneCase) => {
    setEditingId(phoneCase.id);
    setFormData({
      id: phoneCase.id,
      brand: phoneCase.brand,
      model: phoneCase.model,
      price: phoneCase.price.toString(),
      available: phoneCase.available,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("آیا مطمئن هستید؟")) return;

    try {
      const res = await fetch(`/api/admin/phone-cases?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete phone case");
      await fetchCases();
    } catch (error) {
      console.error("[v0] Error deleting phone case:", error);
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      id: "",
      brand: "",
      model: "",
      price: "",
      available: true,
    });
    setIsDialogOpen(true);
  };

  return (
    <>
      <div>
        <div className="flex items-center gap-2 font-semibold mb-4">
          <p>قاب موبایل ({cases.length})</p>
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
            {cases.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                قاب موبایلی وجود ندارد
              </p>
            ) : (
              cases.map((phoneCase) => (
                <div
                  key={phoneCase.id}
                  onClick={() => handleEdit(phoneCase)}
                  dir="ltr"
                  className="flex items-center cursor-pointer justify-between p-3 border rounded-lg bg-card"
                >
                  <div className="flex-1 min-w-0 text-center -mt-1">
                    <span className="font-mono text-xs opacity-70">
                      {phoneCase.brand}
                    </span>
                    <p className="font-medium">{phoneCase.model}</p>
                    <div className="flex mt-2 md:flex-row flex-col justify-center items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className={
                          phoneCase.available ? "hidden" : "text-red-600"
                        }
                      >
                        {phoneCase.available ? "موجود" : "ناموجود"}
                      </span>
                      {phoneCase.available && (
                        <span>{phoneCase.price.toLocaleString()} تومان</span>
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
              {editingId ? "ویرایش قاب موبایل" : "قاب موبایل جدید"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Label>برند</Label>
            <Select
              value={formData.brand}
              onValueChange={(val) => setFormData({ ...formData, brand: val })}
            >
              <SelectTrigger dir="rtl" className="bg-input/40 dark:bg-input/30">
                <SelectValue placeholder="برند گوشی رو انتخاب کن" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="Samsung">سامسونگ</SelectItem>
                <SelectItem value="Xiaomi">شیاومی</SelectItem>
                <SelectItem value="Huawei">هواوی</SelectItem>
                <SelectItem value="iPhone">آیفون</SelectItem>
              </SelectContent>
            </Select>

            <div>
              <Label htmlFor="model">مدل</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="مثال: iPhone 15 Pro"
                required
              />
            </div>

            <div>
              <Label htmlFor="price">قیمت (تومان)</Label>
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

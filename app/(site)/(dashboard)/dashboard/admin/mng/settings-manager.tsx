"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

type Settings = {
  id?: number;
  post_price: string;
  top_banner: string;
  show_phonecase: boolean;
  show_poster: boolean;
};

export default function SettingsManager() {
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<number | null>(null);

  const [formData, setFormData] = useState<Settings>({
    post_price: "",
    top_banner: "",
    show_phonecase: true,
    show_poster: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettingsId(data.id);
        setFormData({
          post_price: data.post_price.toString(),
          top_banner: data.top_banner || "",
          show_phonecase: data.show_phonecase,
          show_poster: data.show_poster,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        post_price: parseFloat(formData.post_price),
        top_banner: formData.top_banner,
        show_phonecase: formData.show_phonecase,
        show_poster: formData.show_poster,
      };

      if (settingsId) {
        const { error } = await supabase
          .from("settings")
          .update(payload)
          .eq("id", settingsId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("settings")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        setSettingsId(data.id);
      }

      toast({
        title: "ذخیره شد",
      });
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>قیمت پست</Label>
          <Input
            type="number"
            dir="ltr"
            value={formData.post_price}
            onChange={(e) =>
              setFormData({ ...formData, post_price: e.target.value })
            }
          />
        </div>

        <div>
          <Label>متن بنر بالای سایت</Label>
          <Textarea
            value={formData.top_banner}
            className="h-18 resize-none"
            onChange={(e) =>
              setFormData({ ...formData, top_banner: e.target.value })
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              id="phonecase"
              type="checkbox"
              checked={formData.show_phonecase}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  show_phonecase: e.target.checked,
                })
              }
            />
            <Label htmlFor="phonecase" className="font-normal">
              فروش قاب
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="poster"
              type="checkbox"
              checked={formData.show_poster}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  show_poster: e.target.checked,
                })
              }
            />
            <Label htmlFor="poster" className="font-normal">
              فروش پوستر
            </Label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit">ذخیره تنظیمات</Button>
        </div>
      </form>
    </div>
  );
}

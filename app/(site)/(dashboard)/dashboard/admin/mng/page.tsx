"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProductsManager from "./products-manager";
import PhoneCasesManager from "./phone-cases-manager";
import PostersManager from "./posters-manager";
import { notFound } from "next/navigation";
import SettingsManager from "./settings-manager";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AdminMngPage() {
  const [user, setUser] = useState<{ phoneNumber?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "products" | "phone-cases" | "posters" | "settings"
  >("products");

  useEffect(() => {
    const checkUser = async () => {
      const { data: session } = await authClient.getSession();
      setUser(session?.user as { phoneNumber?: string } | null);
      setLoading(false);
    };
    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      </div>
    );
  }

  if (!user || user.phoneNumber !== process.env.NEXT_PUBLIC_ADMIN_PHONE_NUMBER) {
    return notFound();
  }

  return (
    <>
      <div className="flex gap-2 border-b pb-2">
        <Link href={"/dashboard/admin"}>
          <Button variant={"outline"} size="icon-sm">
            <ArrowRight />
          </Button>
        </Link>
        <Button
          variant={activeTab === "products" ? "outline" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("products")}
        >
          لیست
        </Button>
        <Button
          variant={activeTab === "phone-cases" ? "outline" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("phone-cases")}
        >
          قاب
        </Button>
        <Button
          variant={activeTab === "posters" ? "outline" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("posters")}
        >
          پوستر
        </Button>
        <Button
          variant={activeTab === "settings" ? "outline" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("settings")}
        >
          تنظیمات
        </Button>
      </div>

      <div className="mt-6">
        {activeTab === "products" && <ProductsManager />}
        {activeTab === "phone-cases" && <PhoneCasesManager />}
        {activeTab === "posters" && <PostersManager />}
        {activeTab === "settings" && <SettingsManager />}
      </div>
    </>
  );
}

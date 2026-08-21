"use client"

import { toastManager } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"

export default function ToastTestPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-md space-y-8">
        <h1 className="text-xl font-bold text-foreground">تست توست‌ها</h1>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">وضعیت‌ها</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toastManager.add({
                  title: "عملیات موفق",
                  description: "تغییرات با موفقیت ذخیره شد",
                  type: "success",
                })
              }
            >
              Success
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toastManager.add({
                  title: "خطا رخ داد",
                  description: "مشکلی در اتصال به سرور پیش آمد",
                  type: "error",
                })
              }
            >
              Error
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toastManager.add({
                  title: "هشدار",
                  description: "موجودی محصول رو به اتمام است",
                  type: "warning",
                })
              }
            >
              Warning
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toastManager.add({
                  title: "اطلاعات",
                  description: "نسخه جدید برنامه منتشر شد",
                  type: "info",
                })
              }
            >
              Info
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toastManager.add({
                  title: "در حال پردازش",
                  type: "loading",
                })
              }
            >
              Loading
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">بدون آیکون</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toastManager.add({
                title: "فقط عنوان",
              })
            }
          >
            Default
          </Button>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">وariant X</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toastManager.add({
                  title: "کپی شد",
                  description: "لینک در حافظه کپی شد",
                  type: "success",
                  data: { variant: "x" },
                })
              }
            >
              X - Success
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toastManager.add({
                  title: "خطا",
                  description: "عملیات ناموفق بود",
                  type: "error",
                  data: { variant: "x" },
                })
              }
            >
              X - Error
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">تعداد زیاد</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toastManager.add({ title: "توست اول", type: "info" })
              toastManager.add({ title: "توست دوم", type: "success" })
              toastManager.add({ title: "توست سوم", type: "warning" })
            }}
          >
            ۳ توست پشت سر هم
          </Button>
        </section>
      </div>
    </div>
  )
}

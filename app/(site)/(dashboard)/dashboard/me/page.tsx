import { LogoutButton } from "@/components/logout-button";
import { ProfileForm } from "@/components/profile-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return;
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return (
    <div className="flex flex-col gap-4">
      <ProfileForm profile={profile} />
      {/* danger zone ? */}
      <section className="flex flex-col gap-4">
        <Card className="bg-red-500/10 border border-red-500/20 shadow-xl rounded-xl overflow-hidden">
          <CardContent className="text-center">
            <div className="flex items-center gap-2 justify-between">
              <div className="text-start">
                <p className="font-semibold">خروج از حساب کاربری</p>
                <p className="text-sm font-light">
                  بعد از خروج، برای استفاده از وبسایت باید دوباره لاگین کنی!
                </p>
              </div>
              <LogoutButton />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

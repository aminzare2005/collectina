import React from "react";
import { Button } from "./ui/button";
import { DownloadCloudIcon } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Props = {
  id: string;
  image_url: string;
  product_type: "phonecase" | "poster"
};
async function AdminBar(props: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.phone !== process.env.NEXT_PUBLIC_ADMIN_PHONE_NUMBER) {
    return;
  }

  return (
    <div className="h-[50dvh] flex z-50 justify-start items-center top-0 right-0 fixed">
      <div className="bg-card flex flex-col gap-2 border border-r-0 rounded-l-md">
        <Link
          href={`/dashboard/mockup?image_url=${props.image_url}&id=${props.id}&type=${props.product_type}`}
        >
          <Button variant="ghost">
            <DownloadCloudIcon />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default AdminBar;

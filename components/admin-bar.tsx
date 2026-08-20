import React from "react";
import { Button } from "./ui/button";
import { DownloadCloudIcon } from "lucide-react";
import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/auth-helpers";

type Props = {
  id: string;
  image_url: string;
  product_type: "phonecase" | "poster"
};
async function AdminBar(props: Props) {
  const user = await getCurrentUser();
  const admin = await isAdmin(user);

  if (!user || !admin) {
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

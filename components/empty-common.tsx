"use client";

import { CctvIcon, RefreshCcwIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "./ui/empty";
import { ReactElement } from "react";
import { useRouter } from "next/navigation";

type Props = {
  title?: string;
  description?: string;
  button?: string;
  isButton?: boolean;
  buttonIcon?: ReactElement;
  icon?: ReactElement;
};

function EmptyCommon(props: Props) {
  const router = useRouter();
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">{props.icon || <CctvIcon />}</EmptyMedia>
        <EmptyTitle>{props.title || "یه مشکلی پیش اومده!"}</EmptyTitle>
        <EmptyDescription>
          {(props.description && props.description) ||
            "نتونستیم دیتا رو بگیریم. صفحه رو ریفرش کن و دوباره امتحان کن"}
        </EmptyDescription>
        {props.isButton && (
          <Button onClick={() => router.push("/")} variant="outline" size="sm">
            {props.button || "ریفرش"}
            {props.buttonIcon || <RefreshCcwIcon />}
          </Button>
        )}
      </EmptyHeader>
    </Empty>
  );
}

export default EmptyCommon;

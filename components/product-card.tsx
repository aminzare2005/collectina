"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ProductCardProps {
  id: string
  name: string
  image_url: string
  description?: string
}

export function ProductCard({ id, name, image_url, description }: ProductCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/products/${id}`}>
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={image_url || "/placeholder.svg"}
            alt={name}
            fill
            className="object-cover transition-transform hover:scale-105"
          />
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/products/${id}`}>
          <h3 className="mb-2 text-lg font-semibold leading-tight hover:text-primary">{name}</h3>
        </Link>
        {description && <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" asChild>
          <Link href={`/products/${id}`}>مشاهده و انتخاب مدل</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

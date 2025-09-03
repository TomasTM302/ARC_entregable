"use client"

import Image from "next/image"
import Link from "next/link"

interface ServiceCardProps {
  image: string
  href: string
  width?: number
  height?: number
  onClick?: () => void
}

export default function ServiceCard({ image, href, width = 150, height = 150, onClick }: ServiceCardProps) {
  const CardContent = () => (
    <Image
      src={image || "/placeholder.svg"}
      alt=""
      width={width}
      height={height}
      className="object-contain w-full h-auto max-w-[150px] md:max-w-[250px]"
      priority
    />
  )

  return (
    <div className="flex items-center justify-center p-2">
      {onClick ? (
        <button onClick={onClick} className="cursor-pointer">
          <CardContent />
        </button>
      ) : (
        <Link href={href}>
          <CardContent />
        </Link>
      )}
    </div>
  )
}

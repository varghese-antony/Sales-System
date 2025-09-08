import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"

export function ProductCard(props) {
  return (
    <Link href={props.link}>
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Image src="/next.svg" alt="Product Image" width={200} height={200} />
      </CardContent>
    </Card>
    </Link>
  )
}

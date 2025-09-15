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
    <Link href={props.link} className="block">
    <Card className="w-full max-w-sm transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105">
      <CardHeader className="bg-blue-500 text-white p-4 rounded-t-lg">
        <CardTitle className="text-2xl font-semibold text-center">{props.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex justify-center items-center bg-white rounded-b-lg">
        <Image src="/next.svg" alt="Product Image" width={200} height={200} className="rounded-md" />
      </CardContent>
    </Card>
    </Link>
  )
}

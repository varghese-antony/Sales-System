import { ProductCard } from "@/components/ProductCard"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function Indoor() {
  return (
    <div className='container mx-auto'>
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue="item-1"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>Bulb</AccordionTrigger>
        <AccordionContent className="flex gap-4 flex-wrap text-balance">
          <ProductCard title="Bulb" link="/indoor/bulb" />
          <ProductCard title="Bulb" link="/indoor/bulb" />
          <ProductCard title="Bulb" link="/indoor/bulb" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Lamp</AccordionTrigger>
        <AccordionContent className="flex gap-4 text-balance">
          <ProductCard title="Lamp" link="/indoor/lamp" />
          <ProductCard title="Lamp" link="/indoor/lamp" />      
          <ProductCard title="Lamp" link="/indoor/lamp" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3" >
        <AccordionTrigger>Ceiling Lights</AccordionTrigger>
        <AccordionContent className="flex gap-4 text-balance">
          <ProductCard title="Ceiling Light" link="/indoor/ceiling-light" />
          <ProductCard title="Ceiling Light" link="/indoor/ceiling-light" />
          <ProductCard title="Ceiling Light" link="/indoor/ceiling-light" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    </div>
  )
}

import { ProductCard } from "@/components/ProductCard";

export default function Home() {
  return (
    <div className="mx-auto container p-10 bg-gray-50 rounded-2xl grid grid-cols-2 gap-10">
      <ProductCard
        title={"Indoor Products"}
        link={`/indoor`}
      />
      <ProductCard
        title={"Outdoor Products"}
        link={`/outdoor`}
      />
    </div>
  );
}

import { ProductCard } from "@/components/ProductCard";

export default function Home() {
  return (
    <div className="mx-auto container p-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-2 gap-10">
      <h1 className="col-span-full text-4xl font-bold text-center mb-8">Welcome to our Lighting Catalogue</h1>
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

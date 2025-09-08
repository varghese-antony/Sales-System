export default function OutdoorProductPage({ params }) {
  // You can fetch product data here based on params.slug
  return (
    <div>
      <h1>Outdoor Product: {params.slug}</h1>
      {/* Product details here */}
    </div>
  );
}

export async function generateStaticParams() {
  // You can fetch product slugs from your data source
  const productSlugs = ['bulb', 'lamp', 'ceiling-light']; // Example slugs

  return productSlugs.map((slug) => ({
    slug,
  }));
}
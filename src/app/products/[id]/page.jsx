import { notFound } from 'next/navigation';
import { getProductByIdV2 } from '@/lib/database/products-v2';
import { ProductDetails } from '@/components/ProductDetails';

export default async function ProductPage({ params, searchParams }) {
  const { id } = params;
  const { productId } = searchParams; // optional override

  // If the route already contains a UUID, use it; otherwise fall back to query
  const targetId = isValidUUID(id) ? id : productId;
  if (!targetId) notFound();

  // Try both tables – we don’t know which one until we hit the DB
  const [indoorRes, outdoorRes] = await Promise.allSettled([
    getProductByIdV2('indoor', targetId),
    getProductByIdV2('outdoor', targetId),
  ]);

  const product =
    indoorRes.status === 'fulfilled' && indoorRes.value.data
      ? { ...indoorRes.value.data, type: 'indoor' }
      : outdoorRes.status === 'fulfilled' && outdoorRes.value.data
      ? { ...outdoorRes.value.data, type: 'outdoor' }
      : null;

  if (!product) notFound();

  // ProductDetails expects an onBack callback – we supply a simple browser back
  return <ProductDetails product={product} onBack={() => window.history.back()} />;
}

// Helper copied from products-v2.js to avoid extra import churn
function isValidUUID(uuid) {
  if (typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
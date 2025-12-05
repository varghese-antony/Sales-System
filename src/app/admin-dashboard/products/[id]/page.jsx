'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProductByIdV2 } from '@/lib/database/products-v2';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdminProductPage({ params, searchParams }) {
  const router = useRouter();

  // Unwrap Promises (Next.js 15 dynamic API)
  const { id } = use(params);
  const { productId } = use(searchParams);

  const targetId = isValidUUID(id) ? id : productId;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) {
      router.replace('/admin-dashboard/enquiry-management');
      return;
    }

    Promise.allSettled([
      getProductByIdV2('indoor', targetId),
      getProductByIdV2('outdoor', targetId),
    ]).then(([indoorRes, outdoorRes]) => {
      const found =
        indoorRes.status === 'fulfilled' && indoorRes.value?.data
          ? { ...indoorRes.value.data, type: 'indoor' }
          : outdoorRes.status === 'fulfilled' && outdoorRes.value?.data
          ? { ...outdoorRes.value.data, type: 'outdoor' }
          : null;
      if (!found) {
        router.replace('/admin-dashboard/enquiry-management');
        return;
      }
      setProduct(found);
      setLoading(false);
    });
  }, [targetId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">Loading product…</div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Link
        href="/admin-dashboard/enquiry-management"
        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Enquiries
      </Link>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 bg-gray-50 flex items-center justify-center p-4">
            {/* Product Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image_url || '/placeholder-product.svg'}
              alt={product.product_name}
              className="max-h-96 w-auto object-contain"
            />
          </div>
          <div className="md:w-1/2 p-6 space-y-4">
            <h1 className="text-3xl font-semibold">
              {product.product_name || product.model_number}
            </h1>
            <p className="text-sm text-gray-500">
              Table: {product.type} • ID: {product.id}
            </p>

            <div className="mt-4 divide-y divide-gray-200">
              {Object.entries(product)
                .filter(([k]) =>
                  ![
                    'id',
                    'image_url',
                    'product_name',
                    'model_number',
                    'type',
                  ].includes(k)
                )
                .map(([k, v]) => (
                  <div key={k} className="py-2 flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">
                      {k.replace(/_/g, ' ')}
                    </span>
                    <span className="font-medium max-w-[60%] text-right break-words">
                      {v ?? '-'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function isValidUUID(uuid) {
  if (typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
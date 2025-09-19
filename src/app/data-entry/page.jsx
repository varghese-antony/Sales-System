"use client";

import { useState } from 'react';

export default function DataEntryPage() {
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [productType, setProductType] = useState('');
  const [sizes, setSizes] = useState('');
  const [colors, setColors] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Processing data...');

    const sizeArray = sizes.split(',').map(s => s.trim()).filter(s => s);
    const colorArray = colors.split(',').map(c => c.trim()).filter(c => c);

    if (sizeArray.length === 0 || colorArray.length === 0) {
      setMessage('Please enter at least one size and one color.');
      return;
    }

    const combinations = [];
    sizeArray.forEach(size => {
      colorArray.forEach(color => {
        combinations.push({
          type,
          category,
          productType,
          size,
          color,
        });
      });
    });

    try {
      const response = await fetch('https://n8n.werposolutions.com/webhook/post-data-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(combinations),
      });

      if (response.ok) {
        setMessage('Data successfully sent to webhook!');
        setType('');
        setCategory('');
        setProductType('');
        setSizes('');
        setColors('');
      } else {
        setMessage(`Failed to send data: ${response.statusText}`);
      }
    } catch (error) {
      setMessage(`Error sending data: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Data Entry Form</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">Select Type</option>
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
          </select>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label htmlFor="productType" className="block text-sm font-medium text-gray-700">Product Type</label>
          <input
            type="text"
            id="productType"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label htmlFor="sizes" className="block text-sm font-medium text-gray-700">Sizes (comma-separated)</label>
          <input
            type="text"
            id="sizes"
            value={sizes}
            onChange={(e) => setSizes(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., 4, 5, 6"
            required
          />
        </div>
        <div>
          <label htmlFor="colors" className="block text-sm font-medium text-gray-700">Colors (comma-separated)</label>
          <input
            type="text"
            id="colors"
            value={colors}
            onChange={(e) => setColors(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., white, red, blue"
            required
          />
        </div>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Submit Data
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
    </div>
  );
}
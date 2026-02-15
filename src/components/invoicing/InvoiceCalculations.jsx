import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function InvoiceCalculations({ items = [], discountAmount = 0, discountType = 'fixed' }) {
  const calculateLineItemTotal = (item) => {
    const subtotal = (item.quantity || 0) * (item.unit_price || 0);
    const afterDiscount = subtotal - (item.discount || 0);
    const tax = (afterDiscount * (item.tax_rate || 0)) / 100;
    return { subtotal, tax };
  };

  const totals = items.reduce((acc, item) => {
    const { subtotal, tax } = calculateLineItemTotal(item);
    return {
      subtotal: acc.subtotal + subtotal,
      tax: acc.tax + tax
    };
  }, { subtotal: 0, tax: 0 });

  let finalDiscount = 0;
  if (discountType === 'percentage') {
    finalDiscount = (totals.subtotal * discountAmount) / 100;
  } else {
    finalDiscount = discountAmount;
  }

  const total = totals.subtotal + totals.tax - finalDiscount;

  return null;
}
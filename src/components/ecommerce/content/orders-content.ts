// src/components/ecommerce/content/orders-content.ts
// Minimal type used by order logs and order details components.
export type OrderLog = {
  id: string;
  orderId: string;
  sellerName: string;
  buyerName: string;
  orderDate: string;
  amount: number;
  status: string;
  lastUpdated?: string;
  notes?: string;
  paymentMethod?: string;
};

export {};

export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_Ts4tDUH8uijjs6',
    priceId: 'price_1SuKjuLjj7dwILwNnn1ZX8K7',
    name: 'Bolt Namer',
    description: 'Premium naming service subscription',
    price: 5.00,
    currency: 'usd',
    mode: 'subscription'
  }
];

export function getProductById(id: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.id === id);
}

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return stripeProducts.find(product => product.priceId === priceId);
}
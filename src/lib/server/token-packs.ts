export interface TokenPack {
  packId: string;
  label: string;
  tokenAmount: number;
  priceInPence: number;
  displayPrice: string;
  highlight?: boolean;
}

export const TOKEN_PACKS: TokenPack[] = [
  { packId: 'starter', label: 'Starter Pack', tokenAmount: 500, priceInPence: 499, displayPrice: '£4.99' },
  { packId: 'grid', label: 'Grid Pack', tokenAmount: 1200, priceInPence: 999, displayPrice: '£9.99', highlight: true },
  { packId: 'pro', label: 'Pro Pack', tokenAmount: 2500, priceInPence: 1799, displayPrice: '£17.99' },
  { packId: 'apex', label: 'Apex Pack', tokenAmount: 6000, priceInPence: 3999, displayPrice: '£39.99' },
];

export const getTokenPackById = (packId: string) => TOKEN_PACKS.find((pack) => pack.packId === packId);

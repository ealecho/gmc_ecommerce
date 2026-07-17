// Shared currency formatting for the storefront and admin.
// All monetary values in the app are whole Kenyan shillings.

const kesFormatter = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatKES = (value: number | string) => kesFormatter.format(Math.round(Number(value) || 0));

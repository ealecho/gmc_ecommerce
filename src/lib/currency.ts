// Shared currency formatting for the storefront and admin.
// All monetary values in the app are whole Indonesian rupiah (no sub-unit).

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Format a whole-rupiah number as e.g. "Rp 1.557.500".
export const formatIDR = (value: number | string) => idrFormatter.format(Math.round(Number(value) || 0));

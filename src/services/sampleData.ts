import { ExpenseItem, ExpenseCategory } from '../types/expense';

export const INITIAL_SAMPLE_EXPENSES: ExpenseItem[] = [
  {
    id: 'sample-1',
    merchant: 'GreenLeaf Wholesale Produce',
    amount: 184.50,
    date: '2026-10-14',
    category: 'Inventory',
    tax: 14.76,
    paymentMethod: 'Card',
    notes: 'Weekly fresh inventory delivery for store restock',
    isSample: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
  },
  {
    id: 'sample-2',
    merchant: 'Metro Office Depot',
    amount: 42.80,
    date: '2026-10-12',
    category: 'Office Supplies',
    tax: 3.42,
    paymentMethod: 'Card',
    notes: 'Receipt thermal rolls, label printer refills',
    isSample: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 96,
  },
  {
    id: 'sample-3',
    merchant: 'Artisan Espresso Bar',
    amount: 14.75,
    date: '2026-10-10',
    category: 'Meals & Coffee',
    tax: 1.18,
    paymentMethod: 'Card',
    notes: 'Client strategy discussion meeting',
    isSample: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 144,
  },
  {
    id: 'sample-4',
    merchant: 'QuickShell Fuel & Gas',
    amount: 58.00,
    date: '2026-10-08',
    category: 'Travel & Fuel',
    tax: 4.64,
    paymentMethod: 'Card',
    notes: 'Client site delivery trip fuel',
    isSample: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 192,
  },
  {
    id: 'sample-5',
    merchant: 'Pacific Fiber Internet',
    amount: 79.99,
    date: '2026-10-01',
    category: 'Utilities & Rent',
    tax: 6.40,
    paymentMethod: 'Bank Transfer',
    notes: 'Monthly high-speed broadband for shop POS terminal',
    isSample: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 360,
  },
];

/**
 * Generates a clean synthetic receipt image canvas as a base64 Data URL.
 * Enables instant one-click testing of OCR and deterministic parsing right out of the box!
 */
export function generateSampleReceiptImage(preset: 'cafe' | 'supplies' | 'hardware' | 'grocery'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 680;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background receipt paper texture
  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle border / shadow
  ctx.strokeStyle = '#e2ded5';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Jagged bottom cut edge effect
  ctx.fillStyle = '#f0ebe1';
  ctx.beginPath();
  ctx.moveTo(10, canvas.height - 20);
  for (let x = 10; x <= canvas.width - 10; x += 15) {
    ctx.lineTo(x + 7.5, canvas.height - 12);
    ctx.lineTo(x + 15, canvas.height - 20);
  }
  ctx.lineTo(canvas.width - 10, canvas.height);
  ctx.lineTo(10, canvas.height);
  ctx.closePath();
  ctx.fill();

  let merchant = 'SUNSHINE CAFE';
  let address = '742 Evergreen Terrace, Springfield';
  let dateStr = '10/15/2026 09:42 AM';
  let items: [string, string][] = [
    ['1x Iced Vanilla Latte', '$6.25'],
    ['1x Avocado Toast', '$9.50'],
    ['1x Almond Croissant', '$4.50'],
  ];
  let subtotal = '$20.25';
  let tax = '$1.72';
  let total = '$21.97';

  if (preset === 'supplies') {
    merchant = 'OFFICE DEPOT & SUPPLIES';
    address = '108 Market Street, Suite 4';
    dateStr = '10/12/2026 02:15 PM';
    items = [
      ['2x Thermal Paper Roll Pack', '$18.90'],
      ['1x Heavy Duty Stapler', '$12.50'],
      ['1x Permanent Marker 4pk', '$6.40'],
    ];
    subtotal = '$37.80';
    tax = '$3.21';
    total = '$41.01';
  } else if (preset === 'hardware') {
    merchant = 'ACME HARDWARE & TOOLS';
    address = '550 Industrial Way';
    dateStr = '10/11/2026 11:30 AM';
    items = [
      ['1x Milwaukee Drill Bit Set', '$24.99'],
      ['1x Gorilla Duct Tape 30yd', '$9.49'],
      ['2x LED Shop Light Fixture', '$45.00'],
    ];
    subtotal = '$79.48';
    tax = '$6.75';
    total = '$86.23';
  } else if (preset === 'grocery') {
    merchant = 'TRADER BROS GROCERY';
    address = '88 Central Avenue';
    dateStr = '10/14/2026 05:20 PM';
    items = [
      ['Organic Milk 1gal', '$5.49'],
      ['Fresh Sourdough Bread', '$4.99'],
      ['Colombian Dark Roast Coffee', '$12.99'],
      ['Greek Yogurt 32oz', '$6.25'],
    ];
    subtotal = '$29.72';
    tax = '$2.38';
    total = '$32.10';
  }

  // Draw Header
  ctx.fillStyle = '#1c1917';
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(merchant, canvas.width / 2, 60);

  ctx.font = '13px monospace';
  ctx.fillStyle = '#57534e';
  ctx.fillText(address, canvas.width / 2, 85);
  ctx.fillText(`TEL: (555) 019-2834`, canvas.width / 2, 105);
  ctx.fillText(`DATE: ${dateStr}`, canvas.width / 2, 130);
  ctx.fillText('CASHIER: Emily R. | POS #02', canvas.width / 2, 150);

  // Dashed separator
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#a8a29e';
  ctx.beginPath();
  ctx.moveTo(30, 175);
  ctx.lineTo(canvas.width - 30, 175);
  ctx.stroke();
  ctx.setLineDash([]);

  // Line items
  let y = 215;
  ctx.font = '14px monospace';
  for (const [desc, price] of items) {
    ctx.fillStyle = '#292524';
    ctx.textAlign = 'left';
    ctx.fillText(desc, 35, y);
    ctx.textAlign = 'right';
    ctx.fillText(price, canvas.width - 35, y);
    y += 34;
  }

  // Dashed separator
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(30, y + 15);
  ctx.lineTo(canvas.width - 30, y + 15);
  ctx.stroke();
  ctx.setLineDash([]);

  y += 45;
  // Subtotal & Tax
  ctx.textAlign = 'left';
  ctx.fillStyle = '#57534e';
  ctx.fillText('SUBTOTAL', 35, y);
  ctx.textAlign = 'right';
  ctx.fillText(subtotal, canvas.width - 35, y);

  y += 26;
  ctx.textAlign = 'left';
  ctx.fillText('TAX (8.5%)', 35, y);
  ctx.textAlign = 'right';
  ctx.fillText(tax, canvas.width - 35, y);

  y += 35;
  // Total
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL DUE', 35, y);
  ctx.textAlign = 'right';
  ctx.fillText(total, canvas.width - 35, y);

  y += 45;
  ctx.font = '13px monospace';
  ctx.fillStyle = '#57534e';
  ctx.textAlign = 'center';
  ctx.fillText('PAYMENT METHOD: VISA **** 4821', canvas.width / 2, y);
  y += 25;
  ctx.fillText('AUTH: #892134 - APPROVED', canvas.width / 2, y);
  y += 45;
  ctx.font = 'italic 14px monospace';
  ctx.fillStyle = '#78716c';
  ctx.fillText('THANK YOU FOR YOUR BUSINESS!', canvas.width / 2, y);

  return canvas.toDataURL('image/png');
}

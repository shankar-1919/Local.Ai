import { ExpenseCategory } from '../types/expense';

export const CATEGORIES: ExpenseCategory[] = [
  'Inventory',
  'Office Supplies',
  'Meals & Coffee',
  'Travel & Fuel',
  'Equipment & Tools',
  'Utilities & Rent',
  'Software & Services',
  'Repairs & Maintenance',
  'Marketing & Ads',
  'Other',
];

export function getCategoryBadgeClasses(category: ExpenseCategory): string {
  switch (category) {
    case 'Inventory':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Office Supplies':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Meals & Coffee':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Travel & Fuel':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Equipment & Tools':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'Utilities & Rent':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'Software & Services':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Repairs & Maintenance':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Marketing & Ads':
      return 'bg-pink-50 text-pink-700 border-pink-200';
    case 'Other':
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200';
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

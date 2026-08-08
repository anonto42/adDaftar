/**
 * Database Repositories
 *
 * Centralized exports for all repositories redirected to features.
 */

export { productRepository, categoryRepository } from '@/src/features/inventory';
export { customerRepository, paymentRepository } from '@/src/features/customers';
export { salesRepository } from '@/src/features/sales';
export { businessRepository } from '@/src/features/business';
export { appRepository } from '@/src/features/settings';
export { expenseRepository } from '@/src/features/expenses';
export { analyticsRepository } from '@/src/features/analytics';
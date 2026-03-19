import { api } from '@/lib/api'

export function createCheckoutSession({ priceId, userId, userEmail, planName, successUrl, cancelUrl }) {
  return api.post('/api/create-checkout', {
    priceId,
    userId,
    userEmail,
    planName,
    successUrl,
    cancelUrl,
  })
}

export function createCustomerPortal({ customerId, returnUrl }) {
  return api.post('/api/customer-portal', {
    customerId,
    returnUrl,
  })
}

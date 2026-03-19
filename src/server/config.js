const config = {
  frontendUrl:
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_FRONTEND_URL ||
    'http://localhost:3000',
}

let stripe = null
let supabase = null

function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    // Lazy-load Stripe only on the server
    // eslint-disable-next-line global-require
    const Stripe = require('stripe')
    stripe = Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return stripe
}

function getSupabase() {
  if (!supabase && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // eslint-disable-next-line global-require
    const { createClient } = require('@supabase/supabase-js')
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  }
  return supabase
}

module.exports = {
  config,
  getStripe,
  getSupabase,
}


# TODO — Repliexa SaaS Platform

## Priority Labels
- **P1** — Must fix before launch
- **P2** — Important for full feature set
- **P3** — Nice to have

---

## Pre-Launch Checklist [P1]
- [ ] Set up Turso DB and run migrations (auto on first request)
- [ ] Configure Clerk project and add keys to Vercel env vars
- [ ] Add at least `GEMINI_API_KEY` to Vercel env vars
- [ ] Set `ADMIN_EMAIL` to your email in Vercel env vars
- [ ] Set `APP_URL` to your Vercel deployment URL
- [ ] Test full booking flow end-to-end
- [ ] Test payment flow with Paystack test keys
- [ ] Deploy to Vercel: `vercel --prod`

## Known Issues [P1]
- [ ] `server.ts` still exists — safe to delete after confirming Vercel deployment works
- [ ] Stripe checkout uses `redirectToCheckout` which requires Stripe Checkout product setup — consider switching to Payment Intents for inline checkout
- [ ] Google OAuth requires verified Google Cloud project for production (takes 1-3 days)
- [ ] Owner email for booking alerts uses `google_client_id` as fallback — add a dedicated `owner_email` column to `business_configs`

## Improvements [P2]
- [ ] Add `owner_email` field to `business_configs` for booking alert emails
- [ ] WhatsApp Business API integration (Meta approval required — use Twilio as alternative)
- [ ] Conversation history persistence across sessions (currently in-memory only)
- [ ] File upload for digital product delivery after payment
- [ ] Currency symbol dynamic throughout (₦ hardcoded in some widget places)
- [ ] Booking cancellation email to visitor
- [ ] Google Calendar event deletion on booking cancellation

## Future Features [P3]
- [ ] Analytics dashboard with charts (currently raw numbers only)
- [ ] Custom domain support for Business plan
- [ ] Multi-language widget support
- [ ] Zapier/Make webhook integration
- [ ] Team members (multiple users per business)
- [ ] Product inventory tracking
- [ ] Affiliate/referral system

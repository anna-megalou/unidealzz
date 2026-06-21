import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

// Scans for offers created in the last N days for brands the user has
// favorited (via favorites -> offers.brand_id), skipping anything already
// alerted (favorite_brand_alerts_sent) or users who opted out. Sends ONE
// digest email per user with all their new matching offers and records the
// alerts so we never duplicate.
//
// Triggered by pg_cron once a day. Also callable manually for testing
// (requires service-role JWT — verify_jwt = true by default).

const LOOKBACK_DAYS = 7
const SITE_URL = 'https://unidealz.gr'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const since = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  // 1. Recent active offers
  const { data: recentOffers, error: offersErr } = await supabase
    .from('offers')
    .select('id, title, discount_label, brand_id, brand:brands(name)')
    .eq('active', true)
    .gte('created_at', since)

  if (offersErr) {
    console.error('offers query failed', offersErr)
    return json({ error: 'offers query failed' }, 500)
  }
  if (!recentOffers?.length) {
    return json({ sent: 0, reason: 'no_recent_offers' })
  }

  const brandIds = [...new Set(recentOffers.map((o) => o.brand_id))]
  const offersByBrand = new Map<string, typeof recentOffers>()
  for (const o of recentOffers) {
    const list = offersByBrand.get(o.brand_id) ?? []
    list.push(o)
    offersByBrand.set(o.brand_id, list)
  }

  // 2. Users who favorited any offer of these brands
  const { data: favRows, error: favErr } = await supabase
    .from('favorites')
    .select('user_id, offer:offers!inner(brand_id)')
    .in('offer.brand_id', brandIds)

  if (favErr) {
    console.error('favorites query failed', favErr)
    return json({ error: 'favorites query failed' }, 500)
  }

  // user_id -> Set<brand_id>
  const userBrands = new Map<string, Set<string>>()
  for (const f of favRows ?? []) {
    const brandId = (f as any).offer?.brand_id
    if (!brandId) continue
    const set = userBrands.get(f.user_id) ?? new Set<string>()
    set.add(brandId)
    userBrands.set(f.user_id, set)
  }

  if (userBrands.size === 0) {
    return json({ sent: 0, reason: 'no_matching_users' })
  }

  const userIds = [...userBrands.keys()]

  // 3. Settings — opt-in & email notifications
  const { data: settings } = await supabase
    .from('user_settings')
    .select(
      'user_id, email_notifications, favorite_brand_alerts_opt_in',
    )
    .in('user_id', userIds)

  const optedOut = new Set(
    (settings ?? [])
      .filter(
        (s) =>
          s.email_notifications === false ||
          s.favorite_brand_alerts_opt_in === false,
      )
      .map((s) => s.user_id),
  )

  // 4. Profiles (display name)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', userIds)
  const nameByUser = new Map(
    (profiles ?? []).map((p) => [p.user_id, p.display_name ?? null]),
  )

  // 5. Already-sent alerts to dedupe
  const offerIds = recentOffers.map((o) => o.id)
  const { data: alreadySent } = await supabase
    .from('favorite_brand_alerts_sent')
    .select('user_id, offer_id')
    .in('user_id', userIds)
    .in('offer_id', offerIds)
  const sentSet = new Set(
    (alreadySent ?? []).map((r) => `${r.user_id}:${r.offer_id}`),
  )

  // 6. Resolve emails via auth admin (paged)
  const emailByUser = new Map<string, string>()
  let page = 1
  while (true) {
    const { data: list, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    })
    if (error) {
      console.error('listUsers failed', error)
      break
    }
    for (const u of list.users) {
      if (u.email && userIds.includes(u.id)) {
        emailByUser.set(u.id, u.email)
      }
    }
    if (list.users.length < 200) break
    page++
    if (page > 50) break
  }

  // 7. Build & send per-user digests
  let sent = 0
  let skipped = 0
  for (const userId of userIds) {
    if (optedOut.has(userId)) {
      skipped++
      continue
    }
    const email = emailByUser.get(userId)
    if (!email) {
      skipped++
      continue
    }

    const brands = userBrands.get(userId)!
    const newOffers: Array<{
      id: string
      title: string
      brandName: string
      discountLabel?: string
      url: string
    }> = []
    for (const brandId of brands) {
      const offersForBrand = offersByBrand.get(brandId) ?? []
      for (const o of offersForBrand) {
        if (sentSet.has(`${userId}:${o.id}`)) continue
        newOffers.push({
          id: o.id,
          title: o.title,
          brandName: (o as any).brand?.name ?? '',
          discountLabel: o.discount_label ?? undefined,
          url: `${SITE_URL}/offers/${o.id}`,
        })
      }
    }

    if (newOffers.length === 0) {
      skipped++
      continue
    }

    const idempotencyKey = `fav-brand-alert-${userId}-${newOffers
      .map((o) => o.id)
      .sort()
      .join('-')
      .slice(0, 80)}`

    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRteGtvdnVlZ3BiZHFmb3FtZ2diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTEzODgsImV4cCI6MjA5MjIyNzM4OH0.CWfnZL9t9IUye-BM98T3Wd5lpmuSIkAuIJTJ7GY12Ik'
    const resp = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        templateName: 'favorite-brand-new-offer',
        recipientEmail: email,
        idempotencyKey,
        templateData: {
          name: nameByUser.get(userId) ?? undefined,
          offers: newOffers.map(({ id: _id, ...rest }) => rest),
        },
      }),
    })
    const invokeErr = resp.ok ? null : await resp.text()

    if (invokeErr) {
      console.error('invoke failed', { userId, invokeErr })
      continue
    }

    await supabase.from('favorite_brand_alerts_sent').insert(
      newOffers.map((o) => ({ user_id: userId, offer_id: o.id })),
    )
    sent++
  }

  return json({ sent, skipped, candidates: userIds.length })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

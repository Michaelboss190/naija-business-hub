import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // per window

const requestCounts = new Map<string, { count: number; resetTime: number }>()

serve(async (req) => {
  const clientIP = req.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()
  
  let record = requestCounts.get(clientIP)
  
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + RATE_LIMIT_WINDOW }
    requestCounts.set(clientIP, record)
  }
  
  record.count++
  
  if (record.count > MAX_REQUESTS) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  return new Response(
    JSON.stringify({ allowed: true, remaining: MAX_REQUESTS - record.count }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// POST /api/share  { calculation_id }  → { token, url }
export async function POST(req: NextRequest) {
  try {
    const { calculation_id } = await req.json()
    if (!calculation_id) return NextResponse.json({ error: 'calculation_id required' }, { status: 400 })

    // Generate a random token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(18)))
      .map(b => b.toString(36).padStart(2, '0'))
      .join('')
      .slice(0, 24)

    const { error } = await supabase
      .from('calculations')
      .update({ share_token: token, share_enabled: true })
      .eq('id', calculation_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ token, url: `/report/${token}` })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

// DELETE /api/share  { calculation_id }  → revoke
export async function DELETE(req: NextRequest) {
  try {
    const { calculation_id } = await req.json()
    const { error } = await supabase
      .from('calculations')
      .update({ share_token: null, share_enabled: false })
      .eq('id', calculation_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}

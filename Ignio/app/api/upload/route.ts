import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const jwt = process.env.PINATA_JWT
  if (!jwt) return NextResponse.json({ error: 'Image upload is not set up yet (PINATA_JWT missing).' }, { status: 501 })

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file received.' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image.' }, { status: 400 })
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Image must be under 2 MB.' }, { status: 400 })

  const body = new FormData()
  body.append('file', file)
  body.append('network', 'public')
  const res = await fetch('https://uploads.pinata.cloud/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body,
  })
  const json = await res.json().catch(() => null)
  const cid = json?.data?.cid
  if (!res.ok || !cid) return NextResponse.json({ error: 'IPFS upload failed.' }, { status: 502 })
  return NextResponse.json({ uri: `ipfs://${cid}` })
}

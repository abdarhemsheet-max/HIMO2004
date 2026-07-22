import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const B2_KEY_ID = Deno.env.get('B2_KEY_ID')!
const B2_KEY_SECRET = Deno.env.get('B2_KEY_SECRET')!
const B2_BUCKET_ID = Deno.env.get('B2_BUCKET_ID')!
const B2_BUCKET_NAME = Deno.env.get('B2_BUCKET_NAME')!
// DB insert handled by client-side api.ts

async function getAuthToken() {
  const basic = btoa(`${B2_KEY_ID}:${B2_KEY_SECRET}`)
  const res = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: { Authorization: `Basic ${basic}` },
  })
  return await res.json()
}

async function getUploadUrl(apiUrl: string, authToken: string) {
  const res = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: {
      Authorization: authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bucketId: B2_BUCKET_ID }),
  })
  return await res.json()
}

serve(async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response(JSON.stringify({ error: 'file is required' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    const auth = await getAuthToken()
    const uploadInfo = await getUploadUrl(auth.apiUrl, auth.authorizationToken)

    const fileBuffer = await file.arrayBuffer()
    const sha1 = await crypto.subtle.digest('SHA-1', fileBuffer).then(b => {
      const hex = Array.from(new Uint8Array(b)).map(v => v.toString(16).padStart(2, '0')).join('')
      return hex
    })

    const uploadRes = await fetch(uploadInfo.uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: uploadInfo.authorizationToken,
        'X-Bz-File-Name': `${Date.now()}-${file.name}`,
        'Content-Type': file.type || 'application/octet-stream',
        'X-Bz-Content-Sha1': sha1,
        'Content-Length': file.size.toString(),
      },
      body: fileBuffer,
    })

    const uploadResult = await uploadRes.json()

        return new Response(JSON.stringify({ upload: uploadResult }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    })
  }
})

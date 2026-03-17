export const dynamic = "force-dynamic"



export async function GET() {
  const YOCO_KEY = process.env.YOCO_SECRET_KEY

  if (!YOCO_KEY) return Response.json({ error: "No Key Found" })

  try {
    // GET request to list all webhooks
    const response = await fetch("https://payments.yoco.com/api/webhooks", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${YOCO_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    
    return Response.json({
      status: response.status,
      webhooks: data
    })

  } catch (error: any) {
    return Response.json({ error: error.message })
  }
}

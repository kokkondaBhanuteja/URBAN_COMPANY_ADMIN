import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerId, type, accountDetails } = body

    if (!providerId || !type || !accountDetails) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // In a real app, save payment method to database
    const newPaymentMethod = {
      _id: Date.now().toString(),
      type,
      accountDetails,
      isVerified: false,
      isDefault: false,
    }

    return NextResponse.json(newPaymentMethod, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to add payment method" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { providerId, paymentMethodId, updates } = body

    if (!providerId || !paymentMethodId || !updates) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // In a real app, update payment method in database
    return NextResponse.json({ message: "Payment method updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update payment method" }, { status: 500 })
  }
}

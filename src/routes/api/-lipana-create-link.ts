import { Lipana } from '@lipana/sdk';

// This should be loaded from process.env in a real app
const lipana = new Lipana({
  apiKey: process.env.LIPANA_SECRET_KEY!,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const paymentLink = await lipana.paymentLinks.create({
      title: body.title,
      description: body.description,
      amount: body.amount,
      currency: body.currency || 'KES',
      allowCustomAmount: body.allowCustomAmount ?? false,
      successRedirectUrl: body.successRedirectUrl || 'https://yourwebsite.com/success',
    });
    return new Response(JSON.stringify({ url: paymentLink.url }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify Paystack signature
  const crypto = require('crypto');
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');
    
  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;
  
  switch (event.event) {
    case 'charge.success':
      // Process successful payment
      console.log('Payment successful:', event.data);
      // Update your database, grant access, etc.
      break;
      
    case 'subscription.create':
      // Handle subscription
      break;
      
    case 'transfer.success':
      // Handle transfer to teacher
      break;
  }

  return res.status(200).json({ received: true });
}
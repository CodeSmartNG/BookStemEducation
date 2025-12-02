// Configuration for Vite
export const paymentConfig = {
  paystack: {
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_demo_key'
  }
};

export default paymentConfig;
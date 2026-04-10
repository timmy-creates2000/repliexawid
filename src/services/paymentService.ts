export interface PaymentConfig {
  publicKey: string;
  amount: number;
  currency: 'NGN' | 'USD';
  email: string;
  name: string;
  phoneNumber: string;
  tx_ref: string;
}

export function initializePayment(config: PaymentConfig, onSuccess: (response: any) => void, onClose: () => void) {
  // Check if Flutterwave script is loaded
  if (!(window as any).FlutterwaveCheckout) {
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => startPayment(config, onSuccess, onClose);
    document.body.appendChild(script);
  } else {
    startPayment(config, onSuccess, onClose);
  }
}

function startPayment(config: PaymentConfig, onSuccess: (response: any) => void, onClose: () => void) {
  (window as any).FlutterwaveCheckout({
    public_key: config.publicKey,
    tx_ref: config.tx_ref,
    amount: config.amount,
    currency: config.currency,
    payment_options: "card, banktransfer, ussd",
    customer: {
      email: config.email,
      phone_number: config.phoneNumber,
      name: config.name,
    },
    customizations: {
      title: "Benzene AI Subscription",
      description: "Payment for AI Sales Agent Subscription",
      logo: "https://www.flutterwave.com/images/logo-colored.svg",
    },
    callback: onSuccess,
    onclose: onClose,
  });
}

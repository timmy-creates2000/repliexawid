import { getEnabledAutomations } from './db';

export type TriggerEvent = 'lead_captured' | 'booking_confirmed' | 'payment_confirmed' | 'chat_started';

/**
 * Fire-and-forget automation dispatcher.
 * Never throws — failures are logged but never propagate to the caller.
 */
export async function dispatch(
  event: TriggerEvent,
  userId: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const automations = await getEnabledAutomations(userId, event);
    for (const auto of automations) {
      runAction(auto, payload, userId).catch(err => {
        console.error(`[automations] Failed: event=${event} action=${auto.action_type} userId=${userId}`, err);
      });
    }
  } catch (err) {
    console.error(`[automations] dispatch error: event=${event} userId=${userId}`, err);
  }
}

async function runAction(
  auto: Record<string, any>,
  payload: Record<string, unknown>,
  userId: string
): Promise<void> {
  const config = JSON.parse(auto.config_json ?? '{}');

  switch (auto.action_type) {
    case 'send_whatsapp_notification':
      await sendWhatsAppNotification(config, payload, userId);
      break;
    case 'create_google_calendar_event':
      // Imported lazily to avoid circular deps — implemented in Phase 6
      const { createCalendarEvent } = await import('./google');
      await createCalendarEvent(payload as any, config, userId);
      break;
    case 'send_email_receipt':
      const { sendPaymentReceipt } = await import('./email');
      await sendPaymentReceipt(payload as any, userId);
      break;
    case 'send_booking_confirmation_email':
      const { sendBookingConfirmationToVisitor } = await import('./email');
      await sendBookingConfirmationToVisitor(payload as any, userId);
      break;
    case 'send_owner_booking_alert':
      const { sendBookingAlertToOwner } = await import('./email');
      await sendBookingAlertToOwner(payload as any, userId);
      break;
    default:
      console.warn(`[automations] Unknown action type: ${auto.action_type}`);
  }
}

async function sendWhatsAppNotification(
  config: Record<string, any>,
  payload: Record<string, unknown>,
  userId: string
): Promise<void> {
  // WhatsApp Business API integration — placeholder for Phase 5
  // config.phoneNumber = business owner's WhatsApp number
  console.log(`[automations] WhatsApp notification to ${config.phoneNumber}:`, payload);
}

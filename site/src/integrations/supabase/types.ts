/**
 * Tipos das tabelas usadas pelo site.
 * Reconstruídos a partir da aplicação publicada em lutuimaveiga.com.
 */

export type ServiceType = "15_minutes" | "30_minutes";

export type ContactPreference =
  | "whatsapp_voice"
  | "whatsapp_video"
  | "normal_voice";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed";

/** Tabela `services` — preços das consultorias. */
export interface Service {
  id: string;
  price_15_minutes: number;
  price_30_minutes: number;
  created_at?: string;
  updated_at?: string;
}

/** Tabela `appointments` — marcações dos clientes. */
export interface Appointment {
  id: string;
  client_name: string;
  client_surname: string;
  client_email: string;
  client_phone: string;
  client_instagram: string | null;
  service_type: ServiceType;
  scheduled_date: string;
  scheduled_time: string;
  contact_preference: ContactPreference;
  notes: string | null;
  amount: number;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  stripe_session_id: string | null;
  created_at: string;
}

/** Tabela `blocked_dates` — dias indisponíveis para marcação. */
export interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string | null;
}

export const CONTACT_PREFERENCE_LABELS: Record<ContactPreference, string> = {
  whatsapp_voice: "Chamada de Voz WhatsApp",
  whatsapp_video: "Chamada de Vídeo WhatsApp",
  normal_voice: "Chamada de Voz Normal",
};

export const SERVICE_LABELS: Record<ServiceType, string> = {
  "15_minutes": "15 minutos",
  "30_minutes": "30 minutos",
};

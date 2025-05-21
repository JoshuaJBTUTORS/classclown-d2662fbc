
export interface Organization {
  id: string;
  name: string;
  subdomain: string;
  logo_url: string | null;
  primary_color: string | null;
  status: string;
  google_calendar_enabled?: boolean;
  google_calendar_id?: string | null;
  google_calendar_sync_enabled?: boolean;
}

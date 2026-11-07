export type ActivityResult = "positive" | "neutral" | "negative" | "follow_up";
export type ContactType = "in_person" | "phone";

export type DailyActivityReport = {
  id: number;
  employee: { id: string | null; name: string };
  visit_date: string;
  visit_time: string | null;
  organization_name: string;
  contact_name: string | null;
  contact_type: ContactType;
  purpose: string;
  discussion: string;
  employee_question: string | null;
  audience_feedback: string | null;
  outcome: string;
  result: ActivityResult;
  is_archived: boolean;
  retention_until: string;
  created_at: string;
  updated_at: string;
};

export type DailyActivityReportInput = Omit<
  DailyActivityReport,
  "id" | "employee" | "is_archived" | "retention_until" | "created_at" | "updated_at"
>;

export type ActivityFilters = {
  page?: number;
  per_page?: number;
  search?: string;
  from?: string;
  to?: string;
  contact_type?: ContactType | "";
  result?: ActivityResult | "";
  employee_id?: string;
};

export type ActivityCleanupRun = {
  id: number;
  deleted_count: number;
  reason: string;
  created_at: string;
  performed_by: string | null;
  report_ids: number[];
};

import { apiClient } from "../../../api/client";

export type SystemNotification = {
  id: string;
  title: string;
  body: string;
  priority: "low" | "normal" | "high" | "urgent";
  is_read: boolean;
  created_at: string | null;
  read_at: string | null;
};

export type NotificationPage = {
  data: SystemNotification[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type NotificationRecipients = {
  users: Array<{ id: string; name: string }>;
  roles: string[];
};

export type SendSystemMessagePayload = {
  target_type: "all" | "users" | "roles";
  user_ids?: string[];
  role_names?: string[];
  title: string;
  body: string;
  priority: "low" | "normal" | "high" | "urgent";
};

export async function getNotifications(page = 1): Promise<NotificationPage> {
  const response = await apiClient.get<NotificationPage>("/notifications", {
    params: { page, per_page: 20 },
  });
  return response.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiClient.get<{ count: number }>("/notifications/unread-count");
  return response.data.count;
}

export async function markNotificationRead(id: string): Promise<SystemNotification> {
  const response = await apiClient.patch<SystemNotification>(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post("/notifications/read-all");
}

export async function getNotificationRecipients(): Promise<NotificationRecipients> {
  const response = await apiClient.get<NotificationRecipients>("/notifications/recipients");
  return response.data;
}

export async function sendSystemMessage(payload: SendSystemMessagePayload): Promise<{ recipients_count: number }> {
  const response = await apiClient.post<{ recipients_count: number }>("/notifications/send", payload);
  return response.data;
}

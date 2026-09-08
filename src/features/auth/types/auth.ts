export type AuthUser = {
  id: string;
  login: string;
  employee: {
    id: string;
    full_name: string;
    phone_number: string;
  };
};

export type LoginRequest = {
  login: string;
  password: string;
  device_id: string;
  platform: string;
  platform_version?: string;
  app_version?: string;
  push_token?: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

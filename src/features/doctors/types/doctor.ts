export type DoctorStatus = "active" | "inactive" | "suspended";

export type DoctorSpecialty =
  | "متخصص پوست، مو و زیبایی"
  | "پزشک عمومی"
  | "متخصص پوست اطفال و کودکان"
  | "متخصص آلرژی و ایمنی‌شناسی"
  | "متخصص ورید و عروق"
  | "متخصص غدد و متابولیسم"
  | "متخصص تغذیه";

export type DoctorAddress = {
  province: string;
  city: string;
  address: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type Doctor = {
  id: string;
  code: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  clinic_name: string | null;
  specialty: DoctorSpecialty;
  status: DoctorStatus;
  attachment: string | null;
  address: DoctorAddress | null;
  is_favorite: boolean;
  description: string | null;
  meta: Record<string, unknown> | null;
  last_visit_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export type DoctorListParams = {
  search?: string;
  specialty?: DoctorSpecialty;
  status?: DoctorStatus;
  sort?: string;
  page?: number;
  per_page?: number;
};

export type DoctorPaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};

export type DoctorPaginationLinks = {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
};

export type DoctorListResponse = {
  data: Doctor[];
  links: DoctorPaginationLinks;
  meta: DoctorPaginationMeta;
};

export type DoctorFormData = {
  first_name: string;
  last_name: string;
  phone_number: string;
  clinic_name: string;
  specialty: DoctorSpecialty;
  status: DoctorStatus;
  address: {
    province: string;
    city: string;
    address: string;
    postal_code: string;
    latitude: string;
    longitude: string;
  };
  description: string;
};

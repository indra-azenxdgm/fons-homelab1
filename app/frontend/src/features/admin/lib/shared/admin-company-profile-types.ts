export type AdminCompanyProfile = {
  id: string | null;
  companyName: string;
  companyTagline: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  hasProfile: boolean;
};

export type AdminCompanyProfileInput = {
  companyName: string;
  companyTagline?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logoUrl?: string | null;
};

export interface ProfileResponse {
  fullName: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileInput {
  fullName: string;
  email?: string | null;
}

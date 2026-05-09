import type { UserProfile } from '@prisma/client';
import { prisma } from '../config/database.js';
import type { ProfileInput, ProfileResponse } from '../models/profile.model.js';

const PROFILE_ID = 'default';
const DEFAULT_PROFILE = {
  fullName: 'User',
  email: null,
};

const serializeProfile = (profile: UserProfile): ProfileResponse => ({
  fullName: profile.fullName,
  email: profile.email,
  createdAt: profile.createdAt.toISOString(),
  updatedAt: profile.updatedAt.toISOString(),
});

export const profileService = {
  async get() {
    const profile = await prisma.userProfile.upsert({
      where: { id: PROFILE_ID },
      create: {
        id: PROFILE_ID,
        ...DEFAULT_PROFILE,
      },
      update: {},
    });

    return serializeProfile(profile);
  },

  async update(input: ProfileInput) {
    const fullName = input.fullName.trim();
    const email = input.email?.trim() || null;

    const profile = await prisma.userProfile.upsert({
      where: { id: PROFILE_ID },
      create: {
        id: PROFILE_ID,
        fullName,
        email,
      },
      update: {
        fullName,
        email,
      },
    });

    return serializeProfile(profile);
  },
};

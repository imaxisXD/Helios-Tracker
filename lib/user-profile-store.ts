// ---------------------------------------------------------------------------
// Local user profile storage using expo-file-system (v19+ API)
// ---------------------------------------------------------------------------

import { Paths, File } from 'expo-file-system';
import type { User } from './data-types';

const profileFile = new File(Paths.document, 'user-profile.json');

/**
 * Load the locally stored user profile, or null if none exists.
 */
export async function loadLocalProfile(): Promise<User | null> {
  try {
    if (!profileFile.exists) return null;
    const json = await profileFile.text();
    return JSON.parse(json) as User;
  } catch {
    return null;
  }
}

/**
 * Save a user profile to local storage.
 */
export async function saveLocalProfile(profile: User): Promise<void> {
  if (!profileFile.exists) {
    profileFile.create();
  }
  profileFile.write(JSON.stringify(profile));
}

/**
 * Delete the locally stored user profile.
 */
export async function deleteLocalProfile(): Promise<void> {
  try {
    if (profileFile.exists) {
      profileFile.delete();
    }
  } catch {
    // ignore
  }
}

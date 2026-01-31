// ---------------------------------------------------------------------------
// Health Connect permission management
// ---------------------------------------------------------------------------

import { Platform } from 'react-native';

export type HealthConnectStatus =
  | 'unavailable'
  | 'ready'
  | 'permissions_needed'
  | 'not_supported';

const REQUIRED_PERMISSIONS = [
  { accessType: 'read' as const, recordType: 'HeartRate' as const },
  { accessType: 'read' as const, recordType: 'Steps' as const },
  { accessType: 'read' as const, recordType: 'SleepSession' as const },
  { accessType: 'read' as const, recordType: 'ExerciseSession' as const },
  { accessType: 'read' as const, recordType: 'Distance' as const },
  { accessType: 'read' as const, recordType: 'ActiveCaloriesBurned' as const },
  { accessType: 'read' as const, recordType: 'TotalCaloriesBurned' as const },
  { accessType: 'read' as const, recordType: 'Weight' as const },
  { accessType: 'read' as const, recordType: 'Height' as const },
  { accessType: 'read' as const, recordType: 'BodyFat' as const },
];

export interface PermissionResult {
  allGranted: boolean;
  grantedCount: number;
  totalCount: number;
}

/**
 * Check if Health Connect is available and permissions are granted.
 */
export async function checkHealthConnectStatus(): Promise<HealthConnectStatus> {
  if (Platform.OS !== 'android') {
    return 'not_supported';
  }

  try {
    const {
      getSdkStatus,
      initialize,
      SdkAvailabilityStatus,
    } = await import('react-native-health-connect');

    const status = await getSdkStatus();

    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
      return 'unavailable';
    }

    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
      return 'unavailable';
    }

    // Initialize the SDK
    await initialize();

    // Check if permissions are already granted
    const { getGrantedPermissions } = await import('react-native-health-connect');
    const granted = await getGrantedPermissions();

    const grantedTypes = new Set(
      granted
        .filter((p) => 'recordType' in p && 'accessType' in p)
        .map((p) => `${(p as { accessType: string; recordType: string }).accessType}:${(p as { accessType: string; recordType: string }).recordType}`),
    );

    const allGranted = REQUIRED_PERMISSIONS.every(
      (p) => grantedTypes.has(`${p.accessType}:${p.recordType}`),
    );

    return allGranted ? 'ready' : 'permissions_needed';
  } catch {
    return 'unavailable';
  }
}

/**
 * Request Health Connect permissions via the native permission dialog.
 * Requires HealthConnectPermissionDelegate to be registered in MainActivity.
 * Falls back to opening Health Connect settings if the dialog fails.
 */
export async function requestHealthConnectPermissions(): Promise<PermissionResult> {
  try {
    const { initialize, requestPermission } = await import('react-native-health-connect');
    await initialize();

    const granted = await requestPermission(REQUIRED_PERMISSIONS);

    const grantedTypes = new Set(
      granted
        .filter((p: unknown) => {
          const rec = p as Record<string, unknown>;
          return 'recordType' in rec && 'accessType' in rec;
        })
        .map((p: unknown) => {
          const rec = p as { accessType: string; recordType: string };
          return `${rec.accessType}:${rec.recordType}`;
        }),
    );

    const grantedCount = REQUIRED_PERMISSIONS.filter(
      (p) => grantedTypes.has(`${p.accessType}:${p.recordType}`),
    ).length;

    return {
      allGranted: grantedCount === REQUIRED_PERMISSIONS.length,
      grantedCount,
      totalCount: REQUIRED_PERMISSIONS.length,
    };
  } catch {
    // Native dialog failed — fall back to settings approach
    await openHealthConnectPermissionSettings();
    return { allGranted: false, grantedCount: 0, totalCount: REQUIRED_PERMISSIONS.length };
  }
}

/**
 * Open Health Connect settings so the user can grant permissions manually.
 * Used as a fallback if the native permission dialog fails.
 */
export async function openHealthConnectPermissionSettings(): Promise<void> {
  try {
    const { openHealthConnectSettings } = await import('react-native-health-connect');
    await openHealthConnectSettings();
  } catch {
    // If openHealthConnectSettings fails, try opening the data management page
    try {
      const { openHealthConnectDataManagement } = await import('react-native-health-connect');
      await openHealthConnectDataManagement();
    } catch {
      // Silently fail — user can open Health Connect manually
    }
  }
}

/**
 * Re-check permissions after the user returns from Health Connect settings.
 * Returns a PermissionResult indicating which permissions are now granted.
 */
export async function recheckPermissions(): Promise<PermissionResult> {
  try {
    const { initialize, getGrantedPermissions } = await import('react-native-health-connect');
    await initialize();
    const granted = await getGrantedPermissions();

    const grantedTypes = new Set(
      granted
        .filter((p) => 'recordType' in p && 'accessType' in p)
        .map((p) => `${(p as { accessType: string; recordType: string }).accessType}:${(p as { accessType: string; recordType: string }).recordType}`),
    );

    const grantedCount = REQUIRED_PERMISSIONS.filter(
      (p) => grantedTypes.has(`${p.accessType}:${p.recordType}`),
    ).length;

    return {
      allGranted: grantedCount === REQUIRED_PERMISSIONS.length,
      grantedCount,
      totalCount: REQUIRED_PERMISSIONS.length,
    };
  } catch {
    return { allGranted: false, grantedCount: 0, totalCount: REQUIRED_PERMISSIONS.length };
  }
}

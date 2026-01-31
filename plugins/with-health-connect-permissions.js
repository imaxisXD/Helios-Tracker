// ---------------------------------------------------------------------------
// Custom Expo config plugin for Health Connect
//
// The built-in react-native-health-connect plugin (v3.5.0) only adds an
// intent-filter to MainActivity. It does NOT declare the actual health
// permissions in the manifest, so Health Connect never recognises the app.
//
// This plugin adds:
//   1. <uses-permission> entries for every health data type we read
//   2. An <activity-alias> for VIEW_PERMISSION_USAGE (Android <=13)
//   3. HealthConnectPermissionDelegate setup in MainActivity (fixes the
//      "lateinit property requestPermission has not been initialized" crash)
// ---------------------------------------------------------------------------

const {
  withAndroidManifest,
  withMainActivity,
} = require('@expo/config-plugins');

const HEALTH_PERMISSIONS = [
  'android.permission.health.READ_HEART_RATE',
  'android.permission.health.READ_STEPS',
  'android.permission.health.READ_SLEEP',
  'android.permission.health.READ_EXERCISE',
  'android.permission.health.READ_DISTANCE',
  'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
  'android.permission.health.READ_TOTAL_CALORIES_BURNED',
  'android.permission.health.READ_WEIGHT',
  'android.permission.health.READ_HEIGHT',
  'android.permission.health.READ_BODY_FAT',
];

function withHealthConnectPermissions(config) {
  // ---- Step 1: AndroidManifest.xml ----------------------------------------
  config = withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;

    // Add <uses-permission> entries
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    for (const perm of HEALTH_PERMISSIONS) {
      const exists = manifest['uses-permission'].some(
        (p) => p.$?.['android:name'] === perm,
      );
      if (!exists) {
        manifest['uses-permission'].push({
          $: { 'android:name': perm },
        });
      }
    }

    // Add <activity-alias> for VIEW_PERMISSION_USAGE (Android 13 and below)
    const mainApp = manifest.application?.[0];
    if (mainApp) {
      if (!mainApp['activity-alias']) {
        mainApp['activity-alias'] = [];
      }

      const hasAlias = mainApp['activity-alias'].some(
        (a) => a.$?.['android:name'] === 'ViewPermissionUsageActivity',
      );

      if (!hasAlias) {
        mainApp['activity-alias'].push({
          $: {
            'android:name': 'ViewPermissionUsageActivity',
            'android:exported': 'true',
            'android:permission':
              'android.permission.START_VIEW_PERMISSION_USAGE',
            'android:targetActivity': '.MainActivity',
          },
          'intent-filter': [
            {
              action: [
                {
                  $: {
                    'android:name':
                      'android.intent.action.VIEW_PERMISSION_USAGE',
                  },
                },
              ],
              category: [
                {
                  $: {
                    'android:name':
                      'android.intent.category.HEALTH_PERMISSIONS',
                  },
                },
              ],
            },
          ],
        });
      }
    }

    return mod;
  });

  // ---- Step 2: MainActivity – register HealthConnectPermissionDelegate ----
  config = withMainActivity(config, (mod) => {
    let contents = mod.modResults.contents;

    if (!contents.includes('HealthConnectPermissionDelegate')) {
      // Add import
      contents = contents.replace(
        /import expo\.modules\.ReactActivityDelegateWrapper/,
        'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate\nimport expo.modules.ReactActivityDelegateWrapper',
      );

      // Register the delegate in onCreate (must happen before STARTED state)
      contents = contents.replace(
        /super\.onCreate\(null\)/,
        'super.onCreate(null)\n    HealthConnectPermissionDelegate.setPermissionDelegate(this)',
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });

  return config;
}

module.exports = withHealthConnectPermissions;

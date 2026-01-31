// ---------------------------------------------------------------------------
// Helios-Tracker  --  Hook to access fitness data from context
// ---------------------------------------------------------------------------

import React from 'react';
import { DataContext } from '../context/data-context';

/**
 * Access the fitness data context.
 *
 * Uses `React.use` so the context value is read synchronously from the
 * nearest `<DataProvider>`.  Must be called within the provider tree.
 */
export function useFitnessData() {
  const ctx = React.use(DataContext);
  if (ctx === null) {
    throw new Error(
      'useFitnessData must be used within a <DataProvider>',
    );
  }
  return ctx;
}

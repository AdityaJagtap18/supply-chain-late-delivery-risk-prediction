export type ReleaseCategory =
  | 'Added'
  | 'Improved'
  | 'Fixed'
  | 'Changed'
  | 'Security'
  | 'Deprecated'
  | 'Removed';

export interface ReleaseChange {
  category: ReleaseCategory;
  description: string;
}

export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: ReleaseChange[];
  migrationNotes?: string;
}

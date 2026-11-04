export interface TechStackEntry {
  layer: string;
  technology: string;
  details: string;
}

export interface RepositoryFileEntry {
  path: string;
  description: string;
}

export interface RepositoryDirectoryEntry {
  path: string;
  description: string;
  files?: RepositoryFileEntry[];
  children?: RepositoryDirectoryEntry[];
}

export type ArchitectureNodeKind =
  | 'frontend'
  | 'backend'
  | 'ml-service'
  | 'database'
  | 'artifacts'
  | 'scripts'
  | 'infra'
  | 'docs'
  | 'tests';

export interface ArchitectureNode {
  id: string;
  label: string;
  kind: ArchitectureNodeKind;
  description: string;
}

export interface ArchitectureEdge {
  source: string;
  target: string;
  label: string;
  description: string;
}

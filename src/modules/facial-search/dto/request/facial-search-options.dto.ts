export interface FacialSearchOptions {
    similarityThreshold?: number;
    maxResults?: number;
    includeDetails?: boolean;
    filterGender?: string;
    filterAgeRange?: [number, number];
    sortBy?: 'similarity' | 'recent' | 'name';
    familyId?: string; // <-- NEW
  }
  
export type MediaType = 'movie' | 'tv';

export interface MediaItem {
  id: string; // TMDB ID or UUID
  tmdbId: number; // Actual TMDB ID for API calls
  title: string;
  posterPath: string | null;
  releaseYear: string;
  mediaType: MediaType;
  overview?: string;

  // Collaboration Fields
  addedBy?: string; // User email or ID (Legacy/Fallback)
  addedByUserId?: string; // User UUID
  watchedBy?: string[]; // List of user emails/IDs who have watched this
  ratings?: Record<string, number>; // Map of UserID -> Rating

  // Deprecated/Legacy (Migrate to above)
  isWatched?: boolean;
  rating?: number;
}

export interface List {
  id: string;
  name: string;
  items: MediaItem[];
  createdAt: number;
  isShared?: boolean;
  ownerId?: string; // UUID
  ownerName?: string;
  sharedWith?: string[];
}

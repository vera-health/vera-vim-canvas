/**
 * Simplified reference schema for the Vim Canvas app.
 * Adapted from vera-health/vera's ReferenceSchema (db/schema).
 */
export interface ReferenceSchema {
  id?: string;
  title?: string;
  url?: string;
  doi?: string;
  pmid?: string;
  paperId?: string;
  year?: number;
  journal?: string;
  first_author?: string;
  authors?: Array<{ name: string }>;
  publicationVenue?: { name: string };
  abstract?: string;
}

/**
 * Figure metadata from the thread.
 */
export interface ThreadFigureSchema {
  url?: string;
  title?: string;
  source?: string;
  journal?: string;
  year?: number;
  authors?: string[];
  notes?: string;
  keyData?: string;
  purpose?: string;
  doiUrl?: string;
}

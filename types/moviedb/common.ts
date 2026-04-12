export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface MinimalMedia {
  id: number;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
}

/** Genre object as returned on movie/TV detail (and similar) endpoints. */
export interface TMDBGenre {
  id: number;
  name: string;
}

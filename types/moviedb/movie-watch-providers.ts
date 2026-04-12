/**
 * One streaming/rental/purchase provider row (JustWatch-backed).
 * @see [GET /movie/{movie_id}/watch/providers](https://developer.themoviedb.org/reference/movie-watch-providers)
 */
export interface TMDBWatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

/**
 * Watch options for a single region (`results` values are keyed by ISO 3166-1 alpha-2, e.g. `US`, `GB`).
 * Only present monetization arrays are included.
 */
export interface TMDBMovieWatchProvidersCountry {
  link: string;
  flatrate?: TMDBWatchProvider[];
  rent?: TMDBWatchProvider[];
  buy?: TMDBWatchProvider[];
  ads?: TMDBWatchProvider[];
  free?: TMDBWatchProvider[];
}

/**
 * Response from [GET /movie/{movie_id}/watch/providers](https://developer.themoviedb.org/reference/movie-watch-providers).
 */
export interface TMDBMovieWatchProviders {
  id: number;
  results: Record<string, TMDBMovieWatchProvidersCountry>;
}

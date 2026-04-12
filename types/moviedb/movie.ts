import type { MinimalMedia, TMDBGenre, TMDBResponse } from "./common";
import type { Credits } from "./credits";
import type {
  TMDBCollection,
  TMDBProductionCompany,
  TMDBProductionCountry,
  TMDBSpokenLanguage,
  TMDBVideos,
} from "./movie-entities";

export interface Movie extends MinimalMedia {
  title: string;
  original_title: string;
  release_date: string;
  video: boolean;
  adult: boolean;
}

/**
 * Full movie payload from [GET /movie/{movie_id}](https://developer.themoviedb.org/reference/movie-details).
 * List endpoints include `genre_ids`; the details endpoint uses `genres` instead, so `genre_ids` is optional here.
 */
export interface MovieDetails extends Omit<Movie, "genre_ids"> {
  genre_ids?: number[];
  belongs_to_collection: TMDBCollection | null;
  budget: number;
  genres: TMDBGenre[];
  homepage: string;
  imdb_id: string | null;
  origin_country: string[];
  original_language: string;
  production_companies: TMDBProductionCompany[];
  production_countries: TMDBProductionCountry[];
  revenue: number;
  runtime: number | null;
  spoken_languages: TMDBSpokenLanguage[];
  status: string;
  tagline: string;
  /** Appended via `append_to_response=credits`. */
  credits?: Credits;
  /** Appended via `append_to_response=videos`. */
  videos?: TMDBVideos;
}

/** [GET /movie/{movie_id}/similar](https://developer.themoviedb.org/reference/movie-similar) — paginated list of similar movies. */
export type TMDBMovieSimilarResponse = TMDBResponse<Movie>;

/** [GET /movie/{movie_id}/recommendations](https://developer.themoviedb.org/reference/movie-recommendations) — paginated recommendations. */
export type TMDBMovieRecommendationsResponse = TMDBResponse<Movie>;

import type { TMDBResponse } from "./common";

/** Author block on each review from [GET /movie/{movie_id}/reviews](https://developer.themoviedb.org/reference/movie-reviews). */
export interface TMDBReviewAuthorDetails {
  name: string;
  username: string;
  avatar_path: string | null;
  /** TMDB user rating for this title, 0–10, or null if not set. */
  rating: number | null;
}

/** One review in the `results` array. */
export interface TMDBMovieReview {
  author: string;
  author_details: TMDBReviewAuthorDetails;
  content: string;
  created_at: string;
  id: string;
  updated_at: string;
  url: string;
}

/**
 * Response from [GET /movie/{movie_id}/reviews](https://developer.themoviedb.org/reference/movie-reviews).
 * Paginated (`page`, `total_pages`, …); `id` is the movie id.
 */
export interface TMDBMovieReviewsResponse extends TMDBResponse<TMDBMovieReview> {
  id: number;
}

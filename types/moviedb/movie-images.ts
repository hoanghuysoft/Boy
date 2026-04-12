/**
 * Single image entry from [GET /movie/{movie_id}/images](https://developer.themoviedb.org/reference/movie-images)
 * (backdrops, posters, and logos share this shape).
 */
export interface TMDBMovieImage {
  aspect_ratio: number;
  height: number;
  iso_639_1: string | null;
  file_path: string;
  vote_average: number;
  vote_count: number;
  width: number;
}

/**
 * Response from [GET /movie/{movie_id}/images](https://developer.themoviedb.org/reference/movie-images).
 */
export interface TMDBMovieImages {
  id: number;
  backdrops: TMDBMovieImage[];
  logos: TMDBMovieImage[];
  posters: TMDBMovieImage[];
}

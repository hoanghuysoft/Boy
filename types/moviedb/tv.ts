import type { MinimalMedia, TMDBGenre } from "./common";

export interface TVShow extends MinimalMedia {
  name: string;
  original_name: string;
  first_air_date: string;
  origin_country: string[];
}

export interface TVShowDetails extends TVShow {
  episode_run_time: number[];
  genres: TMDBGenre[];
  status: string;
  type: string;
  tagline: string;
  number_of_episodes: number;
  number_of_seasons: number;
}

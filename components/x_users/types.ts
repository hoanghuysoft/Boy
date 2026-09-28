export type FilterType = 'all' | 'following' | 'custom' | 'unfollowed';

export interface FilterCounts {
  all: number;
  following: number;
  custom: number;
  unfollowed: number;
}

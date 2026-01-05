export interface Workplace {
    id: string;
    profile_id: string;
    company_name: string;
    position: string;
    location: string;
    start_date: string;
    end_date: string | null;
    description: string;
    created_at: string;
}
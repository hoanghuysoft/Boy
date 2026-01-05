import { client } from "./client";

export const getWorkplace = async (id: string) => {
    const response = await client.get(`/api/profiles/${id}/workplaces`);
    return response.data.data;
};
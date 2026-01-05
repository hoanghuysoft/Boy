import axios from "axios";

export const getTiktokProfile = async (username: string) => {
    const input = {
        "profiles": [
            username
        ],
        "profileScrapeSections": [
            "videos"
        ],
        "profileSorting": "latest",
        "resultsPerPage": 100,
        "excludePinnedPosts": false,
        "shouldDownloadVideos": false,
        "shouldDownloadCovers": false,
        "shouldDownloadSubtitles": false,
        "shouldDownloadSlideshowImages": false,
        "shouldDownloadAvatars": false
    };

    // Use Apify REST API to run the actor
    const actorId = "0FXVyOXXEmdGcV88a";
    const token = process.env.EXPO_PUBLIC_APIFY_TOKEN;

    if (!token) {
        console.error("APIFY_TOKEN is missing");
        return;
    }

    try {
        console.log('Starting Apify actor run...');
        // Start the run and wait for it to finish (up to 300s by default if waitForFinish is set)
        const runResponse = await axios.post(
            `https://api.apify.com/v2/acts/${actorId}/runs`,
            input,
            {
                params: {
                    token: token,
                    waitForFinish: 120, // Wait up to 120 seconds
                },
            }
        );

        const runData = runResponse.data.data;
        const defaultDatasetId = runData.defaultDatasetId;

        console.log('Actor run finished. Fetching results from dataset:', defaultDatasetId);

        // Fetch results from the dataset
        const datasetResponse = await axios.get(
            `https://api.apify.com/v2/datasets/${defaultDatasetId}/items`,
            {
                params: {
                    token: token,
                },
            }
        );

        const items = datasetResponse.data;
        console.log(items);
    } catch (error) {
        console.error("Error running Apify actor:", error);
    }
};
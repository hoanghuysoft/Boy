import { useSectionsQuery, useSliderQuery } from "@/services/shows";

export function useHomeViewModel() {

    const { data: slider,
        isLoading: isLoadingSlider,
        isRefetching: isRefetchingSlider,
        isError: isErrorSlider,
        refetch: refetchSlider,
    } = useSliderQuery();

    const { data: sections,
        isLoading: isLoadingSections,
        isRefetching: isRefetchingSections,
        isError: isErrorSections,
        refetch: refetchSections,
    } = useSectionsQuery();

    return {
        slider,
        sections,
        isLoadingSlider,
        isLoadingSections,
        isRefetchingSlider,
        isRefetchingSections,
        isErrorSlider,
        isErrorSections,
        refetchSlider,
        refetchSections,
    }
}
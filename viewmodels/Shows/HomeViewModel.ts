import { useSectionsQuery, useSliderQuery } from "@/services/shows";

export function useHomeViewModel(enabled: boolean = true) {

    const { data: slider,
        isLoading: isLoadingSlider,
        isRefetching: isRefetchingSlider,
        isError: isErrorSlider,
        refetch: refetchSlider,
    } = useSliderQuery(enabled);

    const { data: sections,
        isLoading: isLoadingSections,
        isRefetching: isRefetchingSections,
        isError: isErrorSections,
        refetch: refetchSections,
    } = useSectionsQuery(enabled);

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
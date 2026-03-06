import { FProfileGroupsList } from '@/components/fprofile';
import { FBGroupList } from '@/types/localfb';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

interface FProfileGroupsTabProps {
    groups: FBGroupList | null;
    fbColors: any;
    formatCount: (count: number) => string;
}

const FProfileGroupsTab: React.FC<FProfileGroupsTabProps> = ({
    groups,
    fbColors,
    formatCount,
}) => {
    return (
        <ScrollView
            style={[styles.container, { backgroundColor: fbColors.contentBg }]}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <FProfileGroupsList
                groups={groups}
                fbColors={fbColors}
                formatCount={formatCount}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingBottom: 80,
    },
});

export default FProfileGroupsTab;

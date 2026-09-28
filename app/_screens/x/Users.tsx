import {
    FilterCounts,
    FilterType,
    GRID_GAP,
    HORIZONTAL_PADDING,
    NUM_COLUMNS,
    XAddUserDialog,
    XRootAccountDialog,
    XUserActionSheet,
    XUserCard,
    XUsersBottomSearchBar,
    XUsersEmptyState,
    XUsersFilterChips,
    XUsersFooter,
    XUsersHeader,
} from '@/components/x_users';
import { useThemeContext } from '@/context/ThemeContext';
import { getFxUserProfile } from '@/services/fxtwitter/api';
import { useFxUserFollowing } from '@/services/fxtwitter/hooks';
import type { FxTwitterUser } from '@/services/fxtwitter/types';
import { useXUsersStore, type XStoredUser } from '@/stores/xUsers';
import { BlurTargetView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useToast } from 'heroui-native/toast';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UsersScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors } = useThemeContext();
    const { toast } = useToast();

    // ─── Store State ─────────────────────────────────────────────────────────────
    const {
        rootUsername,
        users,
        hasPromptedRootDialog,
        setRootUsername,
        setHasPromptedRootDialog,
        addCustomUser,
        removeUser,
        toggleUnfollow,
        syncFollowingUsers,
    } = useXUsersStore();

    // ─── Local UI State ──────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');

    // Dialog & Modal States
    const [isRootDialogOpen, setIsRootDialogOpen] = useState(false);
    const [rootInput, setRootInput] = useState(rootUsername || '');

    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
    const [addUserInput, setAddUserInput] = useState('');
    const [isAddingUser, setIsAddingUser] = useState(false);

    const [selectedUser, setSelectedUser] = useState<XStoredUser | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    // ─── FxTwitter Following Query ───────────────────────────────────────────────
    const followingQuery = useFxUserFollowing(rootUsername || '', {
        count: 100,
        enabled: !!rootUsername && rootUsername.trim().length > 0,
    });

    // ─── Prompt Root Username on First Visit ─────────────────────────────────────
    useEffect(() => {
        if (!rootUsername && !hasPromptedRootDialog) {
            const timer = setTimeout(() => {
                setIsRootDialogOpen(true);
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [rootUsername, hasPromptedRootDialog]);

    // ─── Auto Sync Fetched Following List ────────────────────────────────────────
    useEffect(() => {
        if (followingQuery.data?.pages) {
            const fetched: FxTwitterUser[] = [];
            for (const page of followingQuery.data.pages) {
                if (page?.results && Array.isArray(page.results)) {
                    fetched.push(...page.results);
                }
            }
            if (fetched.length > 0) {
                syncFollowingUsers(fetched);
            }
        }
    }, [followingQuery.data, syncFollowingUsers]);

    // ─── Handlers ────────────────────────────────────────────────────────────────
    const handleSaveRootUsername = useCallback(async () => {
        const clean = rootInput.trim().replace(/^@/, '');
        if (!clean) {
            toast.show({
                label: 'Lỗi',
                description: 'Vui lòng nhập X username',
                variant: 'danger',
            });
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setRootUsername(clean);
        setHasPromptedRootDialog(true);
        setIsRootDialogOpen(false);

        toast.show({
            label: 'Đã lưu tài khoản X',
            description: `Bắt đầu đồng bộ danh sách following của @${clean}`,
            variant: 'success',
        });

        followingQuery.refetch();
    }, [rootInput, setRootUsername, setHasPromptedRootDialog, toast, followingQuery]);

    const handleSkipRootDialog = useCallback(() => {
        setHasPromptedRootDialog(true);
        setIsRootDialogOpen(false);
    }, [setHasPromptedRootDialog]);

    const handleAddCustomUser = useCallback(async () => {
        const clean = addUserInput.trim().replace(/^@/, '');
        if (!clean) {
            toast.show({
                label: 'Lỗi',
                description: 'Vui lòng nhập username',
                variant: 'danger',
            });
            return;
        }

        try {
            setIsAddingUser(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            const profileResponse = await getFxUserProfile({ handle: clean });
            if (!profileResponse?.user) {
                throw new Error('User not found');
            }

            addCustomUser(profileResponse.user);
            setAddUserInput('');
            setIsAddUserDialogOpen(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            toast.show({
                label: 'Thành công',
                description: `Đã thêm @${profileResponse.user.screen_name} vào danh sách`,
                variant: 'success',
            });
        } catch {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.show({
                label: 'Không tìm thấy user',
                description: `Không thể tìm thấy tài khoản @${clean} trên X`,
                variant: 'danger',
            });
        } finally {
            setIsAddingUser(false);
        }
    }, [addUserInput, addCustomUser, toast]);

    const handleRefresh = useCallback(async () => {
        if (!rootUsername) {
            setIsRootDialogOpen(true);
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await followingQuery.refetch();
    }, [rootUsername, followingQuery]);

    const handleOpenProfile = useCallback(
        (user: XStoredUser) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({
                pathname: '/x_profile',
                params: { handle: user.screen_name },
            });
        },
        [router]
    );

    const handleUserLongPress = useCallback((user: XStoredUser) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedUser(user);
        setIsActionModalOpen(true);
    }, []);

    // ─── Infinite Scroll Loading ────────────────────────────────────────────────
    const handleEndReached = useCallback(() => {
        if (
            rootUsername &&
            filter !== 'custom' &&
            followingQuery.hasNextPage &&
            !followingQuery.isFetchingNextPage
        ) {
            followingQuery.fetchNextPage();
        }
    }, [rootUsername, filter, followingQuery]);

    // ─── Filtered & Sorted Data ──────────────────────────────────────────────────
    const userList = useMemo(() => {
        const list = Object.values(users);

        return list
            .filter((u) => {
                if (searchQuery.trim()) {
                    const q = searchQuery.trim().toLowerCase();
                    const matchName = u.name?.toLowerCase().includes(q);
                    const matchHandle = u.screen_name?.toLowerCase().includes(q);
                    if (!matchName && !matchHandle) return false;
                }

                if (filter === 'following') {
                    return u.source === 'following' && !u.isUnfollowed;
                }
                if (filter === 'custom') {
                    return u.source === 'custom' && !u.isUnfollowed;
                }
                if (filter === 'unfollowed') {
                    return !!u.isUnfollowed;
                }
                return true;
            })
            .sort((a, b) => b.importedAt - a.importedAt);
    }, [users, searchQuery, filter]);

    const counts: FilterCounts = useMemo(() => {
        const list = Object.values(users);
        return {
            all: list.length,
            following: list.filter((u) => u.source === 'following' && !u.isUnfollowed).length,
            custom: list.filter((u) => u.source === 'custom' && !u.isUnfollowed).length,
            unfollowed: list.filter((u) => !!u.isUnfollowed).length,
        };
    }, [users]);

    const blurTargetRef = useRef<any>(null);

    // ─── Render Item ────────────────────────────────────────────────────────────
    const renderItem = useCallback(
        ({ item }: { item: XStoredUser }) => (
            <XUserCard
                item={item}
                onPress={handleOpenProfile}
                onLongPress={handleUserLongPress}
            />
        ),
        [handleOpenProfile, handleUserLongPress]
    );

    return (
        <View style={[styles.screen, { backgroundColor: colors.surface }]}>
            <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
                {/* ─── Top Navigation Bar ──────────────────────────────────────────────── */}
                <XUsersHeader
                    topInset={insets.top}
                    rootUsername={rootUsername}
                    isFetching={followingQuery.isFetching}
                    onOpenRootDialog={() => {
                        setRootInput(rootUsername || '');
                        setIsRootDialogOpen(true);
                    }}
                    onRefresh={handleRefresh}
                    onOpenAddUserDialog={() => {
                        setAddUserInput('');
                        setIsAddUserDialogOpen(true);
                    }}
                />

                {/* ─── Top Filter Chips Row ──────────────────────────────────────────── */}
                <XUsersFilterChips
                    filter={filter}
                    onFilterChange={setFilter}
                    counts={counts}
                />

                {/* ─── Main 3-Column Grid ──────────────────────────────────────────────── */}
                <FlatList
                    data={userList}
                    keyExtractor={(item) => item.screen_name.toLowerCase()}
                    numColumns={NUM_COLUMNS}
                    renderItem={renderItem}
                    contentContainerStyle={[
                        styles.gridContent,
                        {
                            paddingBottom: insets.bottom + 16 + 58 + 24,
                        },
                    ]}
                    columnWrapperStyle={styles.gridRow}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        <XUsersFooter
                            isFetchingNextPage={followingQuery.isFetchingNextPage}
                            hasNextPage={followingQuery.hasNextPage}
                            hasUsers={userList.length > 0}
                            hasRootUsername={!!rootUsername}
                            isCustomFilter={filter === 'custom'}
                        />
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={followingQuery.isFetching}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <XUsersEmptyState
                            searchQuery={searchQuery}
                            rootUsername={rootUsername}
                            onOpenRootDialog={() => setIsRootDialogOpen(true)}
                            onOpenAddUserDialog={() => setIsAddUserDialogOpen(true)}
                        />
                    }
                />
            </BlurTargetView>
            <XUsersBottomSearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                blurTargetRef={blurTargetRef}
                bottomInset={insets.bottom}
            />
            {/* ─── Dialogs & Modals ────────────────────────────────────────────────── */}
            <XRootAccountDialog
                isOpen={isRootDialogOpen}
                onOpenChange={setIsRootDialogOpen}
                rootInput={rootInput}
                onChangeRootInput={setRootInput}
                onSave={handleSaveRootUsername}
                onSkip={handleSkipRootDialog}
            />

            <XAddUserDialog
                isOpen={isAddUserDialogOpen}
                onOpenChange={setIsAddUserDialogOpen}
                addUserInput={addUserInput}
                onChangeAddUserInput={setAddUserInput}
                isAddingUser={isAddingUser}
                onAdd={handleAddCustomUser}
                onCancel={() => setIsAddUserDialogOpen(false)}
            />

            <XUserActionSheet
                isOpen={isActionModalOpen}
                onClose={() => setIsActionModalOpen(false)}
                user={selectedUser}
                bottomInset={insets.bottom}
                onOpenProfile={handleOpenProfile}
                onToggleUnfollow={toggleUnfollow}
                onRemoveUser={removeUser}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    gridContent: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingTop: 10,
    },
    gridRow: {
        justifyContent: 'flex-start',
        gap: GRID_GAP,
        marginBottom: GRID_GAP,
    },
});

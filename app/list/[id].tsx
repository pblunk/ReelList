import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';

import { CinematicHeader } from '../../components/CinematicHeader';
import { CollapsibleSection } from '../../components/CollapsibleSection';
import { ListItem } from '../../components/ListItem';
import { StarRating } from '../../components/StarRating';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useProfile } from '../../hooks/useProfile';

export default function ListDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { lists, deleteList, removeItemFromList, updateList, toggleWatched } = useStore();
    const { user } = useAuth();
    const userEmail = user?.email || 'Anonymous';

    // Profile fetching
    const { getProfile } = useProfile();
    const [listOwnerName, setListOwnerName] = useState<string | null>(null);

    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const theme = Colors[colorScheme];

    const [isEditNameVisible, setIsEditNameVisible] = useState(false);

    // Sharing State
    const [newListName, setNewListName] = useState('');

    const list = lists.find((l) => l.id === id);

    useEffect(() => {
        if (list?.ownerId) {
            getProfile(list.ownerId).then(p => {
                if (p?.display_name) setListOwnerName(p.display_name);
            });
        }
    }, [list?.ownerId, getProfile]);

    if (!list) {
        return (
            <View style={[styles.center, { backgroundColor: theme.secondaryBackground }]}>
                <Text style={{ color: theme.text }}>List not found</Text>
            </View>
        );
    }

    const isOwned = !list.isShared;

    // Filter Items based on User Watched Status
    const toWatchItems = list.items.filter(i => {
        const watchedBy = i.watchedBy || [];
        return !watchedBy.includes(userEmail); // Items NOT watched by me
    });

    const watchedItems = list.items.filter(i => {
        const watchedBy = i.watchedBy || [];
        return watchedBy.includes(userEmail); // Items WATCHED by me
    });

    const handleDelete = () => {
        Alert.alert('Delete List', 'Are you sure you want to delete this list?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    deleteList(list.id);
                    router.back();
                },
            },
        ]);
    };

    const handleLeave = () => {
        Alert.alert('Leave List', 'Are you sure you want to leave this shared list?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Leave',
                style: 'destructive',
                onPress: () => {
                    deleteList(list.id); // Local "delete" simulates leaving
                    router.back();
                },
            },
        ]);
    };

    const handleEditName = () => {
        setNewListName(list.name);
        setIsEditNameVisible(true);
    };

    const saveListName = () => {
        if (newListName.trim()) {
            updateList(list.id, { name: newListName.trim() });
            setIsEditNameVisible(false);
        }
    };

    const openShareModal = () => {
        router.push({
            pathname: '/share',
            params: { listId: list.id }
        });
    };

    const handleCopyLink = async () => {
        // Create a deep link 
        const link = `reellist://list/${list.id}`;
        await Clipboard.setStringAsync(link);
        Alert.alert("Link Copied", "Share link copied to clipboard.");
    };

    // Generate Sharing Subtitle
    let shareSubtitle = undefined;
    if (list.isShared) {
        shareSubtitle = `Shared by ${listOwnerName || list.ownerName}`;
    } else if (list.sharedWith && list.sharedWith.length > 0) {
        const count = list.sharedWith.length;
        shareSubtitle = `Shared with ${count} ${count === 1 ? 'person' : 'people'}`;
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen
                options={{
                    header: () => (
                        <CinematicHeader
                            title={list.name}
                            subtitle={shareSubtitle}
                            showBack={true}
                            onTitlePress={isOwned ? handleEditName : undefined}
                            rightElement={
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {/* Share Action / Info */}
                                    <TouchableOpacity
                                        onPress={openShareModal}
                                        style={{ marginRight: 16 }}
                                    >
                                        <Ionicons
                                            name={isOwned ? "share-outline" : "people"}
                                            size={24}
                                            color={theme.tint}
                                        />
                                    </TouchableOpacity>

                                    {/* Delete / Leave Action */}
                                    <TouchableOpacity onPress={isOwned ? handleDelete : handleLeave}>
                                        <Ionicons
                                            name={isOwned ? "trash-outline" : "log-out-outline"}
                                            size={24}
                                            color={theme.danger}
                                        />
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    ),
                }}
            />

            <ScrollView contentContainerStyle={styles.listContent}>
                {/* Search at TOP */}
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.card }]}
                    onPress={() => router.push({ pathname: '/search', params: { listId: list.id } })}
                >
                    <Ionicons name="search" size={20} color={theme.tint} style={{ marginRight: 8 }} />
                    <Text style={[styles.addButtonText, { color: theme.tint }]}>Add Movies & TV Shows</Text>
                </TouchableOpacity>

                <CollapsibleSection title="To Watch" defaultExpanded={true}>
                    {toWatchItems.map(item => (
                        <ListItem
                            key={item.id}
                            title={item.title}
                            subtitle={`${item.releaseYear} • ${item.mediaType === 'movie' ? 'Movie' : 'TV'}`}
                            image={item.posterPath}
                            addedBy={list.isShared && item.addedBy ? item.addedBy : undefined}
                            addedByUserId={list.isShared && item.addedByUserId ? item.addedByUserId : undefined}
                            onPress={() => router.push({
                                pathname: '/details/[id]',
                                params: { id: item.id, listId: list.id, itemId: item.id }
                            })}
                            showChevron={false}
                            isDestructive={false}
                            rightElement={
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {/* Quick Watch Toggle */}
                                    <TouchableOpacity
                                        onPress={() => toggleWatched(list.id, item.id)}
                                        style={{ padding: 8 }}
                                    >
                                        <Ionicons name="ellipse-outline" size={24} color={theme.icon} />
                                    </TouchableOpacity>

                                    {/* Delete (Only allowed for now from Detail, or if owner) */}
                                    {/* For MVP let's allow remove if owner, or if I added it? 
                                        Keeping simple: remove button works for now, permissions later.
                                    */}
                                    {/* Delete (Only allowed if list owner OR item creator) */}
                                    {(isOwned || item.addedBy === userEmail) && (
                                        <TouchableOpacity
                                            onPress={() => removeItemFromList(list.id, item.id)}
                                            style={{ padding: 8 }}
                                        >
                                            <Ionicons name="remove-circle-outline" size={24} color={theme.danger} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            }
                        />
                    ))}
                    {toWatchItems.length === 0 && (
                        <Text style={{ color: theme.textSecondary, padding: 16, fontStyle: 'italic', textAlign: 'center' }}>
                            All caught up!
                        </Text>
                    )}
                </CollapsibleSection>

                <CollapsibleSection title="Watched" defaultExpanded={false}>
                    {watchedItems.map(item => {
                        // Calculate my rating
                        const myRating = item.ratings?.[userEmail] || 0;

                        return (
                            <ListItem
                                key={item.id}
                                title={item.title}
                                subtitle={`${item.releaseYear}`}
                                image={item.posterPath}
                                addedBy={list.isShared && item.addedBy ? item.addedBy : undefined}
                                addedByUserId={list.isShared && item.addedByUserId ? item.addedByUserId : undefined}
                                onPress={() => router.push({
                                    pathname: '/details/[id]',
                                    params: { id: item.id, listId: list.id, itemId: item.id }
                                })}
                                showChevron={false}
                                rightElement={
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {/* Toggle Unwatch */}
                                        <TouchableOpacity
                                            onPress={() => toggleWatched(list.id, item.id)}
                                            style={{ padding: 8, marginRight: 4 }}
                                        >
                                            <Ionicons name="checkmark-circle" size={24} color={theme.tint} />
                                        </TouchableOpacity>

                                        {myRating > 0 && (
                                            <StarRating rating={myRating} size={14} readonly />
                                        )}
                                    </View>
                                }
                            />
                        );
                    })}
                    {watchedItems.length === 0 && (
                        <Text style={{ color: theme.textSecondary, padding: 16, fontStyle: 'italic', textAlign: 'center' }}>
                            No watched items yet.
                        </Text>
                    )}
                </CollapsibleSection>
            </ScrollView>

            {/* Edit Name Modal */}
            <Modal
                transparent
                visible={isEditNameVisible}
                animationType="fade"
                onRequestClose={() => setIsEditNameVisible(false)}
            >
                <View style={[styles.modalOverlay]}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Edit List Name</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.secondaryBackground }]}
                            value={newListName}
                            onChangeText={setNewListName}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalButton} onPress={() => setIsEditNameVisible(false)}>
                                <Text style={{ color: theme.textSecondary, fontSize: 17 }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveListName}>
                                <Text style={{ color: theme.tint, fontWeight: '600', fontSize: 17 }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 40,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc', // Will be overridden by theme usually but simple here
        marginBottom: 20,
    },
    addButtonText: {
        fontSize: 17,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 14,
        padding: 24,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 44,
        borderRadius: 10,
        paddingHorizontal: 12,
        marginBottom: 24,
        borderWidth: 1,
        fontSize: 16,
    },
    miniInput: {
        height: 40,
        borderRadius: 8,
        paddingHorizontal: 10,
        fontSize: 15,
        marginRight: 8,
    },
    miniButton: {
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        height: 40,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
    },
    saveButton: {
        borderLeftWidth: 0,
    }
});

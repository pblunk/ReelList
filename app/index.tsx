import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';

import { CinematicHeader } from '../components/CinematicHeader';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { ListItem } from '../components/ListItem';
import { Colors } from '../constants/Colors';
import { useStore } from '../context/StoreContext';

export default function ListsScreen() {
    const { lists, addList, isLoading } = useStore();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [isModalVisible, setIsModalVisible] = React.useState(false);
    const [newListName, setNewListName] = React.useState('');

    const handleCreateList = () => {
        setNewListName('');
        setIsModalVisible(true);
    };

    const confirmCreateList = () => {
        if (newListName.trim()) {
            addList(newListName.trim());
            setIsModalVisible(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen
                options={{
                    header: () => (
                        <CinematicHeader
                            rightElement={
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                                    <TouchableOpacity onPress={() => router.push('/settings')}>
                                        <Ionicons name="settings-outline" size={24} color={theme.tint} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => router.push('/watched')}>
                                        <Ionicons name="time-outline" size={28} color={theme.tint} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleCreateList}>
                                        <Ionicons name="add-circle" size={32} color={theme.tint} />
                                    </TouchableOpacity>
                                </View>
                            }
                        />
                    ),
                }}
            />
            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
                    <ActivityIndicator size="large" color={theme.tint} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContent}>
                    <CollapsibleSection title="My Lists">
                        {lists.filter(l => !l.isShared).map(item => (
                            <ListItem
                                key={item.id}
                                title={item.name}
                                subtitle={`${item.items.length} items`}
                                onPress={() => router.push(`/list/${item.id}`)}
                                rightElement={null}
                            />
                        ))}
                        {lists.filter(l => !l.isShared).length === 0 && (
                            <Text style={{ color: theme.textSecondary, padding: 16, fontStyle: 'italic' }}>No lists yet.</Text>
                        )}
                    </CollapsibleSection>

                    <CollapsibleSection title="Shared With Me">
                        {lists.filter(l => l.isShared).map(item => (
                            <ListItem
                                key={item.id}
                                title={item.name}
                                subtitle={`Shared by ${item.ownerName || 'Unknown'} • ${item.items.length} items`}
                                onPress={() => router.push(`/list/${item.id}`)}
                                rightElement={<Ionicons name="people-outline" size={16} color={theme.icon} />}
                            />
                        ))}
                        {lists.filter(l => l.isShared).length === 0 && (
                            <Text style={{ color: theme.textSecondary, padding: 16, fontStyle: 'italic' }}>No shared lists.</Text>
                        )}
                    </CollapsibleSection>
                </ScrollView>
            )}

            <Modal
                transparent
                visible={isModalVisible}
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>New List</Text>
                        <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Enter a name for your list</Text>

                        <TextInput
                            style={[styles.input, {
                                backgroundColor: theme.secondaryBackground,
                                color: theme.text,
                                borderColor: theme.border
                            }]}
                            placeholder="List Name"
                            placeholderTextColor={theme.icon}
                            value={newListName}
                            onChangeText={setNewListName}
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={() => setIsModalVisible(false)}
                            >
                                <Text style={{ color: theme.icon, fontSize: 17 }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.createButton]}
                                onPress={confirmCreateList}
                            >
                                <Text style={{ color: theme.tint, fontWeight: '600', fontSize: 17 }}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingTop: 20,
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
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 20,
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
    createButton: {
        borderLeftWidth: 0,
    }
});

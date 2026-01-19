import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { List, MediaItem } from '../types';
import { useAuth } from './AuthContext';

interface StoreContextType {
    lists: List[];
    isLoading: boolean;
    refreshLists: () => Promise<void>;
    addList: (name: string) => Promise<void>;
    deleteList: (id: string) => Promise<void>;
    addItemToList: (listId: string, item: MediaItem) => Promise<void>;
    removeItemFromList: (listId: string, itemId: string) => Promise<void>;
    updateItem: (listId: string, itemId: string, updates: Partial<MediaItem>) => Promise<void>;
    updateList: (listId: string, updates: Partial<List>) => Promise<void>;
    toggleWatched: (listId: string, itemId: string) => Promise<void>;
    rateItem: (listId: string, itemId: string, rating: number) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
    const { user, session } = useAuth();
    const userEmail = user?.email || 'Anonymous';
    const [lists, setLists] = useState<List[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch all connected data
    const fetchLists = async () => {
        if (!user) {
            setLists([]);
            return;
        }

        try {
            // 1. Fetch Lists (Owned or Shared)
            const { data: listsData, error: listsError } = await supabase
                .from('lists')
                .select('*')
                .order('created_at', { ascending: false });

            if (listsError) throw listsError;

            // 2. Fetch Items for these lists
            const listIds = listsData.map(l => l.id);
            const { data: itemsData, error: itemsError } = await supabase
                .from('list_items')
                .select('*')
                .in('list_id', listIds);

            if (itemsError) throw itemsError;

            // 3. Fetch Watched Status (My Watched Items)
            const { data: watchedData, error: watchedError } = await supabase
                .from('watched_items')
                .select('list_item_id')
                .eq('user_id', user.id);

            // 4. Fetch Ratings
            const itemIds = itemsData ? itemsData.map(i => i.id) : [];
            const { data: ratingsData, error: ratingsError } = await supabase
                .from('item_ratings')
                .select('list_item_id, user_id, rating, user_email') // Fetch email
                .in('list_item_id', itemIds);

            // 5. Fetch Shares (to know who lists are shared with)
            const { data: sharesData, error: sharesError } = await supabase
                .from('list_shares')
                .select('*')
                .in('list_id', listIds);


            // Assemble Data Structure
            if (listsData) {
                const myWatchedIds = new Set(watchedData?.map(w => w.list_item_id));

                const structuredLists: List[] = listsData.map(l => {
                    const listItems = itemsData?.filter(i => i.list_id === l.id) || [];
                    const listShares = sharesData?.filter(s => s.list_id === l.id) || [];

                    // Map Items
                    const mappedItems: MediaItem[] = listItems.map(i => {
                        // Gather ratings
                        const itemRatingsRaw = ratingsData?.filter(r => r.list_item_id === i.id) || [];
                        const ratingsMap: Record<string, number> = {};
                        itemRatingsRaw.forEach(r => {
                            // Use email if available (new schema), fallback to ID logic locally if needed
                            const key = r.user_email || r.user_id;
                            ratingsMap[key] = r.rating;
                        });

                        // Watched By? We only fetched MY watched status efficiently.
                        // To show "Watched by X, Y", we'd need all watched records.
                        // Let's assume for MVP we fetch all watched for these items.
                        // (If scaling issues, we'd optimize)

                        return {
                            id: i.id,
                            tmdbId: i.tmdb_id,
                            title: i.title,
                            posterPath: i.poster_path,
                            mediaType: i.media_type as any,
                            releaseYear: i.release_year,
                            overview: i.overview,
                            addedBy: i.added_by_email || i.added_by, // Use email if triggered, else ID (Legacy)
                            addedByUserId: i.added_by, // Explicit UUID
                            watchedBy: myWatchedIds.has(i.id) ? [userEmail] : [], // Simplification: Only tracking ME for now unless we query all
                            ratings: ratingsMap
                        };
                    });

                    // Determine simplified sharedWith list (emails)
                    const sharedWithEmails = listShares.map(s => s.user_email);

                    return {
                        id: l.id,
                        name: l.name,
                        createdAt: new Date(l.created_at).getTime(),
                        items: mappedItems,
                        ownerId: l.owner_id,
                        ownerName: l.owner_id === user.id ? userEmail : 'Shared List', // Fallback
                        isShared: l.owner_id !== user.id, // If I don't own it, it's shared with me
                        sharedWith: sharedWithEmails
                    };
                });
                setLists(structuredLists);
            }
        } catch (e) {
            console.error("Error fetching data:", e);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchLists();
    }, [user]);

    const addList = async (name: string) => {
        if (!user) return;
        const { error } = await supabase.from('lists').insert({
            name,
            owner_id: user.id
        });
        if (error) console.error(error);
        else fetchLists();
    };

    const deleteList = async (id: string) => {
        if (!user) return;
        // Check ownership locally or rely on RLS
        // If shared (leaving), we delete from list_shares
        const list = lists.find(l => l.id === id);
        if (list?.isShared) {
            // Leave list
            const { error } = await supabase.from('list_shares')
                .delete()
                .match({ list_id: id, user_email: user.email }); // Helper needs email
            if (error) console.error("Error leaving list", error);
        } else {
            // Delete owned list
            const { error } = await supabase.from('lists').delete().match({ id });
            if (error) console.error("Error deleting list", error);
        }
        fetchLists();
    };

    const addItemToList = async (listId: string, item: MediaItem) => {
        if (!user) return;
        // Prepare item payload
        const payload = {
            list_id: listId,
            tmdb_id: item.tmdbId,
            title: item.title,
            media_type: item.mediaType,
            poster_path: item.posterPath,
            overview: item.overview,
            release_year: item.releaseYear,
            added_by: user.id
        };

        const { error } = await supabase.from('list_items').insert(payload);
        if (error) console.error("Error adding item", error);
        else fetchLists(); // Optimistic update would be better but reloading ensures IDs
    };

    const removeItemFromList = async (listId: string, itemId: string) => {
        if (!user) return;
        // RLS handles permission checks (Owner or Creator)
        const { error } = await supabase.from('list_items').delete().match({ id: itemId });
        if (error) {
            console.error("Error removing item", error);
            // Could show alert if RLS blocked it
        }
        else fetchLists();
    };

    const updateItem = async (listId: string, itemId: string, updates: Partial<MediaItem>) => {
        // Not used much yet except maybe local state?
        // No DB equivalent for editing item details yet.
    };

    const updateList = async (listId: string, updates: Partial<List>) => {
        if (!user) return;

        // Handle Renaming
        if (updates.name) {
            await supabase.from('lists').update({ name: updates.name }).match({ id: listId });
        }

        // Handle Sharing (Invite)
        if (updates.sharedWith) {
            // We just look for the NEW email (diff)
            const list = lists.find(l => l.id === listId);
            const oldShared = list?.sharedWith || [];
            const newShared = updates.sharedWith || [];

            // Find added emails
            const added = newShared.filter(e => !oldShared.includes(e));

            for (const email of added) {
                await supabase.from('list_shares').insert({
                    list_id: listId,
                    user_email: email
                });
            }
        }
        fetchLists();
    };

    const toggleWatched = async (listId: string, itemId: string) => {
        if (!user) return;
        // Check if currently watched
        const list = lists.find(l => l.id === listId);
        const item = list?.items.find(i => i.id === itemId);
        const isWatched = item?.watchedBy?.includes(userEmail); // Local check

        if (isWatched) {
            // Unwatch (Delete)
            await supabase.from('watched_items').delete().match({ list_item_id: itemId, user_id: user.id });
        } else {
            // Watch (Insert)
            await supabase.from('watched_items').insert({ list_item_id: itemId, user_id: user.id });
        }
        fetchLists();
    };

    const rateItem = async (listId: string, itemId: string, rating: number) => {
        if (!user) return;

        // Optimistic UI Update
        setLists(prev => prev.map(l => {
            if (l.id !== listId) return l;
            return {
                ...l,
                items: l.items.map(i => {
                    if (i.id !== itemId) return i;
                    // If rating is 0, remove the key entirely or set to 0. 
                    // Setting to 0 effectively "clears" it in our UI logic since 0 stars = unrated.
                    const newRatings = { ...i.ratings };
                    if (rating === 0) {
                        delete newRatings[userEmail];
                    } else {
                        newRatings[userEmail] = rating;
                    }
                    return { ...i, ratings: newRatings };
                })
            }
        }));

        if (rating === 0) {
            // Clear Rating (Delete)
            const { error } = await supabase.from('item_ratings')
                .delete()
                .match({ list_item_id: itemId, user_id: user.id });

            if (error) {
                console.error("Error clearing rating", error);
                fetchLists(); // Revert on error
            }
        } else {
            // Upsert rating
            const { error } = await supabase.from('item_ratings').upsert({
                list_item_id: itemId,
                user_id: user.id,
                rating: rating
            }, { onConflict: 'list_item_id, user_id' });

            if (error) {
                console.error("Error rating", error);
                fetchLists(); // Revert on error
            }
        }
        // No strict need to fetchLists on success if optimistic update is correct, 
        // but for safety in MVP we can leave it or remove it to save a call. 
        // Let's rely on optimistic update and only fetch on error or specialized events.
        // Actually, for now, let's keep the pattern of refreshing to be safe.
        // fetchLists(); 
    };

    return (
        <StoreContext.Provider
            value={{
                lists,
                isLoading,
                refreshLists: fetchLists,
                addList,
                deleteList,
                addItemToList,
                removeItemFromList,
                updateItem,
                updateList,
                toggleWatched,
                rateItem
            }}
        >
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};

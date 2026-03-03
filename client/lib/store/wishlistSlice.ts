import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';

interface WishlistItem {
    id: number;
    sub_product_id?: number | null;
    sub_service_id?: number | null;
}

interface WishlistState {
    items: WishlistItem[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: WishlistState = {
    items: [],
    status: 'idle',
    error: null,
};

// Helper to manage localStorage for guests
const LOCAL_STORAGE_KEY = 'guest_wishlist';

const getGuestWishlist = (): { products: number[], services: number[] } => {
    if (typeof window === 'undefined') return { products: [], services: [] };
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { products: [], services: [] };
};

const saveGuestWishlist = (data: { products: number[], services: number[] }) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }
};

export const fetchUserWishlist = createAsyncThunk(
    'wishlist/fetchUserWishlist',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return rejectWithValue('No token');

            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${API_URL}/wishlist/my`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to fetch wishlist');

            const data: WishlistItem[] = await res.json();
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const syncGuestWishlist = createAsyncThunk(
    'wishlist/syncGuestWishlist',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return rejectWithValue('Not authenticated');

            const guestData = getGuestWishlist();
            if (guestData.products.length === 0 && guestData.services.length === 0) {
                // Nothing to sync, just fetch existing
                dispatch(fetchUserWishlist());
                return { synced: false };
            }

            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${API_URL}/wishlist/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(guestData),
            });

            if (!res.ok) throw new Error('Failed to sync guest wishlist');

            // Clear local storage after successful sync
            localStorage.removeItem(LOCAL_STORAGE_KEY);

            // Fetch the freshly synced wishlist
            dispatch(fetchUserWishlist());
            return { synced: true };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

interface TogglePayload {
    sub_product_id?: number | null;
    sub_service_id?: number | null;
}

export const toggleWishlistItem = createAsyncThunk(
    'wishlist/toggleItem',
    async (payload: TogglePayload, { getState, rejectWithValue }) => {
        try {
            const token = localStorage.getItem('access_token');

            // 1. GUEST MODE
            if (!token) {
                const guestData = getGuestWishlist();

                if (payload.sub_product_id) {
                    const idx = guestData.products.indexOf(payload.sub_product_id);
                    if (idx > -1) guestData.products.splice(idx, 1);
                    else guestData.products.push(payload.sub_product_id);
                } else if (payload.sub_service_id) {
                    const idx = guestData.services.indexOf(payload.sub_service_id);
                    if (idx > -1) guestData.services.splice(idx, 1);
                    else guestData.services.push(payload.sub_service_id);
                }

                saveGuestWishlist(guestData);

                // We return this synthetic response to update the Redux state to match localStorage
                return {
                    status: 'guest_toggled',
                    payload
                };
            }

            // 2. AUTHENTICATED MODE
            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            const res = await fetch(`${API_URL}/wishlist/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to toggle item');

            const data = await res.json();
            return {
                status: data.status, // "added" or "removed"
                payload
            };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState,
    reducers: {
        // Hydrate guest items into Redux state on app load
        hydrateGuestWishlist: (state) => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            if (token) return; // Ignore if logged in, fetchUserWishlist will handle it

            const guestData = getGuestWishlist();
            const syntheticItems: WishlistItem[] = [];

            // Add dummy IDs since localStorage doesn't have DB IDs
            guestData.products.forEach((pid, i) => {
                syntheticItems.push({ id: -(i + 1), sub_product_id: pid });
            });
            guestData.services.forEach((sid, i) => {
                syntheticItems.push({ id: -(guestData.products.length + i + 1), sub_service_id: sid });
            });

            state.items = syntheticItems;
            state.status = 'succeeded';
        },
        clearWishlist: (state) => {
            state.items = [];
            state.status = 'idle';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserWishlist.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchUserWishlist.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchUserWishlist.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            .addCase(toggleWishlistItem.fulfilled, (state, action) => {
                const { status, payload } = action.payload;

                if (status === 'guest_toggled') {
                    // Update Redux state manually to match guest localStorage
                    if (payload.sub_product_id) {
                        const exists = state.items.some(i => i.sub_product_id === payload.sub_product_id);
                        if (exists) {
                            state.items = state.items.filter(i => i.sub_product_id !== payload.sub_product_id);
                        } else {
                            state.items.push({ id: Date.now(), sub_product_id: payload.sub_product_id });
                        }
                    } else if (payload.sub_service_id) {
                        const exists = state.items.some(i => i.sub_service_id === payload.sub_service_id);
                        if (exists) {
                            state.items = state.items.filter(i => i.sub_service_id !== payload.sub_service_id);
                        } else {
                            state.items.push({ id: Date.now(), sub_service_id: payload.sub_service_id });
                        }
                    }
                } else if (status === 'added') {
                    // Item was added to DB, so we add a synthetic entry to Redux for immediate UI update. 
                    // Better practice is to refetch, or return the full item from toggle, but this is optimistic.
                    state.items.push({ id: Date.now(), sub_product_id: payload.sub_product_id, sub_service_id: payload.sub_service_id });
                } else if (status === 'removed') {
                    if (payload.sub_product_id) {
                        state.items = state.items.filter(i => i.sub_product_id !== payload.sub_product_id);
                    } else if (payload.sub_service_id) {
                        state.items = state.items.filter(i => i.sub_service_id !== payload.sub_service_id);
                    }
                }
            });
    },
});

export const { hydrateGuestWishlist, clearWishlist } = wishlistSlice.actions;

export const selectWishlistItems = (state: RootState) => state.wishlist.items;
export const selectIsServiceLiked = (state: RootState, serviceId: number) =>
    state.wishlist.items.some(item => item.sub_service_id === serviceId);
export const selectIsProductLiked = (state: RootState, productId: number) =>
    state.wishlist.items.some(item => item.sub_product_id === productId);

export default wishlistSlice.reducer;

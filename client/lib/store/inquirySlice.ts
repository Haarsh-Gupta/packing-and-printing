import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface InquiryItem {
    id: string; // temporary UUID
    productId?: number;
    serviceId?: number;
    name: string;
    quantity: number;
    options: Record<string, string | number | boolean>;
    estimatedPrice: number;
}

export interface InquiryState {
    items: InquiryItem[];
    totalEstimate: number;
}

const initialState: InquiryState = {
    items: [],
    totalEstimate: 0,
};

export const inquirySlice = createSlice({
    name: 'inquiry',
    initialState,
    reducers: {
        addToInquiry: (state, action: PayloadAction<InquiryItem>) => {
            state.items.push(action.payload);
            state.totalEstimate += action.payload.estimatedPrice;
        },
        removeFromInquiry: (state, action: PayloadAction<string>) => {
            const index = state.items.findIndex(item => item.id === action.payload);
            if (index !== -1) {
                state.totalEstimate -= state.items[index].estimatedPrice;
                state.items.splice(index, 1);
            }
        },
        clearInquiry: (state) => {
            state.items = [];
            state.totalEstimate = 0;
        },
    },
});

export const { addToInquiry, removeFromInquiry, clearInquiry } = inquirySlice.actions;

export default inquirySlice.reducer;

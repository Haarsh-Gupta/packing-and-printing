import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface InquiryItem {
    id: string; // temporary UUID
    productId?: number;
    subproductId?: number;       // required when productId is set
    serviceId?: number;
    subserviceId?: number;      // required when serviceId is set
    name: string;
    quantity: number;
    options: Record<string, string | number | boolean>; // only for products
    estimatedPrice: number;
    imageUrl?: string;          // first image of the product/service
    pricePerUnit?: number;      // stored for edit recalculation
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
            // Prevent exact duplicate (same subproduct/subservice & same options)
            const existing = state.items.find(i =>
                i.subproductId === action.payload.subproductId &&
                i.subserviceId === action.payload.subserviceId &&
                JSON.stringify(i.options) === JSON.stringify(action.payload.options)
            );
            if (existing) {
                existing.quantity += action.payload.quantity;
                existing.estimatedPrice += action.payload.estimatedPrice;
                state.totalEstimate += action.payload.estimatedPrice;
                return;
            }
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
        updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number; pricePerUnit: number }>) => {
            const item = state.items.find(i => i.id === action.payload.id);
            if (item) {
                const oldEst = item.estimatedPrice;
                item.quantity = action.payload.quantity;
                item.estimatedPrice = action.payload.quantity * action.payload.pricePerUnit;
                item.pricePerUnit = action.payload.pricePerUnit;
                state.totalEstimate = state.totalEstimate - oldEst + item.estimatedPrice;
            }
        },
        updateOptions: (state, action: PayloadAction<{ id: string; options: Record<string, string | number | boolean>; estimatedPrice: number }>) => {
            const item = state.items.find(i => i.id === action.payload.id);
            if (item) {
                const oldEst = item.estimatedPrice;
                item.options = action.payload.options;
                item.estimatedPrice = action.payload.estimatedPrice;
                item.pricePerUnit = item.quantity > 0 ? action.payload.estimatedPrice / item.quantity : 0;
                state.totalEstimate = state.totalEstimate - oldEst + action.payload.estimatedPrice;
            }
        },
        clearInquiry: (state) => {
            state.items = [];
            state.totalEstimate = 0;
        },
    },
});

export const { addToInquiry, removeFromInquiry, clearInquiry, updateQuantity, updateOptions } = inquirySlice.actions;

export default inquirySlice.reducer;

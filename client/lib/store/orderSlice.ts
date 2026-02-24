import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Milestone {
    id: string;
    name: string;
    amount_due: number;
    is_paid: boolean;
    due_date?: string;
}

export interface Order {
    id: string;
    inquiry_id: string;
    user_id: string;
    total_amount: number;
    amount_paid: number;
    status: string;
    created_at: string;
    milestones: Milestone[];
}

export interface OrderState {
    orders: Order[];
    isLoading: boolean;
    error: string | null;
}

const initialState: OrderState = {
    orders: [],
    isLoading: false,
    error: null,
};

export const orderSlice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        setOrders: (state, action: PayloadAction<Order[]>) => {
            state.orders = action.payload;
        },
        updateMilestoneStatus: (state, action: PayloadAction<{ orderId: string; milestoneId: string }>) => {
            const order = state.orders.find(o => o.id === action.payload.orderId);
            if (order) {
                const milestone = order.milestones.find(m => m.id === action.payload.milestoneId);
                if (milestone) {
                    milestone.is_paid = true;
                    // Optimistically update order amount_paid
                    order.amount_paid += milestone.amount_due;
                }
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const { setOrders, updateMilestoneStatus, setLoading, setError } = orderSlice.actions;

export default orderSlice.reducer;

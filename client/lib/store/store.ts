import { configureStore } from '@reduxjs/toolkit';
import inquiryReducer from './inquirySlice';
import orderReducer from './orderSlice';

export const store = configureStore({
    reducer: {
        inquiry: inquiryReducer,
        order: orderReducer,
    },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {inquiry: InquiryState, order: OrderState}
export type AppDispatch = typeof store.dispatch;

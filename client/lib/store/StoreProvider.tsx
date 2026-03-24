"use client";

import { Provider } from "react-redux";
import { store } from "./store";
import { ReactNode, useEffect } from "react";
import { hydrateGuestWishlist } from "./wishlistSlice";
import { hydrateInquiry } from "./inquirySlice";

export function StoreProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        // Hydrate local storage items into Redux on mount
        store.dispatch(hydrateGuestWishlist());
        store.dispatch(hydrateInquiry());
    }, []);

    return <Provider store={store}>{children}</Provider>;
}

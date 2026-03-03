"use client";

import { Provider } from "react-redux";
import { store } from "./store";
import { ReactNode, useEffect } from "react";
import { hydrateGuestWishlist } from "./wishlistSlice";

export function StoreProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        // Hydrate local storage wishlist into Redux on mount for guests
        store.dispatch(hydrateGuestWishlist());
    }, []);

    return <Provider store={store}>{children}</Provider>;
}

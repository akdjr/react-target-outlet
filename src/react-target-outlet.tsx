import React, { useState, useCallback } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import { createPortal } from "react-dom";

type ElementState = null | HTMLElement;
type StoreListener = () => void;
type ElementStore = {
	getState: () => ElementState;
	setState: (el: ElementState) => void;
	subscribe: (listener: StoreListener) => () => void;
}


function createElementStore(): ElementStore {
  let state:ElementState = null;

  const getState = () => state;

  const listeners = new Set<StoreListener>();

  const setState = (el: ElementState) => {
    state = el;

    for (const listener of listeners) {
      listener();
    }
  };

  const subscribe = (listener: StoreListener) => {
    listeners.add(listener);

    return () => listeners.delete(listener);
  };

  return {
    getState,
    setState,
    subscribe,
  };
}

function useElementStore(store: ElementStore) {
  return useSyncExternalStore(
    store.subscribe,
    useCallback(() => store.getState(), [store])
  );
}

export default function createTargetOutlet() {
  let store = createElementStore();

  const Outlet = () => {
    return (
      <div
        ref={(element) => {
          store.setState(element);
        }}
      ></div>
    );
  };

  const Content = ({ children }: React.PropsWithChildren<{}>) => {
    const element = useElementStore(store);

    if (element) {
      return createPortal(children, element);
    }

    return null;
  };

  Content.Outlet = Outlet;

  return Content;
}

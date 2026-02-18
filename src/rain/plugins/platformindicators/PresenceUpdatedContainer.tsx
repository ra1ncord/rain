import { FluxDispatcher } from "@metro/common";
import React, { useEffect,useState } from "react";

const PresenceUpdatedContainer = ({ children }: { children: React.ReactNode }) => {
    const [counter, setCounter] = useState(0);
    useEffect(() => {

        const presenceUpdate = () => {
            setCounter(prevCounter => prevCounter + 1);
        };
        FluxDispatcher.subscribe("PRESENCE_UPDATES",presenceUpdate);
        return () => {
            FluxDispatcher.unsubscribe("PRESENCE_UPDATES",presenceUpdate);
        };
    }, []);

    return (
        React.Children.map(children, (child, index) => {
            return React.cloneElement(child as React.ReactElement, { key: `${index}-${counter}` });
        })
    );
};

export default PresenceUpdatedContainer;

import React, { useEffect,useState } from "react";

const RerenderContainer = ({ children }: { children: React.ReactNode }) => {
    const [counter, setCounter] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCounter(prevCounter => prevCounter + 1);
        }, 2000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        React.Children.map(children, (child, index) => {
            return React.cloneElement(child as React.ReactElement, { key: `${index}-${counter}` });
        })
    );
};

export default RerenderContainer;

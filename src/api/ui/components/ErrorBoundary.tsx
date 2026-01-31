import { ThemeContext } from "@api/ui/styles";
import { React } from "@metro/common";
import { Falsy } from "react-native";

import ErrorCard from "./ErrorCard";

type ErrorBoundaryState = {
    hasErr: false;
} | {
    hasErr: true;
    error: Error;
};

export interface ErrorBoundaryProps {
    children: JSX.Element | Falsy | (JSX.Element | Falsy)[];
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasErr: false };
    }

    static contextType = ThemeContext;
    static getDerivedStateFromError = (error: Error) => ({ hasErr: true, error });

    render() {
        if (!this.state.hasErr) return this.props.children;

        return (
            <ErrorCard
                error={this.state.error}
                onRetryRender={() => this.setState({ hasErr: false })}
            />
        );
    }
}

import { after } from "@api/patcher";
import { _lazyContextSymbol } from "@metro/lazy";
import { LazyModuleContext } from "@metro/types";
import { findByNameLazy } from "@metro/wrappers";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

import ErrorBoundaryScreen from "./ErrorBoundaryScreen";

export default definePlugin({
    name: Strings.PLUGINS.CORE.ERRORBOUNDARY.NAME,
    description: Strings.PLUGINS.CORE.ERRORBOUNDARY.NAME,
    author: [Developers.cocobo1],
    id: "errorboundary",
    version: "1.0.0",
    start() {
        after.await("render", getErrorBoundaryContext(), function (this: any) {
            if (!this.state.error) return;

            return <ErrorBoundaryScreen
                error={this.state.error}
                rerender={() => this.setState({ info: null, error: null })}
            />;
        });
    },
});

function getErrorBoundaryContext() {
    const ctxt: LazyModuleContext = findByNameLazy("ErrorBoundary")[_lazyContextSymbol];
    return new Promise(resolve => ctxt.getExports(exp => resolve(exp.prototype)));
}

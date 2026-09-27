import { cheeseburger, revision } from "rain-build-info";

const coreRevision: string = revision;
const builtinRevision: string = cheeseburger;

export { builtinRevision, coreRevision as revision };

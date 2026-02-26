import { Decoration } from "../api";

export default (decoration: Decoration) => `${decoration.animated ? "a_" : ""}${decoration.hash}`;

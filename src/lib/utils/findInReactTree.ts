import findInTree, { SearchFilter } from "./findInTree";

export default function findInReactTree(tree: { [key: string]: any; }, filter: SearchFilter): any {
    return findInTree(tree, filter, {
        walkable: ["props", "children", "child", "sibling"],
    });
}

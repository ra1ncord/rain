import { after, before } from "@api/patcher";
import { findInReactTree } from "@lib/utils";
import { React } from "@metro/common";
import { findByProps } from "@metro";

import {
  messageActionLabels,
  useMessageActionSheetSettings,
} from "../storage";
import { setCachedIcon } from "../iconCache";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");

function extractLabelText(label: unknown): string | null {
  if (typeof label === "string") return label;
  if (label && typeof label === "object") {
    const props = (label as any).props;
    const child = props?.children;
    if (typeof child === "string") return child;
    if (Array.isArray(child)) {
      const parts = child.filter(part => typeof part === "string");
      if (parts.length) return parts.join("");
    }
  }
  return null;
}

function getLabel(row: any): string | null {
  const label = row?.props?.label ?? row?.props?.text ?? row?.props?.title;
  return extractLabelText(label);
}

function isRowLike(row: any): boolean {
  if (!row?.props) return false;
  return !!(row.props.label ?? row.props.text ?? row.props.title);
}

function getIconProp(row: any): unknown {
  return row?.props?.icon;
}

function buildMatcher() {
  const settings = useMessageActionSheetSettings.getState();
  const hidden = settings.hidden ?? {};
  const known = new Set(messageActionLabels.map(label => label.toLowerCase()));
  const custom = new Set(
    (settings.customLabels ?? "")
      .split(",")
      .map(value => value.trim().toLowerCase())
      .filter(Boolean)
  );

  return (label: string | null) => {
    if (!label) return false;
    const key = label.toLowerCase();
    if (hidden[key]) return true;
    if (custom.has(key)) return true;
    if (settings.hideUnknown && !known.has(key)) return true;
    return false;
  };
}

export default function patchMessageActionSheet() {
  return before("openLazy", LazyActionSheet, ([component, key, msg]) => {
    const message = msg?.message;
    if (key !== "MessageLongPressActionSheet" || !message) return;

    component.then((instance: any) => {
      const unpatch = after("default", instance, (_, element) => {
        React.useEffect(() => {
          return () => {
            unpatch();
          };
        }, []);

        let actionSheetContainer: any = findInReactTree(
          element,
          x => Array.isArray(x) && x[0]?.type?.name === "ActionSheetRowGroup"
        );

        if (!actionSheetContainer) {
          actionSheetContainer = findInReactTree(
            element,
            x => Array.isArray(x) && x.some(isRowLike)
          );
        }

        if (!actionSheetContainer) {
          // ...existing code...
          return;
        }

        const shouldHide = buildMatcher();

        if (Array.isArray(actionSheetContainer) && actionSheetContainer.every(isRowLike)) {
          for (const child of actionSheetContainer) {
            const label = getLabel(child);
            const iconProp = getIconProp(child);
            if (label && iconProp) setCachedIcon(label, iconProp);
          }
          const filtered = actionSheetContainer.filter(child => !shouldHide(getLabel(child)));
          actionSheetContainer.length = 0;
          actionSheetContainer.push(...filtered);
          return;
        }

        for (const group of actionSheetContainer) {
          const children = group?.props?.children;
          if (Array.isArray(children)) {
            for (const child of children) {
              const label = getLabel(child);
              const iconProp = getIconProp(child);
              if (label && iconProp) setCachedIcon(label, iconProp);
            }
            group.props.children = children.filter(child => !shouldHide(getLabel(child)));
          } else if (children) {
            const label = getLabel(children);
            const iconProp = getIconProp(children);
            if (label && iconProp) setCachedIcon(label, iconProp);
            group.props.children = shouldHide(label) ? null : children;
          }
        }
      });
    });
  });
}

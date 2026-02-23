import { findByProps, findByStoreName, findByTypeNameAll } from "@metro";
import { after } from "@api/patcher";
import { findInReactTree } from "@lib/utils";
import getTag, { BUILT_IN_TAGS } from "../lib/getTag";

const TagModule = findByProps("getBotLabel");
const getBotLabel = TagModule?.getBotLabel;
const GuildStore = findByStoreName("GuildStore");

const rowPatch = ([{ guildId, user }]: [{ guildId: string, user: any }], res: any) => {
    const label = res?.props?.label;
    if (!label) return;
    
    const nameContainer = findInReactTree(
        label,
        (c: any) =>
            Array.isArray(c?.props?.children) &&
            c.props.children.some(
                (ch: any) => typeof ch === "string" || typeof ch?.props?.children === "string"
            )
    );
    if (!nameContainer) return;

    const existingTag = findInReactTree(nameContainer, (c: any) => c?.type?.Types);
    if (existingTag) {
        const labelText = getBotLabel?.(existingTag.props.type);
        if (labelText && BUILT_IN_TAGS.includes(labelText)) return;
    }

    const guild = GuildStore?.getGuild?.(guildId);
    const tag = getTag(guild, undefined, user);

    if (tag) {
        if (existingTag) {
            Object.assign(existingTag.props, {
                type: 0,
                text: tag.text,
                textColor: tag.textColor,
                backgroundColor: tag.backgroundColor,
                verified: tag.verified,
            });
        } else {
            if (!Array.isArray(nameContainer.props.children)) {
                nameContainer.props.children = [nameContainer.props.children];
            }
            nameContainer.props.children.push(
                <TagModule.default
                    type={0}
                    text={tag.text}
                    textColor={tag.textColor}
                    backgroundColor={tag.backgroundColor}
                    verified={tag.verified}
                />
            );
        }
    }
};

export default () => {
    const patches: any[] = []

    findByTypeNameAll("UserRow").forEach((UserRow: any) => patches.push(after("type", UserRow, (args: any[], res: any) => rowPatch(args as any, res))))

    return () => patches.forEach((unpatch: any) => unpatch())
}
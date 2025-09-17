import { findByPropsLazy, findByNameLazy, findByDisplayNameLazy, findByProps } from "./";
import proxyLazy from "./proxyLazy";
import { lazyDestructure } from "./proxyLazy";

import * as t from "./components";

const findProp = (...props: string[]) => proxyLazy(() => findByProps(...props)[props[0]]);

// To prevent from getting top-level side effects, always load modules lazily.
export const AssetManager = findByPropsLazy("getAssetByID");
export const i18n = findByPropsLazy("Messages");
export const Forms = findByPropsLazy("FormSection");
export const Tables = findByPropsLazy("TableRow");
export const NavigationNative = findByPropsLazy("NavigationContainer");
export const Styles = findByPropsLazy("createThemedStyleSheet");
export const Colors = findByPropsLazy("unsafe_rawColors");
export const Constants = findByPropsLazy("NODE_SIZE");
export const FluxDispatcher = findByPropsLazy("dispatch", "subscribe");
export const TabsNavigationRef = findByPropsLazy("getRootNavigationRef");

// Discord
export const LegacyAlert = findByDisplayNameLazy("FluxContainer(Alert)");
export const CompatButton = findByPropsLazy("Looks", "Colors", "Sizes");
export const HelpMessage = findByNameLazy("HelpMessage");

// ActionSheet
export const ActionSheetRow = findProp("ActionSheetRow");

// Buttons
export const TwinButtons = findProp("TwinButtons") as t.TwinButtons;
export const RowButton = findProp("RowButton") as t.RowButton;

export const PressableScale = findProp("PressableScale");

// Tables
export const TableRow = findProp("TableRow") as t.TableRow;
export const TableRowIcon = findProp("TableRowIcon") as t.TableRowIcon;
export const TableRowTrailingText = findProp("TableRowTrailingText") as t.TableRowTrailingText;
export const TableRowGroup = findProp("TableRowGroup") as t.TableRowGroup;
export const TableRadioGroup = findProp("TableRadioGroup") as t.TableRadioGroup;
export const TableRadioRow = findProp("TableRadioRow") as t.TableRadioRow;
export const TableSwitchRow = findProp("TableSwitchRow") as t.TableSwitchRow;
export const TableCheckboxRow = findProp("TableCheckboxRow") as t.TableCheckboxRow;

// Card
export const Card = findProp("Card");
export const RedesignCompat = proxyLazy(() => findByProps("RedesignCompat").RedesignCompat);

// Alert
export const AlertModal = findProp("AlertModal");
export const AlertActionButton = findProp("AlertActionButton");
export const AlertActions = findProp("AlertActions");

// React
export const React = findByPropsLazy("createElement") as typeof import("react");
export const ReactNative = findByPropsLazy("AppRegistry") as typeof import("react-native");

export const {
    Form: LegacyForm,
    FormArrow: LegacyFormArrow,
    FormCTA: LegacyFormCTA,
    FormCTAButton: LegacyFormCTAButton,
    FormCardSection: LegacyFormCardSection,
    FormCheckbox: LegacyFormCheckbox,
    FormCheckboxRow: LegacyFormCheckboxRow,
    FormCheckmark: LegacyFormCheckmark,
    FormDivider: LegacyFormDivider,
    FormHint: LegacyFormHint,
    FormIcon: LegacyFormIcon,
    FormInput: LegacyFormInput,
    FormLabel: LegacyFormLabel,
    FormRadio: LegacyFormRadio,
    FormRadioGroup: LegacyFormRadioGroup,
    FormRadioRow: LegacyFormRadioRow,
    FormRow: LegacyFormRow,
    FormSection: LegacyFormSection,
    FormSelect: LegacyFormSelect,
    FormSliderRow: LegacyFormSliderRow,
    FormSubLabel: LegacyFormSubLabel,
    FormSwitch: LegacyFormSwitch,
    FormSwitchRow: LegacyFormSwitchRow,
    FormTernaryCheckBox: LegacyFormTernaryCheckBox,
    FormText: LegacyFormText,
    FormTitle: LegacyFormTitle
} = lazyDestructure(() => Forms);

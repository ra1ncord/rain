import { StatusBar, TextInput, Keyboard } from "react-native";
import { _colorRef } from "./updater";

//todo: fix ios keyboard + think of a better name for this file

function getBarColor() {
    if (_colorRef.current!.reference === "darker") {
        return "light-content";
    } else {
        return "dark-content";
    }
}

export default function fixStatusBar() {
    setInterval(() => { 
        StatusBar.setBarStyle(getBarColor(), true); 
        Keyboard
    }, 200)
}
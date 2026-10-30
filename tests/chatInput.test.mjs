import test from "node:test";
import assert from "node:assert/strict";
import {compile,evaluate} from "./runtimeHarness.mjs";

const mocks={
    "@metro":"export const findByTypeDisplayName=(name,expDefault)=>{if(expDefault!==false)throw Error('raw exports required');return env.modules[name]}; export const findByNameLazy=()=>undefined; export const findByProps=()=>undefined; export const findByPropsLazy=()=>undefined; export const findByStoreName=()=>undefined",
    "@metro/common":"export const ReactNative=env.ReactNative",
    "@metro/common/stores":"export const ChannelStore={};export const SelectedChannelStore={};export const UserStore={}",
    "@lib/utils/logger":"export const logger={log(){}}",
    "./storage":"export const useBetterChatButtonsSettings={getState:()=>env.state};export const useChatboxAvatarSettings=()=>env.state",
    "react":"export default env.React;export const useEffect=()=>{};export const useRef=()=>{}",
};
const buttons=await compile("src/plugins/betterchatbuttons/index.ts",mocks);
const avatar=await compile("src/plugins/chatboxavatar/index.tsx",mocks);
for(const shape of ["forwardRef","memoFunction"]){
    function fixture(){
        const modules={},originals={};
        for(const name of ["ChatInputActions","ChatInputSendButton","ChatInputRightActions"]){
            const render=props=>({props:{children:{props:{items:[{sendVoiceMessageEnabled:true}]}}}});
            const component=shape==="forwardRef"?{render}:{type:render};
            modules[name]={default:component};originals[name]=component;
        }
        const env={modules,state:{hide:{voice:true,gift:true,app:true,thread:true},show:{},dismiss:{}},
            setImmediate(){},React:{createElement:(type,props,...children)=>({type,props:{...props,children}})},
            ReactNative:{View(){},Animated:{Value:class {}}}};
        function draw(name,props={}){let c=modules[name].default;while(c?.type)c=c.type;return typeof c==="function"?c(props):c.render(props);}
        return {env,draw,modules,originals};
    }
    test(`BetterChatButtons hooks ${shape} chat inputs`,async()=>{
        const f=fixture(),plugin=evaluate(buttons,f.env).exports.default;
        await plugin.start();
        const props={isAppLauncherEnabled:true};
        f.draw("ChatInputActions",props);assert.equal(props.isAppLauncherEnabled,false);assert.equal(props.shouldShowGiftButton,false);
        assert.equal(f.draw("ChatInputSendButton").props.children.props.items[0].sendVoiceMessageEnabled,false);
        plugin.stop();assert.equal(f.draw("ChatInputSendButton").props.children.props.items[0].sendVoiceMessageEnabled,true);
    });
    test(`ChatboxAvatar hooks ${shape} chat inputs`,async()=>{
        const f=fixture(),plugin=evaluate(avatar,f.env).exports.default;
        await plugin.eagerStart();await plugin.start();
        assert.equal(f.draw("ChatInputActions").props.children.length,2);
        plugin.stop();assert.equal(f.draw("ChatInputActions").props.children.props.items.length,1);
    });
}

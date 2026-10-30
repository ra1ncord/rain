import test from 'node:test';
import assert from 'node:assert/strict';
import {compile,evaluate} from './runtimeHarness.mjs';

// Frozen React-shaped fixtures exercise immutable tree edits without loading
// Discord's runtime React. Device rendering still needs verification.
const list=x=>[x].flat(Infinity).filter(x=>x!=null&&x!==false);
const React={
    createElement(type,props={},...children){const {key=null,...rest}=props;
        if(children.length)rest.children=children.length===1?children[0]:Object.freeze(children);
        return Object.freeze({type,key,props:Object.freeze(rest)});},
    cloneElement(element,props,...children){return this.createElement(element.type,{...element.props,key:element.key,...props},...children);},
    isValidElement:x=>!!x?.type,
    Children:{toArray:list,count:x=>list(x).length,map:(x,fn)=>list(x).map(fn)},
};

const code=await compile('src/plugins/bettersilentleave/index.ts',{
    '@metro':'export const findByProps=(...keys)=>keys[0]==="ActionSheet"?env.sheets:env.api',
    '@metro/common':'export const React=env.React',
    '@api/ui/alerts':'export const showConfirmationAlert=x=>env.alerts.push(x)',
    '@api/ui/toasts':'export const showToast=x=>env.toasts.push(x)',
    '@lib/utils':'export const findInReactTree=(tree,fn)=>env.find(tree,fn)',
});
function find(tree,fn){
    if(fn(tree))return tree;
    if(Array.isArray(tree)){for(const child of tree){const result=find(child,fn);if(result)return result;}}
    else if(tree?.props?.children)return find(tree.props.children,fn);
}
function fixture(shape='function',single=false){
    const id='123456789012345678', calls=[], alerts=[], toasts=[];
    function Row(){} function Group(){} function Wrapper(){}
    const stock=React.createElement(Row,{key:'stock',label:'Leave',variant:'danger',onPress(){throw Error('stock handler copied')}});
    const group=React.createElement(Group,{key:'gdm-destructive'},single?stock:[stock]);
    const tree=React.createElement(Wrapper,{},React.createElement(Wrapper,{},group));
    const render=()=>tree;
    let component=render;
    if(shape==='class')component=class {constructor(props){this.props=props}render(){return tree}};
    if(shape==='forwardRef')component={render};
    if(shape==='memo')component={type:render};
    const sheets={ActionSheet:component};
    const env={React,find,sheets,alerts,toasts,api:{async del(x){calls.push(x)}}};
    const plugin=evaluate(code,env).exports.default;
    function draw(props={channel:{id,type:3}}){
        let c=sheets.ActionSheet;
        while(c?.type)c=c.type;
        return typeof c==='function'?(c.prototype?.render?new c(props).render():c(props)):c.render(props);
    }
    function row(output=draw()){return React.Children.toArray(find(output,x=>x?.key?.endsWith('gdm-destructive'))?.props.children).find(x=>x.props?.rainSilentLeave)}
    return {id,calls,alerts,toasts,plugin,env,draw,row,tree,component};
}
for(const shape of ['function','class','forwardRef','memo'])test(`SilentLeave patches ${shape} sheets and restores on stop`,()=>{
    const f=fixture(shape);f.plugin.start();f.plugin.start();assert.ok(f.row());
    assert.equal(React.Children.count(find(f.tree,x=>x?.key==='gdm-destructive').props.children),1);
    f.plugin.stop();f.plugin.stop();assert.equal(f.env.sheets.ActionSheet,f.component);assert.equal(f.row(),undefined);
});
test('single-child nested groups work and leaving waits for explicit confirmation',async()=>{
    const f=fixture('function',true);f.plugin.start();f.row().props.onPress();assert.equal(f.calls.length,0);
    await f.alerts[0].onConfirm();assert.equal(f.calls.length,1);
    assert.equal(f.calls[0].url,`/channels/${f.id}`);assert.equal(f.calls[0].query,'silent=true');
    assert.deepEqual(f.toasts,['Left silently']);f.plugin.stop();
});
test('failed asynchronous requests show failure, not success',async()=>{
    const f=fixture();f.env.api.del=async()=>{throw Error('network')};f.plugin.start();f.row().props.onPress();
    await f.alerts[0].onConfirm();assert.deepEqual(f.toasts,['Failed to leave silently']);f.plugin.stop();
});
test('missing IDs and non-group channels leave the stock tree untouched',()=>{
    const f=fixture();f.plugin.start();assert.equal(f.draw({channel:{id:'bad',type:3}}),f.tree);
    assert.equal(f.draw({channel:{id:f.id,type:1}}),f.tree);f.plugin.stop();
});
test('pending confirmations cannot leave after plugin disable',async()=>{
    const f=fixture();f.plugin.start();f.row().props.onPress();f.plugin.stop();
    await f.alerts[0].onConfirm();assert.equal(f.calls.length,0);
});
test('duplicate confirmation cannot issue concurrent leave requests',async()=>{
    const f=fixture();let resolve;f.env.api.del=x=>{f.calls.push(x);return new Promise(r=>resolve=r)};
    f.plugin.start();f.row().props.onPress();const pending=f.alerts[0].onConfirm();
    await f.alerts[0].onConfirm();assert.equal(f.calls.length,1);assert.equal(f.toasts.length,0);
    resolve();await pending;assert.deepEqual(f.toasts,['Left silently']);f.plugin.stop();
});

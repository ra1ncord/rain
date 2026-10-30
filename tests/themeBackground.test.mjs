import test from "node:test";
import assert from "node:assert/strict";
import { compile, evaluate } from "./runtimeHarness.mjs";

const code = await compile("src/plugins/_core/painter/themes/patches/background.tsx", {
    "chroma-js": "export default ()=>({alpha(){return this},hex(){return '#000000'}})",
    "react/jsx-runtime": "export const jsx=(type,props)=>({type,props}); export const jsxs=jsx",
    "@metro": "export const findByFilePathLazy=(path, expDefault)=>{env.expDefault=expDefault; return env.proxy}",
    "@metro/lazy": "export const getLazyContext=()=>({getExports:cb=>env.subscribe(cb)})",
    "@lib/utils": "export const findInReactTree=()=>undefined",
    "@lib/utils/logger": "export const logger={warn(){},error(...a){env.errors.push(a)}}",
    "@plugins/_core/painter/themes/preferences": "export const useColorsPref=()=> 'show'",
    "@plugins/_core/painter/themes/updater": "export const _colorRef=env.colorRef",
    "react-native": "export const ImageBackground=()=>{}; export const StyleSheet={flatten:x=>x}",
});
for (const shape of ["function", "forwardRef", "memo", "class"]) {
    test(`chat background patches ${shape} Messages and restores on stop`, () => {
        const originalTree = {props:{children:[]}};
        const render = () => originalTree;
        let component = render;
        if (shape === "forwardRef") component = {render};
        if (shape === "memo") component = {type:render};
        if (shape === "class") component = class {render(){return originalTree}};
        const module = {default:component};
        const env = {proxy:{}, errors:[], colorRef:{current:{background:{url:"https://example.com/bg.png"}}},
            subscribe(cb){cb(module);return ()=>{}}};
        const {exports} = evaluate(code,env);
        const stop = exports.default();
        function draw(){
            let c=module.default;while(c?.type)c=c.type;
            return typeof c === "function" ? (c.prototype?.render ? new c().render() : c()) : c.render();
        }
        assert.equal(env.expDefault,false);
        assert.equal(draw().props.children,originalTree);
        assert.deepEqual(env.errors,[]);
        stop();assert.equal(draw(),originalTree);
    });
}
test("disabling before the Messages module loads cancels the hook", () => {
    let callback, cancelled=false;
    const render=()=>null,module={default:render};
    const env={proxy:{}, errors:[], colorRef:{current:null}, subscribe(cb){callback=cb;return ()=>{cancelled=true}}};
    const stop=evaluate(code,env).exports.default();
    stop();callback(module);
    assert.equal(cancelled,true);assert.equal(module.default,render);
});

import vm from 'node:vm';
import { build } from 'esbuild';
import * as patcher from 'sublimation';

export const baseMocks = {
    "react/jsx-runtime": "export const jsx=(type,props)=>({type,props}); export const jsxs=jsx",
    '@api/patcher': 'export const before=(...a)=>env.patcher.before(...a); export const after=(...a)=>env.patcher.after(...a); export const instead=(...a)=>env.patcher.instead(...a)',
    '@plugins': 'export const definePlugin=x=>x',
    '@rain/Developers': 'export const Contributors={}; export const Developers={}',
    './settings': 'export default null',
};
export async function compile(entry, mocks = {}) {
    mocks = {...baseMocks, ...mocks};
    const result = await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false,
        plugins:[{name:'native-test-runtime',setup(builder){
            builder.onResolve({filter:/.*/},args=>mocks[args.path]===undefined?undefined:{path:args.path,namespace:'mock'});
            builder.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:mocks[args.path],loader:'js'}));
        }}]});
    return result.outputFiles[0].text;
}
export function evaluate(code, env) {
    env.patcher = patcher;
    const errors=[];
    const context={env,React:env.React ?? {createElement:(type,props,...children)=>({type,props:{...props,children:children.length===1?children[0]:children}})},__RAIN_LOADER__:env.loader,module:{exports:{}},console:{error:(...a)=>errors.push(a),log(){},info(){},warn(){}},setTimeout,clearTimeout,setImmediate:env.setImmediate ?? setImmediate};
    vm.runInNewContext(code,context);
    return {exports:context.module.exports,errors};
}
export const tick = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

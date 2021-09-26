# Young.js 

> Frame.js 的断代式升级



### 查看效果

```
npm i
npm run dev
```

编译 app.young 文件后, 直接打开 young.html 就可查看效果



### 项目结构

```js
src
  |--- app.young    young.js 的 sfc 单文件组件
  |--- loader.js    young.js 的 webpack loader
  |--- output.js    app.young 编译后的文件
  |--- young.html   用作演示的 html
  |--- young.js     young.js 源码
```



### 特性

- 声明式的, 且仅关注于视图的框架
- 使用 `jsx` 作为 UI 描述方式
- 完全裸露, 且响应式的数据, 无需 `setState(xx)`, 也无需 `this.xx`



### 原理解析

先看一个示例: app.young 

```jsx
// props: {msg}
<div>
  <h1>{`Count: ${count}`}</h1>
  <button onclick={() => count++}>count+1</button>
</div>

let count = 0

Young(document.querySelector('.root')) 
```

> 注意: 上述 `jsx` 以及 `count` 的声明并无顺序要求, 且不能被包裹
>
> `young-loader` 会自动找到组件根作用域下的 `jsx` 和 以 `var, let` 以及 `const` 声明的非函数变量, 并以状态在上, UI 在下的方式重新组合



app.young 文件编译后的结果: 

```js
/**
 * c ----------> 渲染函数
 * genTree ----> 由 vnode 生成 真实 dom
 * reactive ---> 使状态变响应式
 */
const {c: c, genTree: genTree, reactive: reactive} = require("./young");

function App({ /** msg */ }) {
  var render = new Function(
    "data",
    "c",
    `var nTree
     with (data) {
      nTree = c({
        tag: "div",
        attr: {},
        text: ""
      }, [c({
        tag: "h1",
        attr: {},
        text: \`Count: ${count}\`
      }, []),
      c({
        tag: "button",
        attr: {
          onclick: () => count++
        },
        text: "count+1"
      }, [])])
    }
    return nTree;`
  );

  function getOTree() {
    return oTree;
  }

  function setOTree(nTree) {
    oTree = nTree;
  }

  var data = reactive(render, c, getOTree, setOTree)({
    count: 0
  });
  var oTree = render(data, c);
  return oTree;
}

document.querySelector('.root').append(genTree(App({})));
```



`reactive` 有什么:

```js
function reactive(render, c, getOTree, setOTree) {
  var rootData = null
  const makeProxy = (data) => {
    rootData = rootData || data
    for (const key in data) {
      if (!data.hasOwnProperty(key)) continue
      if (typeof data[key] === 'object') {
        data[key] = makeProxy(data[key])
      }
    }
    return new Proxy(data, {
      set(t, k, v, h) {
        Reflect.set(t, k, v)
        var oTree = getOTree()
        var nTree = render(rootData, c)
        setOTree(diff(oTree, nTree))
        return true
      }
    })
  }
  return makeProxy
}
```


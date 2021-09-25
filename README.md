# Young.js 

查看效果: 先

```
npm run dev
```

编译 app.young 文件, 然后直接打开 young.html 就可查看效果



### 项目结构

```js
src
  |--- app.young    young.js 的 sfc 单文件组件
  |--- loader.js    young.js 的 webpack loader
  |--- output.js    app.young 编译后的文件
  |--- young.html   用作演示的 html
  |--- young.js     young.js 源码
```



### 原理解析

先看一个示例: app.young 

```jsx
<div>
  <h1>{`Count: ${count}`}</h1>
  <button onclick={() => count++}>count++</button>
</div>

let count = 0

Young(document.querySelector('.root')) 
```

young.js 使用 `jsx` 作为UI 

编译后的结果为: 

```js
const {c: c, genTree: genTree, reactive: reactive} = require("./young");

function App({ }) {
  var render = new Function(
    "data",
    "c",
    `with (data) {
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


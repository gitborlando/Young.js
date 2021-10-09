# Young.js 

> Frame.js 的断代式升级



### 在线演示 : https://gitborlando.cn/youngsfcplayground/



### 特性

- 声明式的, 且仅关注于视图的框架
- 完全裸露, 且响应式的数据, 无需 `setState(xx)`, 也无需 `this.xx`
- 使用 `jsx`  而非模板作为 UI 表达方式, 更加灵活易上手



### 特性(人话版)

- 现在只是一个 view 层的框架
- 继承了 React 的一系列特性, 但又做了两个主要改变: 
  - 将 useState 改为 reactive, 即类似 vue 的响应式写法
  - 通过编译的方式, 使得可以像 vue 或 svelte 一样, 以 sfc 的方式来写组件, 但最后仍会被编译成一个函数组件
- 用 `jsx`, 省得自己写 compiler



### API Reference

- ##### $

  Label 语法, 借鉴自 svelte 的 `$`  及  vue 的` ref` 语法糖, 用来标识一个响应式数据

- ##### Style

  借用的 `Jss`, 所以使用和其他 `Jss` 库一样

- ##### Effect

  借鉴 `React useEffect`, 使用和 `useEffect` 一样

- ##### reactive

  将数据变成响应式, 仅编译时使用

- ##### createElement

  借鉴 `React createElement`, 原理和 `createElement` 一样, 仅编译时使用

- ##### render

  和 `ReactDOM.render`  一样, 仅编译时使用

- ##### Young

  无需 import 引入, 编译后作用为将当前组件挂载至指定 dom. 例如 `Young('.root')`, 编译后为 `render(createElement(组件名, {}, []), document.querySelector('.root'))`


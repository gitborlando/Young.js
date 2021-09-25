/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/app.young":
/*!***********************!*\
  !*** ./src/app.young ***!
  \***********************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

eval("const {\n  c: c,\n  genTree: genTree,\n  reactive: reactive\n} = __webpack_require__(/*! ./young */ \"./src/young.js\");\n\nfunction App({}) {\n  var render = new Function(\"data\", \"c\", \"\\n  with (data) {\\n    nTree = c({\\n      tag: \\\"div\\\",\\n      attr: {},\\n      text: \\\"\\\"\\n    }, [c({\\n      tag: \\\"h1\\\",\\n      attr: {},\\n      text: `Count: ${count}`\\n    }, []), c({\\n      tag: \\\"button\\\",\\n      attr: {\\n        onclick: () => count++\\n      },\\n      text: \\\"count+1\\\"\\n    }, [])])\\n  }\\n  return nTree;\\n\");\n\n  function getOTree() {\n    return oTree;\n  }\n\n  function setOTree(nTree) {\n    oTree = nTree;\n  }\n\n  var data = reactive(render, c, getOTree, setOTree)({\n    count: 0\n  });\n  var oTree = render(data, c);\n  return oTree;\n}\n\ndocument.querySelector('.root').append(genTree(App({})));\n\n\n//# sourceURL=webpack://test/./src/app.young?");

/***/ }),

/***/ "./src/young.js":
/*!**********************!*\
  !*** ./src/young.js ***!
  \**********************/
/***/ ((module) => {

eval("class Tree {\r\n  constructor(tag, attr, text, key, children) {\r\n    this.tag = tag\r\n    this.attr = attr\r\n    this.text = text\r\n    this.key = key\r\n    this.children = children\r\n  }\r\n}\r\n\r\nfunction c({ tag, attr, text }, children) {\r\n  return new Tree(\r\n    tag,\r\n    attr,\r\n    text,\r\n    attr?.key,\r\n    children\r\n  )\r\n}\r\n\r\nfunction diff(oTree, nTree) {\r\n  if (!oTree) return nTree\r\n  if (sameTree(oTree, nTree)) {\r\n    patchSameTree(oTree, nTree)\r\n  } else {\r\n    const oEl = oTree.el\r\n    const parent = oEl.parent\r\n    genTree(nTree)\r\n    if (parent) {\r\n      parent.insertBefore(vnode.el, oEl.nextSibling)\r\n      parent.removeChild(oEl)\r\n      oTree = null\r\n    }\r\n  }\r\n  return nTree\r\n}\r\n\r\nfunction patchSameTree(oTree, nTree) {\r\n  if (oTree === nTree) return\r\n  const el = nTree.el = oTree.el\r\n\r\n  if (nTree.text) {\r\n    el.innerText = nTree.text\r\n    return\r\n  }\r\n\r\n  const { attr } = nTree\r\n  Object.entries(attr).forEach(([key, value]) => {\r\n    el.setAttribute(key, value)\r\n  })\r\n\r\n  const { children: oChild } = oTree, { children: nChild } = nTree\r\n  if (oChild.length && nChild.length && oChild !== nChild) {\r\n    updateChildren(el, oChild, nChild)\r\n  }\r\n}\r\n\r\nfunction sameTree(oTree, nTree) {\r\n  return (\r\n    oTree.tag === nTree.tag &&\r\n    oTree.key === nTree.key\r\n  )\r\n}\r\n\r\nfunction genTree(tree) {\r\n  const { tag, attr, text, children, el: oEl } = tree\r\n  if (oEl) return oEl\r\n  if (!tag) return tree\r\n  const el = document.createElement(tag)\r\n  if (text !== undefined && text !== null && text !== '') {\r\n    el.innerText = text\r\n  }\r\n  attr && Object.entries(attr).forEach(([key, val]) => {\r\n    if (!/^on/.test(key)) {\r\n      el.setAttribute(key, val)\r\n    } else {\r\n      el[key] = val\r\n    }\r\n  })\r\n  tree.el = el\r\n  children.forEach(i => el.append(genTree(i)))\r\n  return el\r\n}\r\n\r\nfunction reactive(render, c, getOTree, setOTree) {\r\n  var rootData = null\r\n  const makeProxy = (data) => {\r\n    rootData = rootData || data\r\n    for (const key in data) {\r\n      if (!data.hasOwnProperty(key)) continue\r\n      if (typeof data[key] === 'object') {\r\n        data[key] = makeProxy(data[key])\r\n      }\r\n    }\r\n    return new Proxy(data, {\r\n      set(t, k, v, h) {\r\n        Reflect.set(t, k, v)\r\n        var oTree = getOTree()\r\n        //console.log(t, k, v)\r\n        \r\n        var nTree = render(rootData, c)\r\n        //console.log(oTree.children[0].children,nTree.children[0].children)\r\n        setOTree(diff(oTree, nTree))\r\n        return true\r\n      }\r\n    })\r\n  }\r\n  return makeProxy\r\n}\r\n\r\nfunction updateChildren(parent, oChild, nChild) {\r\n  let oldStartIndex = 0, newStartIndex = 0\r\n  let oldEndIndex = oChild.length - 1\r\n  let newEndIndex = nChild.length - 1\r\n  let oldStartVnode = oChild[oldStartIndex]\r\n  let oldEndVnode = oChild[oldEndIndex]\r\n  let newStartVnode = nChild[newStartIndex]\r\n  let newEndVnode = nChild[newEndIndex]\r\n  let keyToIndexMap\r\n  let IndexInOChild\r\n  let elToRemove\r\n  let before\r\n\r\n  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {\r\n    if (oldStartVnode === null) {\r\n      oldStartVnode = oChild[++oldStartIndex]\r\n    } else if (oldEndVnode === null) {\r\n      oldEndVnode = oChild[--oldEndIndex]\r\n    } else if (newStartVnode === null) {\r\n      newStartVnode = nChild[++newStartIndex]\r\n    } else if (newEndVnode === null) {\r\n      newEndVnode = nChild[--newEndIndex]\r\n    } else if (sameTree(oldStartVnode, newStartVnode)) {\r\n      patchSameTree(oldStartVnode, newStartVnode)\r\n      oldStartVnode = oChild[++oldStartIndex]\r\n      newStartVnode = nChild[++newStartIndex]\r\n    } else if (sameTree(oldEndVnode, newEndVnode)) {\r\n      patchSameTree(oldEndVnode, newEndVnode)\r\n      oldEndVnode = oChild[--oldEndIndex]\r\n      newEndVnode = nChild[--newEndIndex]\r\n    } else if (sameTree(oldStartVnode, newEndVnode)) {\r\n      patchSameTree(oldStartVnode, newEndVnode)\r\n      parent.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling)\r\n      oldStartVnode = oChild[++oldStartIndex]\r\n      newEndVnode = nChild[--newEndIndex]\r\n    } else if (sameTree(oldEndVnode, newStartVnode)) {\r\n      patchSameTree(oldEndVnode, newStartVnode)\r\n      parent.insertBefore(oldEndVnode.el, oldStartVnode.el)\r\n      oldEndVnode = oChild[--oldEndIndex]\r\n      newStartVnode = nChild[++newStartIndex]\r\n    } else {\r\n      // 使用key时的比较\r\n      if (keyToIndexMap === undefined) {\r\n        keyToIndexMap = createKeyToOldIndex(oChild, oldStartIndex, oldEndIndex) // 有key生成index表\r\n      }\r\n      IndexInOChild = keyToIndexMap[newStartVnode.key]\r\n      if (!IndexInOChild) {\r\n        parent.insertBefore(genTree(newStartVnode), oldStartVnode.el)\r\n        newStartVnode = nChild[++newStartIndex]\r\n      } else {\r\n        elToRemove = oChild[IndexInOChild]\r\n        if (elToRemove.tag !== newStartVnode.tag) {\r\n          parent.insertBefore(genTree(newStartVnode), oldStartVnode.el)\r\n        } else {\r\n          patchSameTree(elToRemove, newStartVnode)\r\n          oChild[IndexInOChild] = null\r\n          parent.insertBefore(elToRemove.el, oldStartVnode.el)\r\n        }\r\n        newStartVnode = nChild[++newStartIndex]\r\n      }\r\n    }\r\n  }\r\n  if (oldStartIndex > oldEndIndex) {\r\n    // before = nChild[newEndIndex + 1] == null ? null : nChild[newEndIndex + 1].el\r\n    addEls(parent, nChild, newStartIndex, newEndIndex)\r\n  } else if (newStartIndex > newEndIndex) {\r\n    removeEls(oChild, oldStartIndex, oldEndIndex)\r\n  }\r\n}\r\n\r\nfunction createKeyToOldIndex(oChild, beginIdx, endIdx) {\r\n  let i, key\r\n  const map = {}\r\n  for (i = beginIdx; i <= endIdx; ++i) {\r\n    key = oChild[i].key\r\n    if (key) map[key] = i\r\n  }\r\n  return map\r\n}\r\n\r\nfunction addEls(parent, nChilds, startIndex, endIndex) {\r\n  for (; startIndex <= endIndex; ++startIndex) {\r\n    parent.append(genTree(nChilds[startIndex]))\r\n  }\r\n}\r\n\r\nfunction removeEls(oChilds, startIndex, endIndex) {\r\n  for (; startIndex <= endIndex; ++startIndex) {\r\n    const child = oChilds[startIndex]\r\n    child && child.el.parentNode.removeChild(child.el)\r\n  }\r\n}\r\n\r\nmodule.exports = {\r\n  c, diff, patchSameTree, sameTree, genTree, reactive\r\n}\n\n//# sourceURL=webpack://test/./src/young.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/app.young");
/******/ 	
/******/ })()
;
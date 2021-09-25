class Tree {
  constructor(tag, attr, text, key, children) {
    this.tag = tag
    this.attr = attr
    this.text = text
    this.key = key
    this.children = children
  }
}

function c({ tag, attr, text }, children) {
  return new Tree(
    tag,
    attr,
    text,
    attr?.key,
    children
  )
}

function diff(oTree, nTree) {
  if (!oTree) return nTree
  if (sameTree(oTree, nTree)) {
    patchSameTree(oTree, nTree)
  } else {
    const oEl = oTree.el
    const parent = oEl.parent
    genTree(nTree)
    if (parent) {
      parent.insertBefore(vnode.el, oEl.nextSibling)
      parent.removeChild(oEl)
      oTree = null
    }
  }
  return nTree
}

function patchSameTree(oTree, nTree) {
  if (oTree === nTree) return
  const el = nTree.el = oTree.el

  if (nTree.text) {
    el.innerText = nTree.text
    return
  }

  const { attr } = nTree
  Object.entries(attr).forEach(([key, value]) => {
    el.setAttribute(key, value)
  })

  const { children: oChild } = oTree, { children: nChild } = nTree
  if (oChild.length && nChild.length && oChild !== nChild) {
    updateChildren(el, oChild, nChild)
  }
}

function sameTree(oTree, nTree) {
  return (
    oTree.tag === nTree.tag &&
    oTree.key === nTree.key
  )
}

function genTree(tree) {
  const { tag, attr, text, children, el: oEl } = tree
  if (oEl) return oEl
  if (!tag) return tree
  const el = document.createElement(tag)
  if (text !== undefined && text !== null && text !== '') {
    el.innerText = text
  }
  attr && Object.entries(attr).forEach(([key, val]) => {
    if (!/^on/.test(key)) {
      el.setAttribute(key, val)
    } else {
      el[key] = val
    }
  })
  tree.el = el
  children.forEach(i => el.append(genTree(i)))
  return el
}

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

function updateChildren(parent, oChild, nChild) {
  let oldStartIndex = 0, newStartIndex = 0
  let oldEndIndex = oChild.length - 1
  let newEndIndex = nChild.length - 1
  let oldStartVnode = oChild[oldStartIndex]
  let oldEndVnode = oChild[oldEndIndex]
  let newStartVnode = nChild[newStartIndex]
  let newEndVnode = nChild[newEndIndex]
  let keyToIndexMap
  let IndexInOChild
  let elToRemove
  let before

  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (oldStartVnode === null) {
      oldStartVnode = oChild[++oldStartIndex]
    } else if (oldEndVnode === null) {
      oldEndVnode = oChild[--oldEndIndex]
    } else if (newStartVnode === null) {
      newStartVnode = nChild[++newStartIndex]
    } else if (newEndVnode === null) {
      newEndVnode = nChild[--newEndIndex]
    } else if (sameTree(oldStartVnode, newStartVnode)) {
      patchSameTree(oldStartVnode, newStartVnode)
      oldStartVnode = oChild[++oldStartIndex]
      newStartVnode = nChild[++newStartIndex]
    } else if (sameTree(oldEndVnode, newEndVnode)) {
      patchSameTree(oldEndVnode, newEndVnode)
      oldEndVnode = oChild[--oldEndIndex]
      newEndVnode = nChild[--newEndIndex]
    } else if (sameTree(oldStartVnode, newEndVnode)) {
      patchSameTree(oldStartVnode, newEndVnode)
      parent.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling)
      oldStartVnode = oChild[++oldStartIndex]
      newEndVnode = nChild[--newEndIndex]
    } else if (sameTree(oldEndVnode, newStartVnode)) {
      patchSameTree(oldEndVnode, newStartVnode)
      parent.insertBefore(oldEndVnode.el, oldStartVnode.el)
      oldEndVnode = oChild[--oldEndIndex]
      newStartVnode = nChild[++newStartIndex]
    } else {
      // 使用key时的比较
      if (keyToIndexMap === undefined) {
        keyToIndexMap = createKeyToOldIndex(oChild, oldStartIndex, oldEndIndex) // 有key生成index表
      }
      IndexInOChild = keyToIndexMap[newStartVnode.key]
      if (!IndexInOChild) {
        parent.insertBefore(genTree(newStartVnode), oldStartVnode.el)
        newStartVnode = nChild[++newStartIndex]
      } else {
        elToRemove = oChild[IndexInOChild]
        if (elToRemove.tag !== newStartVnode.tag) {
          parent.insertBefore(genTree(newStartVnode), oldStartVnode.el)
        } else {
          patchSameTree(elToRemove, newStartVnode)
          oChild[IndexInOChild] = null
          parent.insertBefore(elToRemove.el, oldStartVnode.el)
        }
        newStartVnode = nChild[++newStartIndex]
      }
    }
  }
  if (oldStartIndex > oldEndIndex) {
    // before = nChild[newEndIndex + 1] == null ? null : nChild[newEndIndex + 1].el
    addEls(parent, nChild, newStartIndex, newEndIndex)
  } else if (newStartIndex > newEndIndex) {
    removeEls(oChild, oldStartIndex, oldEndIndex)
  }
}

function createKeyToOldIndex(oChild, beginIdx, endIdx) {
  let i, key
  const map = {}
  for (i = beginIdx; i <= endIdx; ++i) {
    key = oChild[i].key
    if (key) map[key] = i
  }
  return map
}

function addEls(parent, nChilds, startIndex, endIndex) {
  for (; startIndex <= endIndex; ++startIndex) {
    parent.append(genTree(nChilds[startIndex]))
  }
}

function removeEls(oChilds, startIndex, endIndex) {
  for (; startIndex <= endIndex; ++startIndex) {
    const child = oChilds[startIndex]
    child && child.el.parentNode.removeChild(child.el)
  }
}

module.exports = {
  c, diff, patchSameTree, sameTree, genTree, reactive
}
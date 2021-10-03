`由于懒得上 ts, 用这个先代替一下子
Fiber: {
  type: string | function,
  props: Props,
  effectTag?: 'ADD' | 'UPDATE' | 'DELETE',
  dom?: HTMLElement,
  lastState?: Fiber, ---> 保存了上一次状态的 fiber
  chilrenFiber?: Fiber,
  parentFiber?: Fiber,
  subSiblingFiber?: Fiber
}

Props: {
  children: any,
  [key: string]: any
}`


/**
 * createElement 和 createTextFiber: 渲染函数, 用于从 jsx 返回基本 fiber 结构
 */
function createElement(type, props, childrens) {
  return {
    type,
    props: {
      ...props,
      // children也要放到props里面去，这样我们在组件里面就能通过this.props.children拿到子元素
      children: childrens.map(children => {
        return typeof children === 'object' ? children : createTextFiber(children)
      })
    }
  }
}


function createTextFiber(text) {
  return createElement('TEXT', { nodeValue: text }, [])
}


/**
 * createDom 和 updateDom: 用于从 fiber 结构创建和更新真实 DOM
 */
function createDom(fiber) {
  let dom
  if (fiber.type === 'TEXT') {
    dom = document.createTextNode(fiber.props.nodeValue);
  } else {
    dom = document.createElement(fiber.type)

    // 在真正的 DOM 上挂载 fiber 的 props
    fiber.props && updateDom(dom, {}, fiber.props)
  }
  return dom
}


function updateDom(dom, oldAttributes, newAttributes) {
  // 1. 过滤children属性
  // 2. 老的存在，新的没了，删除
  // 3. 新的存在，老的没有，新增
  Object.entries(oldAttributes)
    .filter(([key, _]) => key !== 'children')
    .filter(([key, _]) => !newAttributes.hasOwnProperty(key))
    .forEach(([key, val]) => {
      if (key.indexOf('on') === 0) {
        dom.removeEventListener(key.substr(2).toLowerCase(), val, false);
      } else {
        dom[key] = ''
      }
    })

  Object.entries(newAttributes)
    .filter(([key, _]) => key !== 'children')
    .forEach(([key, val]) => {
      if (key.indexOf('on') === 0) {
        dom.addEventListener(key.substr(2).toLowerCase(), val, false);
      } else {
        dom[key] = val
      }
    })
}


/**
 * 四个重要的全局变量
 */
let workInProgressFiber = null
let nextToDealWithFiber = null
let lastDealedFiber = null
let toBeDeletedFibers = null


/**
 * useState hook
 */

// 申明两个全局变量，用于处理 useState
let currentFCFiber = null   // currentFCFiber 是当前的函数组件 fiber 节点
let hookIndex = null    // hookIndex 是当前函数组件内部 useState 状态计数

function useState(init) {

  // 取出上次的Hook
  const oldHook = currentFCFiber?.lastState?.hooks[hookIndex]

  let hook = {
    state: oldHook ? oldHook.state : init
  }

  // 将所有useState调用按照顺序存到 fiber 节点上
  currentFCFiber.hooks.push(hook);
  hookIndex++

  const setState = (value) => {
    hook.state = value

    // 只要修改了state，我们就需要重新处理这个节点
    workInProgressFiber = {
      dom: lastDealedFiber.dom,
      props: lastDealedFiber.props,
      lastState: lastDealedFiber
    }

    // 修改 nextToDealWithFiber 指向 workInProgressFiber, 这样下次requestIdleCallback就会处理这个节点了
    nextToDealWithFiber = workInProgressFiber
    toBeDeletedFibers = []
  }

  return [hook.state, setState]
}


/**
 * 循环处理 fiber 的过程
 */
function workLoop(deadline) {

  // 这个 while 循环会在所有 fiber 处理完后或者时间到了的时候结束
  while (nextToDealWithFiber && deadline.timeRemaining() > 1) {
    nextToDealWithFiber = dealWithFiberAndReturnNextToDealFiber(nextToDealWithFiber);
  }
  // fiber 处理完后统一提交渲染
  if (!nextToDealWithFiber && workInProgressFiber) {
    commitRealDomOperation()
  }

  // 如果任务还没完但是时间到了, 需要继续注册一个 requestIdleCallback 继续下一轮循环
  requestIdleCallback(workLoop)
}


// 开启 workLoop
requestIdleCallback(workLoop)


/**
 * dealWithFiberAndReturnNextToDealFiber 用来处理当前 fiber 任务，返回的是下一个 fiber 任务
 */
function dealWithFiberAndReturnNextToDealFiber(fiber) {
  const isFunctionComponent = fiber.type instanceof Function

  if (isFunctionComponent) {
    dealWithFunctionComponent(fiber)
  }
  else {
    dealWithNormalElement(fiber)
  }

  // 这个函数的返回值是下一个任务，这其实是一个深度优先遍历
  // 先找子元素，没有子元素了就找兄弟元素
  // 兄弟元素也没有了就返回父元素
  // 然后再找这个父元素的兄弟元素
  // 最后到根节点结束
  // 这个遍历的顺序其实就是从下到上，从左到右
  if (fiber.childrenFiber) {
    return fiber.childrenFiber
  }

  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.subSiblingFiber) {
      return nextFiber.subSiblingFiber
    }
    nextFiber = nextFiber.parentFiber
  }
}


/**
 * dealWithFunctionComponent 和 dealWithNormalElement: 根据 fiber 的 type 来分别处理 组件和一般的节点
 */
function dealWithFunctionComponent(fiber) {
  currentFCFiber = fiber
  hookIndex = 0
  currentFCFiber.hooks = []  // hooks用来存储具体的state序列

  // 函数组件的type就是个函数，可以直接执行, 返回 fiber
  const children = [fiber.type(fiber.props)]
  reconcileChildrenFiber(fiber, children)
}


function dealWithNormalElement(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  const children = fiber.props && fiber.props.children
  reconcileChildrenFiber(fiber, children);
}


/**
 * 对 fiber 的进行增删查改, 并将这些 fiber 创建为一个链表结构
 */
function reconcileChildrenFiber(fiber, childrenFibers = []) {
  let oldChildrenFiber = fiber.lastState?.childrenFiber
  let prevSiblingFiber = null
  let newFiber = null
  childrenFibers.forEach((childrenFiber, i) => {
    if (!oldChildrenFiber) {
      newFiber = createBrandNewFiber(childrenFiber, fiber)
    }
    else {
      const isSameType = childrenFiber && oldChildrenFiber.type === childrenFiber.type
      if (isSameType) {
        newFiber = createFiber(
          oldChildrenFiber.type,
          childrenFiber.props,
          fiber,
          'UPDATE',
          oldChildrenFiber.dom,
          oldChildrenFiber
        )
      }
      else if (!isSameType && childrenFiber) {
        newFiber = createBrandNewFiber(childrenFiber, fiber)
      }
      else if (!isSameType && oldChildrenFiber) {
        oldChildrenFiber.effectTag = 'DELETE'
        toBeDeletedFibers.push(oldChildrenFiber);
      }
      oldChildrenFiber = oldChildrenFiber.subSiblingFiber;
    }
    if (i === 0) {
      fiber.childrenFiber = newFiber
    }
    else {
      prevSiblingFiber.subSiblingFiber = newFiber
    }
    prevSiblingFiber = newFiber
  })
}


/**
 * createFiber 用于在更新过程中创建 fiber 结构
 * createBrandNewFiber 创建一个某个特定 type 的新 fiber
 */
function createFiber(type, props, parentFiber, effectTag, dom, lastState) {
  return {
    type: type,
    props,
    parentFiber,
    effectTag,
    dom,
    lastState,
  }
}

function createBrandNewFiber(fiber, parentFiber) {
  return {
    type: fiber.type,
    props: fiber.props,
    parentFiber: parentFiber,
    effectTag: 'ADD',
    dom: null,
    lastState: null
  }
}


/**
 * 统一提交操作 DOM
 */
function commitRealDomOperation() {
  toBeDeletedFibers.forEach(dealWithFiberSRealDom)   // 删除打上删除标记的 fiber 所对应的真实 DOM

  dealWithFiberSRealDom(workInProgressFiber.childrenFiber)   // 开启处理

  lastDealedFiber = workInProgressFiber   // 记录一下 lastDealedFiber
  workInProgressFiber = null    // 操作完后将 workInProgressFiber 重置
}


function dealWithFiberSRealDom(fiber) {
  if (!fiber) return

  // 递归查找 fiber 对应 DOM 的父 DOM
  let parentFiber = fiber.parentFiber;
  while (!parentFiber.dom) {
    parentFiber = parentFiber.parentFiber;
  }
  const parentDom = parentFiber.dom;

  if (fiber.effectTag === 'ADD' && fiber.dom) {
    parentDom.appendChild(fiber.dom)
  }
  else if (fiber.effectTag === 'DELETE') {
    deleteFiberSRealDom(fiber, parentDom)
  }
  else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
    updateDom(fiber.dom, fiber.lastState.props, fiber.props)
  }

  // 递归操作子 fiber 和兄弟 fiber 
  dealWithFiberSRealDom(fiber.childrenFiber);
  dealWithFiberSRealDom(fiber.subSiblingFiber);
}


function deleteFiberSRealDom(fiber, parentDom) {
  if (fiber.dom) {
    parentDom.removeChild(fiber.dom)
  }
  else {
    // dom不存在，则是函数组件, 向下递归查找真实DOM
    deleteFiberSRealDom(fiber.childrenFiber, parentDom)
  }
}


function render(rawFiber, domToMount) {
  workInProgressFiber = {
    dom: domToMount,
    props: {
      children: [rawFiber]
    },
    lastState: lastDealedFiber
  }

  toBeDeletedFibers = []

  nextToDealWithFiber = workInProgressFiber
}


/**
 * 支持类组件
 */
class Component {
  constructor(props) {
    this.props = props
  }
}


/**
 * 将类组件转为函数组件
 */
function transfer(Component) {
  return function (props) {
    const component = new Component(props)
    const [state, setState] = useState(component.state)
    component.props = props
    component.state = state
    component.setState = setState

    return component.render()
  }
}


// module.exports = {
//   createElement,
//   render,
//   useState,
//   Component,
//   transfer
// }

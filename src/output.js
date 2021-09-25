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


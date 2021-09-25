const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const t = require('@babel/types')
const fs = require('fs')

module.exports = function (source) {

  var fileName = this.resourcePath
    .match(/\\[^\\]+?\.young$/)[0]
    .replace(/\\/, '')
    .replace(/\.young$/, '')

  var componentName = fileName[0].toUpperCase() + fileName.slice(1)

  var tree = parser.parse(source, {
    plugins: ['jsx'],
    sourceType: 'module',
  })

  var programPath
  var dataPathNode
  var newFunctionParam
  var rootFunctionParamPathNode
  var rootFunctionBlockPathNode
  var withBlockStatementPathNode
  var tempBlockStatementPathNode
  var mountStatementPathNode
  var golobalIdentifiers = ['oTree', 'render', 'data']
  var youngPath = './young'

  traverse(tree, {
    Program(path) {
      programPath = path
      path.node.body.unshift(
        t.variableDeclaration(
          'const',
          [t.variableDeclarator(
            t.objectPattern([
              t.objectProperty(
                t.identifier('c'),
                t.identifier('c')
              ),
              t.objectProperty(
                t.identifier('genTree'),
                t.identifier('genTree')
              ),
              t.objectProperty(
                t.identifier('reactive'),
                t.identifier('reactive')
              )
            ]),
            t.callExpression(
              t.identifier('require'),
              [t.stringLiteral(youngPath)]
            )
          )]
        ),
        t.functionDeclaration(
          t.identifier(componentName),
          [rootFunctionParamPathNode = t.objectPattern([])],
          rootFunctionBlockPathNode = t.blockStatement([])
        ),
      )
    },
    LabeledStatement(path) {
      if (path.node.label.name === 'props') {
        path.traverse({
          Identifier(path) {
            if (path.node.name === 'props') return
            rootFunctionParamPathNode.properties.push(
              t.objectProperty(
                path.node,
                path.node
              )
            )
            dataPathNode.properties.push(
              t.objectProperty(
                path.node,
                path.node
              )
            )
          }
        })
      }
      path.remove()
    },
    BlockStatement(path) {
      if (path.node === withBlockStatementPathNode) {
        programPath.traverse({
          JSXFragment(path2) {
            addToWithBlockPath(withBlockStatementPathNode, path2)
            path2.remove()
          },
          JSXElement(path2) {
            addToWithBlockPath(withBlockStatementPathNode, path2)
            path2.remove()
          },
        })
      }
      if (path.node === rootFunctionBlockPathNode) {
        path.node.body.unshift(
          t.variableDeclaration(
            'var',
            [t.variableDeclarator(
              t.identifier('render'),
              t.newExpression(
                t.identifier('Function'),
                newFunctionParam = []
              )
            )]
          ),
          t.functionDeclaration(
            t.identifier('getOTree'),
            [],
            t.blockStatement([
              t.returnStatement(
                t.identifier('oTree')
              )
            ])
          ),
          t.functionDeclaration(
            t.identifier('setOTree'),
            [t.identifier('nTree')],
            t.blockStatement([
              t.expressionStatement(
                t.assignmentExpression(
                  '=',
                  t.identifier('oTree'),
                  t.identifier('nTree')
                )
              )
            ])
          ),
          t.variableDeclaration(
            'var',
            [t.variableDeclarator(
              t.identifier('data'),
              t.callExpression(
                t.callExpression(
                  t.identifier('reactive'),
                  [
                    t.identifier('render'),
                    t.identifier('c'),
                    t.identifier('getOTree'),
                    t.identifier('setOTree')
                  ]
                ),
                [dataPathNode = t.objectExpression([])]
              )
            )]
          ),
          t.variableDeclaration(
            'var',
            [t.variableDeclarator(
              t.identifier('oTree'),
              t.callExpression(
                t.identifier('render'),
                [
                  t.identifier('data'),
                  t.identifier('c')
                ]
              )
            )]
          ),
          t.returnStatement(
            t.identifier('oTree'),
          ),
          tempBlockStatementPathNode = t.blockStatement([
            t.withStatement(
              t.identifier('data'),
              withBlockStatementPathNode = t.blockStatement([])
            ),
            t.returnStatement(
              t.identifier('nTree')
            )
          ]),
        )
      }
    },
    VariableDeclaration(path) {
      if (path.node.kind === 'const') return
      if (golobalIdentifiers.includes(path.node.declarations[0].id.name)) return
      if (path.parentPath.isProgram()) {
        const { id, init } = path.node.declarations[0]
        if (t.isArrowFunctionExpression(init)) {
          withBlockStatementPathNode.body.unshift(path.node)
          path.remove()
        } else if (t.isCallExpression(init) && init.callee.name === 'require') {
          path.skip()
        } else {
          dataPathNode.properties.push(t.objectProperty(id, init))
          path.remove()
        }
      }
    },
    JSXElement(path) {
      const { openingElement } = path.node
      const { children } = path.node
      const { name: { name: tag }, attributes } = openingElement
      const [isChildren, textOrChildren] = filterJSXTextOrChildren(children)
      const expression = t.callExpression(
        t.identifier('c'),
        [t.objectExpression([
          t.objectProperty(t.identifier('tag'), t.stringLiteral(tag)),
          t.objectProperty(
            t.identifier('attr'),
            t.objectExpression(
              attributes.map(({ name: { name: key }, value }) => {
                return t.objectProperty(
                  t.identifier(key),
                  t.isJSXExpressionContainer(value) ? value.expression : value
                )
              })
            )
          ),
          t.objectProperty(
            t.identifier('text'),
            !isChildren ?
              textOrChildren ?
                t.isJSXText(textOrChildren) ?
                  t.stringLiteral(textOrChildren?.value?.replace(/\/n/, '')?.trim() || '')
                  : textOrChildren
                : t.stringLiteral('')
              : t.stringLiteral('')
          ),
        ]),
        t.arrayExpression(isChildren ? textOrChildren : [])
        ])
      path.replaceWith(expression)
    },
  })

  traverse(tree, {
    BlockStatement(path) {
      if (path.node === tempBlockStatementPathNode) {
        newFunctionParam.push(
          t.stringLiteral('data'),
          t.stringLiteral('c'),
          t.stringLiteral(generate(path.node).code.replace(/^{/, '').replace(/}$/, '')),
        )
        path.remove()
      }
    },
    CallExpression(path) {
      if (path.node.callee.name === 'Young') {
        mountStatementPathNode = path.node.arguments[0]
        path.parentPath.replaceWith(
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                mountStatementPathNode,
                t.identifier('append')
              ),
              [t.callExpression(
                t.identifier('genTree'),
                [t.callExpression(
                  t.identifier(componentName),
                  [t.objectExpression([])]
                )]
              )]
            )
          )
        )
      }
    }
  })

  function filterJSXTextOrChildren(children){
    const text = [], childs = []
    children.forEach(item => {
      if (!item.expression) {
        if (t.isJSXElement(item)) {
          childs.push(item)
        } else {
          text.push(item)
        }
      } else {
        var callPathNode, menberPathNode
        if (
          t.isCallExpression(callPathNode = item.expression) &&
          t.isMemberExpression(menberPathNode = callPathNode.callee) &&
          ['map', 'filter'].includes(menberPathNode.property.name)
        ) {
          childs.push(t.spreadElement(item.expression))
        } else {
          text.push(item.expression)
        }
      }
    })
    return childs.length ? [true, childs] : [false, text.length ? text[0] : '']
  }

  function addToWithBlockPath(withBlockStatementPathNode, path){
    if (path.parentPath.node.type === 'ExpressionStatement') {
      withBlockStatementPathNode.body.unshift(
        t.assignmentExpression(
          '=',
          t.identifier('nTree'),
          path.node
        )
      )
    }
  }

  const processedSource = generate(tree).code

  const res = `${processedSource}\n`

  fs.writeFileSync('src/output.js', res)

  return res
}

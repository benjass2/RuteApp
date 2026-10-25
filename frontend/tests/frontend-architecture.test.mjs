import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const src = fileURLToPath(new URL('../src', import.meta.url))
const normalize = value => value.replaceAll('\\', '/')
function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? files(join(directory, entry.name))
      : /\.(ts|vue)$/.test(entry.name) ? [join(directory, entry.name)] : [])
}

function imports(file) {
  const content = readFileSync(file, 'utf8')
  const script = file.endsWith('.vue')
    ? [...content.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n')
    : content
  const ast = ts.createSourceFile(file, script, ts.ScriptTarget.Latest, true)
  const result = []
  function visit(node) {
    const module = ts.isImportDeclaration(node) || ts.isExportDeclaration(node) ? node.moduleSpecifier
      : ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword ? node.arguments[0] : null
    if (module && ts.isStringLiteral(module)) result.push(module.text)
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return result.map(specifier => ({ specifier, target: specifier.startsWith('@/') ? specifier.slice(2)
    : specifier.startsWith('.') ? normalize(relative(src, resolve(dirname(file), specifier))) : null }))
}
const graph = files(src).map(file => ({ file: normalize(relative(src, file)), imports: imports(file) }))

test('shared no depende de app ni de bounded contexts', () => {
  for (const entry of graph.filter(entry => entry.file.startsWith('shared/'))) {
    for (const { target } of entry.imports) {
      assert.ok(!target || target.startsWith('shared/'), `${entry.file} depende de ${target}`)
    }
  }
})

test('el dominio no depende de frameworks ni de capas externas', () => {
  for (const entry of graph.filter(entry => entry.file.startsWith('planificacion-rutas/domain/') || entry.file.startsWith('shared/domain/'))) {
    for (const { specifier, target } of entry.imports) {
      assert.ok(!/^(vue|pinia|primevue|leaflet)(\/|$)/.test(specifier), `${entry.file} importa ${specifier}`)
      assert.ok(!target || target.startsWith('planificacion-rutas/domain/') || target.startsWith('shared/domain/'),
        `${entry.file} depende de ${target}`)
    }
  }
})

test('las dependencias del contexto respetan la dirección de capas', () => {
  for (const entry of graph.filter(entry => entry.file.startsWith('planificacion-rutas/'))) {
    for (const { target } of entry.imports) {
      assert.ok(!target?.startsWith('app/'), `${entry.file} depende de la composición global`)
      if (entry.file.startsWith('planificacion-rutas/application/')) {
        assert.ok(!/^planificacion-rutas\/(infrastructure|presentation)\//.test(target ?? ''), `${entry.file} depende de ${target}`)
      }
      if (entry.file.startsWith('planificacion-rutas/infrastructure/')) {
        assert.ok(!/^planificacion-rutas\/(application|presentation)\//.test(target ?? ''), `${entry.file} depende de ${target}`)
      }
    }
  }
})

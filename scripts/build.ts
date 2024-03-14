/*
  This script is heavily inspired by `built.ts` used in https://github.com/honojs/hono/blob/main/build.ts
*/

import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import arg from 'arg'
import { build } from 'esbuild'
import type { Plugin, PluginBuild, BuildOptions } from 'esbuild'
import glob from 'glob'

const args = arg({
  '--watch': Boolean,
})

const isWatch = args['--watch'] || false

const entryPoints = glob.sync('./src/**/*.ts', {
  ignore: ['./src/**/*.test.ts'],
})

const addExtension = (extension: string = '.js', fileExtension: string = '.ts'): Plugin => ({
  name: 'add-extension',
  setup(build: PluginBuild) {
    build.onResolve({ filter: /.*/ }, (args) => {
      const deps = ['graphql', '@graphql-tools/schema']

      if (args.importer) {
        if (deps.indexOf(args.path) === -1) {
          const p = path.join(args.resolveDir, args.path)
          let tsPath = `${p}${fileExtension}`

          let importPath = ''
          if (fs.existsSync(tsPath)) {
            importPath = args.path + extension
          } else {
            tsPath = path.join(args.resolveDir, args.path, `index${fileExtension}`)
            if (fs.existsSync(tsPath)) {
              importPath = `${args.path}/index${extension}`
            }
          }
          return { path: importPath, external: true }
        } else {
          return {
            path: args.path,
            external: true,
          }
        }
      }
    })
  },
})

const commonOptions: BuildOptions = {
  watch: isWatch,
  entryPoints,
  logLevel: 'info',
  platform: 'node',
}

const cjsBuild = () =>
  build({
    ...commonOptions,
    outbase: './src',
    outdir: './dist/cjs',
    format: 'cjs',
  })

const esmBuild = () =>
  build({
    ...commonOptions,
    bundle: true,
    outbase: './src',
    outdir: './dist/esm',
    format: 'esm',
    plugins: [addExtension('.js')],
  })

Promise.all([esmBuild(), cjsBuild()])

exec(`tsc ${isWatch ? '-w' : ''} --emitDeclarationOnly --declaration --project tsconfig.build.json`)

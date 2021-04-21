import { BuildExecutorSchema } from '../executors/build/schema'
import { ServeExecutorSchema } from '../executors/serve/schema'

export function getEsbuildArgs(
    options: BuildExecutorSchema | ServeExecutorSchema,
    libRoot: string,
    packageJsonDependencies: string[],
) {
    return [
        options.entry || `${libRoot}/src/index.ts`,
        `--bundle`,
        `--sourcemap`,
        `--platform=${options.platform || 'node'}`,
        `--target=${options.target || 'node12'}`,
        ...(options.externals || [])
            .concat(packageJsonDependencies)
            .map((external) => `--external:${external}`),
        `--outfile=${options.outfile || `${libRoot}/dist/bundle.js`}`,
    ]
}
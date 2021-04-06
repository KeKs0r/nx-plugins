import { ExecutorContext } from '@nrwl/devkit'
import { createProjectGraph } from '@nrwl/workspace/src/core/project-graph'
import {
    calculateProjectDependencies,
    checkDependentProjectsHaveBeenBuilt,
    updateBuildableProjectPackageJsonDependencies,
} from '@nrwl/workspace/src/utilities/buildable-libs-utils'
import { PackageExecutorSchema } from './schema'
import execa from 'execa'

export async function packageExecutor(
    options: PackageExecutorSchema,
    context: ExecutorContext,
) {
    if (!context.projectName) {
        throw new Error('No projectName')
    }
    if (!context.targetName) {
        throw new Error('No targetName')
    }

    const projGraph = createProjectGraph()
    const libRoot = context.workspace.projects[context.projectName].root
    const { target, dependencies } = calculateProjectDependencies(
        projGraph,
        context.root,
        context.projectName,
        context.targetName,
        context.configurationName || 'production',
    )

    const tsup = execa('tsup', [
        options.main,
        '-d',
        `${libRoot}/dist`,
        ...dependencies.reduce<string[]>((acc, dep) => {
            acc.push('--external')
            acc.push(dep.name)
            return acc
        }, []),

        '--sourcemap',
        '--format',
        'esm,cjs',
        '--legacy-output',
    ])
    tsup.stdout?.pipe(process.stdout)
    await tsup

    const tsc = execa('tsc', [
        '-p',
        libRoot,
        '--declaration',
        '--outDir',
        `${libRoot}/dist`,
        '--emitDeclarationOnly',
    ])
    tsc.stdout?.pipe(process.stdout)
    await tsc

    if (
        dependencies.length > 0 &&
        options.updateBuildableProjectDepsInPackageJson
    ) {
        updateBuildableProjectPackageJsonDependencies(
            context.root,
            context.projectName,
            context.targetName,
            context.configurationName || 'production',
            target,
            dependencies,
            options.buildableProjectDepsInPackageJsonType || 'dependencies',
        )
    }

    return {
        success: true,
    }
}

export default packageExecutor
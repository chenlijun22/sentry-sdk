import { execSync } from 'child_process';
import { existsSync, statSync, unlinkSync, readFileSync } from 'fs';
import { join, resolve, relative, dirname } from 'path';
import { fileURLToPath } from 'url';
// 动态导入 glob 以兼容 ESM 和 CommonJS
/**
 * 动态导入 glob 模块以兼容 ESM 和 CommonJS
 */
async function getGlob() {
  try {
    // 尝试使用 createRequire 导入 CommonJS 模块
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const globModule = require('glob');
    return globModule.glob || globModule.default || globModule;
  } catch {
    // 如果失败，尝试直接导入
    const globModule = await import('glob');
    return globModule.glob || globModule.default || globModule;
  }
}

/**
 * 加载 .env 文件到 process.env
 * 支持 .env, .env.local, .env.production, .env.production.local 等文件
 * .env.local 优先级最高（可以覆盖其他文件的值）
 */
function loadEnvFiles() {
  const cwd = process.cwd();
  // 按优先级从低到高排序
  const envFiles = [
    '.env',
    '.env.production',
    '.env.production.local',
  ];
  
  // 先加载普通文件（不覆盖已存在的环境变量）
  for (const envFile of envFiles) {
    const envPath = join(cwd, envFile);
    if (existsSync(envPath)) {
      try {
        const envContent = readFileSync(envPath, 'utf-8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
          // 跳过空行和注释
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) {
            continue;
          }
          
          // 解析 KEY=VALUE 格式
          const match = trimmed.match(/^([^=:#]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            
            // 移除引号
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            
            // 只有在环境变量不存在时才设置（不覆盖已存在的）
            if (!process.env[key]) {
              process.env[key] = value;
            }
          }
        }
      } catch (error) {
        // 忽略读取错误，继续处理其他文件
        console.warn(`Warning: Failed to load ${envFile}:`, error);
      }
    }
  }
  
  // 最后加载 .env.local（优先级最高，可以覆盖之前的值）
  const localEnvPath = join(cwd, '.env.local');
  if (existsSync(localEnvPath)) {
    try {
      const envContent = readFileSync(localEnvPath, 'utf-8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        // 跳过空行和注释
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          continue;
        }
        
        // 解析 KEY=VALUE 格式
        const match = trimmed.match(/^([^=:#]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          
          // 移除引号
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          // .env.local 可以覆盖之前的值
          process.env[key] = value;
        }
      }
    } catch (error) {
      // 忽略读取错误
      console.warn(`Warning: Failed to load .env.local:`, error);
    }
  }
}

interface CliOptions {
  authToken?: string;
  org?: string;
  project?: string;
  release?: string;
  sourcemaps?: string | string[];
  urlPrefix?: string;
  urlSuffix?: string;
  deleteAfterUpload?: boolean;
  distPath?: string;
  dryRun?: boolean;
}

function getSentryCliPath(): string {
  try {
    // 获取当前文件的目录（在构建后的 dist 目录中）
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = dirname(currentFile);
    
    // 尝试多个可能的路径
    const possiblePaths = [
      // 从 dist 目录查找 node_modules
      join(currentDir, '..', 'node_modules', '.bin', 'sentry-cli'),
      // 从项目根目录查找
      join(currentDir, '..', '..', 'node_modules', '.bin', 'sentry-cli'),
      // 全局安装的 sentry-cli
      'sentry-cli',
    ];
    
    for (const cliPath of possiblePaths) {
      if (cliPath === 'sentry-cli') {
        // 对于命令，直接返回（假设在 PATH 中）
        return cliPath;
      }
      if (existsSync(cliPath)) {
        return cliPath;
      }
    }
  } catch {
    // 忽略错误，继续尝试其他方法
  }
  
  // 默认使用 sentry-cli 命令（假设它在 PATH 中）
  return 'sentry-cli';
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--auth-token':
      case '-t':
        options.authToken = nextArg;
        i++;
        break;
      case '--org':
      case '-o':
        options.org = nextArg;
        i++;
        break;
      case '--project':
      case '-p':
        options.project = nextArg;
        i++;
        break;
      case '--release':
      case '-r':
        options.release = nextArg;
        i++;
        break;
      case '--sourcemaps':
      case '-s':
        options.sourcemaps = nextArg;
        i++;
        break;
      case '--url-prefix':
        options.urlPrefix = nextArg;
        i++;
        break;
      case '--url-suffix':
        options.urlSuffix = nextArg;
        i++;
        break;
      case '--delete-after-upload':
        options.deleteAfterUpload = true;
        break;
      case '--no-delete-after-upload':
        options.deleteAfterUpload = false;
        break;
      case '--dist-path':
      case '-d':
        options.distPath = nextArg;
        i++;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Usage: channelwill-sentry-cli [options]

Upload sourcemaps to Sentry using sentry-cli.

Options:
  -t, --auth-token <token>     Sentry auth token (or set SENTRY_AUTH_TOKEN or VITE_SENTRY_AUTH_TOKEN)
  -o, --org <org>              Sentry organization (or set SENTRY_ORG or VITE_SENTRY_ORG)
  -p, --project <project>      Sentry project (or set SENTRY_PROJECT or VITE_SENTRY_PROJECT)
  -r, --release <release>      Release name (auto-generated from git/CI if not provided)
  -s, --sourcemaps <path>      Sourcemap files path/pattern (default: dist/**/*.map)
  -d, --dist-path <path>       Distribution directory (default: dist)
  --url-prefix <prefix>        URL prefix for sourcemaps (e.g., ~/)
  --url-suffix <suffix>        URL suffix for sourcemaps
  --delete-after-upload        Delete sourcemap files after upload (default: true)
  --no-delete-after-upload     Keep sourcemap files after upload
  --dry-run                    Show what would be done without actually doing it
  -h, --help                   Show this help message

Environment Variables:
  SENTRY_AUTH_TOKEN            Sentry auth token (or VITE_SENTRY_AUTH_TOKEN)
  SENTRY_ORG                   Sentry organization (or VITE_SENTRY_ORG)
  SENTRY_PROJECT               Sentry project (or VITE_SENTRY_PROJECT)
  SENTRY_RELEASE               Release name (auto-generated from git/CI if not provided)

Examples:
  # Basic usage with environment variables
  channelwill-sentry-cli

  # Specify options via command line (release is optional, will auto-generate)
  channelwill-sentry-cli --org my-org --project my-project --release v1.0.0
  
  # Auto-generate release from git commit
  channelwill-sentry-cli --org my-org --project my-project

  # Custom sourcemap path
  channelwill-sentry-cli --sourcemaps "build/**/*.map" --url-prefix "~/static/"

  # Keep sourcemaps after upload (default is to delete)
  channelwill-sentry-cli --no-delete-after-upload
`);
}

/**
 * 自动生成 release 名称，与 sentryVitePlugin 使用相同的逻辑
 * 优先级：
 * 1. 用户提供的 release（命令行参数或环境变量）
 * 2. CI 环境变量（VERCEL_GIT_COMMIT_SHA, SOURCE_VERSION, CIRCLE_SHA1, HEROKU_SLUG_COMMIT 等）
 * 3. Git commit hash
 * 4. package.json 的 version
 * 5. 基于时间戳的 fallback
 */
function generateReleaseName(): string {
  // 1. 检查 CI 环境变量
  const ciRelease = 
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.SOURCE_VERSION ||
    process.env.CIRCLE_SHA1 ||
    process.env.HEROKU_SLUG_COMMIT ||
    process.env.GITHUB_SHA ||
    process.env.CI_COMMIT_SHA ||
    process.env.BUILDKITE_COMMIT ||
    process.env.TRAVIS_COMMIT;
  
  if (ciRelease) {
    return ciRelease;
  }

  // 2. 尝试从 git 获取 commit hash
  try {
    const gitCommit = execSync('git rev-parse HEAD', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (gitCommit) {
      return gitCommit;
    }
  } catch {
    // Git 不可用，继续尝试其他方法
  }

  // 3. 尝试从 package.json 获取 version
  try {
    const packageJsonPath = join(process.cwd(), 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.version) {
        return packageJson.version;
      }
    }
  } catch {
    // 读取 package.json 失败，继续尝试其他方法
  }

  // 4. Fallback: 使用时间戳
  return `release-${Date.now()}`;
}

function resolveOptions(options: CliOptions): Required<Pick<CliOptions, 'authToken' | 'org' | 'project' | 'release' | 'sourcemaps' | 'distPath'>> & Pick<CliOptions, 'urlPrefix' | 'urlSuffix' | 'deleteAfterUpload' | 'dryRun'> {
  // 优先使用命令行参数，然后是 SENTRY_* 环境变量，最后是 VITE_SENTRY_* 环境变量
  const authToken = options.authToken || process.env.SENTRY_AUTH_TOKEN || process.env.VITE_SENTRY_AUTH_TOKEN;
  const org = options.org || process.env.SENTRY_ORG || process.env.VITE_SENTRY_ORG;
  const project = options.project || process.env.SENTRY_PROJECT || process.env.VITE_SENTRY_PROJECT;
  // 如果没有提供 release，自动生成（与 sentryVitePlugin 相同的逻辑）
  const release = options.release || process.env.SENTRY_RELEASE || generateReleaseName();
  const distPath = options.distPath || 'dist';
  const sourcemaps = options.sourcemaps || `${distPath}/**/*.map`;

  if (!authToken) {
    console.error('Error: Auth token is required. Set it via --auth-token, SENTRY_AUTH_TOKEN, or VITE_SENTRY_AUTH_TOKEN environment variable.');
    process.exit(1);
  }

  if (!org) {
    console.error('Error: Organization is required. Set it via --org, SENTRY_ORG, or VITE_SENTRY_ORG environment variable.');
    process.exit(1);
  }

  if (!project) {
    console.error('Error: Project is required. Set it via --project, SENTRY_PROJECT, or VITE_SENTRY_PROJECT environment variable.');
    process.exit(1);
  }

  return {
    authToken,
    org,
    project,
    release,
    sourcemaps,
    distPath,
    urlPrefix: options.urlPrefix,
    urlSuffix: options.urlSuffix,
    deleteAfterUpload: options.deleteAfterUpload !== undefined ? options.deleteAfterUpload : true,
    dryRun: options.dryRun || false,
  };
}

async function findSourcemapFiles(pattern: string | string[]): Promise<string[]> {
  const globFn = await getGlob();
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  const files: string[] = [];

  for (const p of patterns) {
    const matches = await globFn(p, {
      cwd: process.cwd(),
      absolute: true,
      ignore: ['node_modules/**'],
    });
    files.push(...matches);
  }

  return files.filter((file) => {
    try {
      return statSync(file).isFile();
    } catch {
      return false;
    }
  });
}

function deleteSourcemapFiles(files: string[]) {
  console.log(`\nDeleting ${files.length} sourcemap file(s)...`);
  for (const file of files) {
    try {
      unlinkSync(file);
      console.log(`  Deleted: ${relative(process.cwd(), file)}`);
    } catch (error) {
      console.error(`  Failed to delete ${file}:`, error);
    }
  }
}

async function main() {
  // 首先加载 .env 文件
  loadEnvFiles();
  
  const options = parseArgs();
  const config = resolveOptions(options);

  if (config.dryRun) {
    console.log('Dry run mode - no changes will be made\n');
    console.log('Configuration:');
    console.log(`  Auth Token: ${config.authToken.substring(0, 10)}...`);
    console.log(`  Org: ${config.org}`);
    console.log(`  Project: ${config.project}`);
    console.log(`  Release: ${config.release}`);
    console.log(`  Sourcemaps pattern: ${config.sourcemaps}`);
    console.log(`  Dist path: ${config.distPath}`);
    if (config.urlPrefix) console.log(`  URL prefix: ${config.urlPrefix}`);
    if (config.urlSuffix) console.log(`  URL suffix: ${config.urlSuffix}`);
    console.log(`  Delete after upload: ${config.deleteAfterUpload}`);
    return;
  }

  const cwd = process.cwd();

  console.log('Uploading sourcemaps to Sentry...');
  console.log(`  Org: ${config.org}`);
  console.log(`  Project: ${config.project}`);
  console.log(`  Release: ${config.release}`);

  // 查找 sourcemap 文件
  console.log(`\nFinding sourcemap files matching: ${config.sourcemaps}`);
  const sourcemapFiles = await findSourcemapFiles(config.sourcemaps);

  if (sourcemapFiles.length === 0) {
    console.warn('Warning: No sourcemap files found. Nothing to upload.');
    return;
  }

  console.log(`Found ${sourcemapFiles.length} sourcemap file(s)`);

  // 构建 sentry-cli 命令
  const distDir = resolve(cwd, config.distPath);
  if (!existsSync(distDir)) {
    console.error(`Error: Distribution directory does not exist: ${distDir}`);
    process.exit(1);
  }

  // 获取 sentry-cli 路径
  const sentryCli = getSentryCliPath();
  
  const cmdParts: string[] = [
    sentryCli,
    'releases',
    'files',
    config.release,
    'upload-sourcemaps',
    distDir,
  ];

  if (config.urlPrefix) {
    cmdParts.push('--url-prefix', config.urlPrefix);
  }

  if (config.urlSuffix) {
    cmdParts.push('--url-suffix', config.urlSuffix);
  }

  // 设置环境变量
  const env = {
    ...process.env,
    SENTRY_AUTH_TOKEN: config.authToken,
    SENTRY_ORG: config.org,
    SENTRY_PROJECT: config.project,
  };

  try {
    console.log(`\nExecuting: ${cmdParts.join(' ')}`);
    execSync(cmdParts.join(' '), {
      cwd,
      env,
      stdio: 'inherit',
    });

    console.log('\n✅ Sourcemaps uploaded successfully!');

    // 删除 sourcemap 文件（如果启用）
    if (config.deleteAfterUpload) {
      deleteSourcemapFiles(sourcemapFiles);
    }
  } catch (error) {
    console.error('\n❌ Failed to upload sourcemaps:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});


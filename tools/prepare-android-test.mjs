import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  readFile,
  realpath,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const runtime = path.resolve(project, "../.runtime/work/android-test");
const sourceManifest = path.join(project, "src/manifest.json");
const help = `Prepare isolated Android test resources; never submits a cloud build.

  node tools/prepare-android-test.mjs --dry-run
  node tools/prepare-android-test.mjs --appid <DCloud-issued-AppID>
  node tools/prepare-android-test.mjs --appid <DCloud-issued-AppID> --output <new-directory>

An AppID is public application metadata, not an account password. Obtain the real
value by signing in to DCloud. Never pass a password, signing key, or access token.
Output must be a new directory below ../.runtime/work/android-test.
Without --appid, only --dry-run is allowed; it does not compile or create a package.`;

function parseArgs(values) {
  const options = { dryRun: false, appid: "", output: "" };
  const seen = new Set();
  for (let i = 0; i < values.length; i++) {
    const flag = values[i];
    if (flag === "--help" || flag === "-h") return { help: true };
    if (seen.has(flag)) throw new Error(`Duplicate option: ${flag}`);
    seen.add(flag);
    if (flag === "--dry-run") options.dryRun = true;
    else if (flag === "--appid" || flag === "--output") {
      const value = values[++i];
      if (!value || value.startsWith("--"))
        throw new Error(`Missing value for ${flag}`);
      options[flag.slice(2)] = value;
    } else throw new Error(`Unknown option: ${flag}`);
  }
  return options;
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function requireFile(file) {
  if (!(await stat(file)).isFile())
    throw new Error(`Required file missing: ${file}`);
}

function runNode(cwd, args) {
  const env = { ...process.env };
  // The test build must not inherit a caller's API target or another uni project.
  for (const key of Object.keys(env))
    if (key.startsWith("VITE_") || key.startsWith("UNI_")) delete env[key];
  env.NODE_ENV = "production";
  const result = spawnSync(process.execPath, args, {
    cwd,
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `Local resource build failed (exit ${result.status ?? result.signal})`,
    );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(help);
    return;
  }
  if (
    options.appid &&
    (!/^__UNI__[a-z0-9]{6,}$/i.test(options.appid) ||
      /^__UNI__(?:x+|0+|example|placeholder)$/i.test(options.appid))
  )
    throw new Error(
      "Use a real DCloud-issued __UNI__ AppID; placeholders are not accepted.",
    );
  if (!options.appid && !options.dryRun)
    throw new Error(
      "Missing DCloud AppID. Sign in to DCloud first; use --dry-run to inspect preparation without creating a package.",
    );

  const profile = JSON.parse(
    await readFile(path.join(project, "config/android-test.json"), "utf8"),
  );
  if (
    profile.schemaVersion !== 1 ||
    !profile.name ||
    !/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*){2,}$/.test(profile.packageName) ||
    !/^\d+$/.test(profile.versionCode) ||
    !Array.isArray(profile.android?.abiFilters) ||
    profile.android.abiFilters.some(
      (abi) => !["arm64-v8a", "armeabi-v7a"].includes(abi),
    )
  )
    throw new Error("Invalid non-secret Android test profile.");
  const pkg = JSON.parse(
    await readFile(path.join(project, "package.json"), "utf8"),
  );
  const packages = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const [name, version] of Object.entries(packages)) {
    if (
      name.startsWith("@dcloudio/") &&
      name !== "@dcloudio/types" &&
      version !== profile.compilerVersion
    )
      throw new Error(`DCloud compiler version mismatch: ${name}`);
  }
  const installed = JSON.parse(
    await readFile(
      path.join(project, "node_modules/@dcloudio/vite-plugin-uni/package.json"),
      "utf8",
    ),
  );
  if (installed.version !== profile.compilerVersion)
    throw new Error(
      "Installed uni compiler does not match the locked Android test profile. Run npm ci in web-client.",
    );

  const inputs = [
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tsconfig.json",
    "index.html",
    "tools/prepare-icons.mjs",
  ];
  for (const input of inputs) await requireFile(path.join(project, input));
  await requireFile(sourceManifest);
  const original = await readFile(sourceManifest);
  const manifest = JSON.parse(original.toString("utf8"));
  const stamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
  const output = options.output
    ? path.resolve(options.output)
    : path.join(runtime, stamp);
  if (!output.startsWith(`${runtime}${path.sep}`))
    throw new Error(`Output must be a new child of ${runtime}`);
  const stage = path.join(output, "project");
  const resources = path.join(stage, "dist/build/app");
  const plan = {
    mode: options.dryRun ? "dry-run" : "local-resource-build",
    appidStatus: options.appid
      ? "provided; ownership verified by DCloud during packaging"
      : "missing; DCloud login and AppID required",
    appid: options.appid || null,
    name: profile.name,
    packageName: profile.packageName,
    versionName: profile.versionName,
    versionCode: profile.versionCode,
    compilerVersion: profile.compilerVersion,
    abiFilters: profile.android.abiFilters,
    sourceManifestSha256: hash(original),
    stagingProject: stage,
    appResources: resources,
    sourceModified: false,
    cloudBuildSubmitted: false,
    apkGenerated: false,
  };
  if (options.dryRun) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  await mkdir(runtime, { recursive: true });
  // Resolving the parent rejects output paths that escape through an existing symlink.
  const parent = path.dirname(output);
  await mkdir(parent, { recursive: true });
  const canonicalRuntime = await realpath(runtime);
  const canonicalParent = await realpath(parent);
  if (
    canonicalParent !== canonicalRuntime &&
    !canonicalParent.startsWith(`${canonicalRuntime}${path.sep}`)
  )
    throw new Error(
      "Output parent resolves outside the isolated runtime directory.",
    );
  await mkdir(output); // Refuse to replace any existing build or user files.
  await mkdir(path.join(stage, "tools"), { recursive: true });
  for (const input of inputs)
    await cp(path.join(project, input), path.join(stage, input));
  await cp(path.join(project, "src"), path.join(stage, "src"), {
    recursive: true,
  });
  await symlink(
    path.join(project, "node_modules"),
    path.join(stage, "node_modules"),
    "dir",
  );
  manifest.name = profile.name;
  manifest.description = profile.description;
  manifest.appid = options.appid;
  manifest.versionName = profile.versionName;
  manifest.versionCode = profile.versionCode;
  manifest["app-plus"] ??= {};
  manifest["app-plus"].distribute ??= {};
  manifest["app-plus"].distribute.android = {
    ...manifest["app-plus"].distribute.android,
    ...profile.android,
    packagename: profile.packageName,
  };
  // Signing inputs remain exclusively in the packager, never in copied resources.
  for (const key of ["keystore", "password", "aliasname"])
    delete manifest["app-plus"].distribute.android[key];
  await writeFile(
    path.join(stage, "src/manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  try {
    runNode(stage, ["tools/prepare-icons.mjs"]);
    runNode(stage, [
      path.join(stage, "node_modules/@dcloudio/vite-plugin-uni/bin/uni.js"),
      "build",
      "-p",
      "app",
    ]);
    const built = JSON.parse(
      await readFile(path.join(resources, "manifest.json"), "utf8"),
    );
    if (
      built.id !== options.appid ||
      built.name !== profile.name ||
      built.plus?.distribute?.android?.packagename !== profile.packageName
    )
      throw new Error(
        "Compiled manifest does not match the Android test identity.",
      );
    await requireFile(path.join(resources, "app-service.js"));
    if (hash(await readFile(sourceManifest)) !== plan.sourceManifestSha256)
      throw new Error(
        "Source manifest changed during preparation; inspect concurrent edits before continuing.",
      );
    const result = {
      ...plan,
      status: "resources-ready; APK packaging still required",
      completedAt: new Date().toISOString(),
    };
    await writeFile(
      path.join(output, "preparation.json"),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    await writeFile(
      path.join(output, "preparation.json"),
      `${JSON.stringify({ ...plan, status: "failed", message: String(error) }, null, 2)}\n`,
    );
    throw error;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

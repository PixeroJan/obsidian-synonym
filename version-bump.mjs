import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.PLUGIN_VERSION ?? process.env.npm_package_version;

if (!targetVersion) {
	throw new Error("A plugin version is required.");
}

// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

// Keep the package metadata aligned with the plugin version used for the release.
let packageJson = JSON.parse(readFileSync("package.json", "utf8"));
packageJson.version = targetVersion;
writeFileSync("package.json", JSON.stringify(packageJson, null, 2) + "\n");

let packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
packageLock.version = targetVersion;
if (packageLock.packages && packageLock.packages[""]) {
	packageLock.packages[""].version = targetVersion;
}
writeFileSync("package-lock.json", JSON.stringify(packageLock, null, 2) + "\n");

// Update versions.json with target version and minAppVersion from manifest.json.
let versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));

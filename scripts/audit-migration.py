"""Inventory migration sources without executing PHP or exporting data/secrets.

Run from the repository root. File hashes establish which source copy was
compared; this report deliberately does not claim semantic feature parity.
"""
from pathlib import Path
import hashlib
import json
import re
import os

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    "original": ROOT.parent / "Ecommerce-Multivendor",
    "legacy": ROOT / "legacy-ecommercemultivendor",
}
CODE_DIRS = ("app", "routes", "resources", "config", "database", "addons", "temp", "Backup/app", "Backup/routes", "Backup/resources")
EXTENSIONS = {".php", ".js", ".ts", ".tsx", ".json", ".css", ".scss"}


def source_files(directory):
    for folder, directories, names in os.walk(directory):
        directories[:] = sorted(name for name in directories if name not in {"node_modules", ".next", "dist", "vendor", ".git", ".turbo"})
        for name in sorted(names):
            yield Path(folder) / name


def inventory(root, directories):
    result = {}
    for directory in directories:
        for path in source_files(root / directory):
            if not path.is_file() or path.suffix not in EXTENSIONS:
                continue
            if any(part in {"node_modules", ".next", "dist", "vendor"} for part in path.parts):
                continue
            data = path.read_bytes()
            source = data.decode("utf-8", errors="replace")
            entry = {
                "sha256": hashlib.sha256(data).hexdigest(),
                "normalizedSha256": hashlib.sha256("\n".join(line.rstrip() for line in source.splitlines()).encode()).hexdigest(),
                "lines": len(source.splitlines()),
            }
            if path.suffix == ".php":
                entry["functions"] = re.findall(r"function\s+(\w+)\s*\(", source)
                entry["controllerActions"] = sorted(set(re.findall(r"([\w\\]+Controller)@(\w+)", source)))
            if path.suffix in {".ts", ".tsx"}:
                entry["exportedFunctions"] = re.findall(r"export\s+(?:async\s+)?function\s+(\w+)", source)
                entry["apiCalls"] = re.findall(r"api\.(get|post|put|patch|delete)(?:<[^;]*?>)?\(\s*[\"'`]([^\"'`]+)", source)
            result[path.relative_to(root).as_posix()] = entry
    return result


def main():
    sources = {name: inventory(root, CODE_DIRS) for name, root in SOURCES.items()}
    original, legacy = sources["original"], sources["legacy"]
    common = original.keys() & legacy.keys()
    target = inventory(ROOT, ("apps", "packages"))
    report = {
        "warning": "Structural inventory only. Matching files/routes do not prove behavior or edge-case parity.",
        "summary": {
            "originalFiles": len(original),
            "legacyFiles": len(legacy),
            "targetFiles": len(target),
            "targetPages": sum(path.endswith("/page.tsx") for path in target),
            "identicalSourceFiles": sum(original[p]["sha256"] == legacy[p]["sha256"] for p in common),
        },
        "sourceDifferences": {
            "originalOnly": sorted(original.keys() - legacy.keys()),
            "legacyOnly": sorted(legacy.keys() - original.keys()),
            "changed": sorted(p for p in common if original[p]["sha256"] != legacy[p]["sha256"]),
            "changedIgnoringLineEndingsAndTrailingWhitespace": sorted(p for p in common if original[p]["normalizedSha256"] != legacy[p]["normalizedSha256"]),
        },
        "sources": sources,
        "target": target,
    }
    destination = ROOT / "docs" / "migration" / "inventory.json"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"summary": report["summary"], "sourceDifferenceCounts": {key: len(value) for key, value in report["sourceDifferences"].items()}, "substantiveSourceDifferences": report["sourceDifferences"]["changedIgnoringLineEndingsAndTrailingWhitespace"]}, indent=2))


if __name__ == "__main__":
    main()

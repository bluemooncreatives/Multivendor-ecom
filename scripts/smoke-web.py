"""Smoke-test production page shells and assets; does not claim browser acceptance."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen
from urllib.error import HTTPError, URLError
import json
import os
import socket
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "apps" / "web"


def main():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    log_path = ROOT / "data" / "logs" / "web-smoke.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    paths = []
    for page in (WEB / "app").rglob("page.tsx"):
        segments = ["en" if part == "[locale]" else part for part in page.parent.relative_to(WEB / "app").parts]
        if "payment-gateways" in segments:
            continue
        if any("[" in part for part in segments):
            continue
        paths.append("/" + "/".join(segments))
    paths += ["/favicon.ico", "/frontend/images/placeholder.jpg", "/download/product_bulk_demo.xlsx", "/pos_banner.jpg"]
    base = f"http://127.0.0.1:{port}"

    def check(path):
        try:
            with urlopen(base + path, timeout=30) as response:
                response.read()
                return {"path": path, "status": response.status}
        except HTTPError as error:
            return {"path": path, "status": error.code}
        except (URLError, TimeoutError):
            return {"path": path, "status": "connection_failed"}

    with log_path.open("w", encoding="utf-8") as log:
        process = subprocess.Popen(
            ["node", str(ROOT / "node_modules" / "next" / "dist" / "bin" / "next"), "start", str(WEB), "--port", str(port)],
            cwd=ROOT, stdout=log, stderr=subprocess.STDOUT,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
        try:
            deadline = time.monotonic() + 60
            while check("/en")["status"] != 200:
                if process.poll() is not None or time.monotonic() > deadline:
                    raise RuntimeError("Production web server did not become ready; see data/logs/web-smoke.log")
                time.sleep(0.25)
            with ThreadPoolExecutor(max_workers=4) as pool:
                results = list(pool.map(check, sorted(paths)))
        finally:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
    failures = [result for result in results if result["status"] != 200]
    report = {"scope": "HTTP page shells and static assets only; no authenticated browser workflows", "checked": len(results), "failed": failures, "results": results}
    (ROOT / "docs" / "migration" / "http-smoke.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"checked": len(results), "failed": failures}))
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

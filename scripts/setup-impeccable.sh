#!/bin/sh
# Restore the pinned design engine without requiring a global npm installation.
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
scripts="$root/.opencode/skills/impeccable/scripts"
version=$(tr -d '[:space:]' < "$scripts/VERSION")

case "$(uname -s)" in
  Linux) os=linux ;;
  Darwin) os=darwin ;;
  *) echo "Use the bundled impeccable.cmd launcher on Windows." >&2; exit 1 ;;
esac
case "$(uname -m)" in
  x86_64|amd64) arch=x64 ;;
  arm64|aarch64) arch=arm64 ;;
  *) echo "Unsupported engine architecture." >&2; exit 1 ;;
esac

asset="impeccable-$os-$arch"
expected=$(awk -v v="$version" -v a="$asset" '$1 == v && $2 == a { print $3 }' "$scripts/engine-checksums.txt")
[ -n "$expected" ] || { echo "No trusted checksum for $asset $version." >&2; exit 1; }
destination="${IMPECCABLE_ENGINE_DIR:-$scripts/bin/$os-$arch}"
mkdir -p "$destination"
temporary=$(mktemp "$destination/.engine.XXXXXX")
trap 'rm -f "$temporary"' EXIT HUP INT TERM

if [ -n "${IMPECCABLE_ENGINE_SOURCE:-}" ]; then
  cp "$IMPECCABLE_ENGINE_SOURCE" "$temporary"
else
  curl --fail --location --silent --show-error --max-time 120 --retry 2 \
    "https://github.com/pbakaus/impeccable/releases/download/engine-v$version/$asset" \
    --output "$temporary"
fi

if command -v sha256sum >/dev/null 2>&1; then
  actual=$(sha256sum "$temporary" | awk '{ print $1 }')
elif command -v shasum >/dev/null 2>&1; then
  actual=$(shasum -a 256 "$temporary" | awk '{ print $1 }')
else
  echo "A SHA-256 verification utility is required." >&2
  exit 1
fi
[ "$actual" = "$expected" ] || { echo "Engine checksum mismatch; refusing installation." >&2; exit 1; }
chmod +x "$temporary"
[ "$("$temporary" engine-probe)" = "impeccable-engine $version" ] || {
  echo "Engine version handshake failed." >&2; exit 1;
}
mv "$temporary" "$destination/impeccable"
echo "Verified and restored engine $version to $destination/impeccable"

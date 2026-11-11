# Shared design tooling

The OpenCode skill and command under `.opencode/` are vendored from [Impeccable](https://github.com/pbakaus/impeccable), distributed under Apache-2.0. Its license is retained with the skill. The platform engine is excluded from Git, not deleted locally.

## Restore the engine

From the project root on Linux or macOS:

```sh
sh scripts/setup-impeccable.sh
.opencode/skills/impeccable/scripts/impeccable engine-probe
```

The restore script reads the pinned engine release from `scripts/VERSION` inside the skill, downloads the platform asset, verifies SHA-256 against the committed `engine-checksums.txt`, and checks the version handshake before installing. Currently the engine release is `0.1.21`; its application CLI reports `4.8.2`. These are different version namespaces, not a mismatch.

Requirements: network access to GitHub Releases, `curl`, a POSIX shell, and `sha256sum` or `shasum`. Supported by this script: Linux/macOS on x64 and ARM64 where the committed manifest provides a digest. Windows users can use the skill's `impeccable.cmd` launcher and its documented verified download/cache flow.

For an offline machine, obtain the correct official engine asset on a connected machine, transfer it, and use:

```sh
IMPECCABLE_ENGINE_SOURCE=/absolute/path/to/downloaded-engine sh scripts/setup-impeccable.sh
```

The same checksum and version checks apply. `IMPECCABLE_ENGINE_DIR` can select an isolated installation directory for verification without replacing the user's engine. Do not bypass the checksum or edit it to accept an untrusted download.

Verification performed: downloaded the official Linux x64 release into a temporary directory, matched digest `579a0b6ff639ed28812ae632c556b6524a5b7d13fff4227cd3095a65554415b6`, and restored/ran it in isolation. A deliberately invalid source must fail without replacing the installed engine.

Automatic design hooks remain disabled. Product-context initialization and UI design have not been performed; the backend/platform work does not imply those tasks are complete.

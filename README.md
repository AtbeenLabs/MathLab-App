# AtbinYar — Public Releases

**Copyright © 2026 آتبین امیدی (Atbin Omidi). All rights reserved.**

This repository is the public distribution endpoint for official AtbinYar installers and update metadata.

## Downloads

Get the latest official release here:

https://github.com/AtbeenLabs/MathLab-App/releases/latest

Available release packages include Windows, Linux, and Android builds. The release assets and updater metadata are published here so existing installations can continue receiving updates.

## Source and build pipeline

The application source is maintained separately in the private repository `AtbeenLabs/AtbeenYar-Source`.

The workflow in `.github/workflows/release.yml` checks out that private source, runs tests and platform builds, and publishes only signed installers and update metadata to this repository.

This repository is intended for distribution artifacts and release automation, not application source development.

Older releases and historical Git objects may still contain snapshots from when source files were previously present in this public repository. The current main branch is being kept release-only; historical public copies cannot be recalled from forks, clones, caches, or previously downloaded archives.

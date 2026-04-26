---
title: "3D Web Engine — Redbrick Studio"
description: "A browser-based 3D engine and creator studio that lets users build, script, and publish 3D games and virtual worlds — no install, no native runtime. Powers the games that ship on redbrick.land."
pubDate: "Jan 15 2026"
heroImage: "/images/projects/redbrick/cover-01.png"
icon: "1"
tags: ["three.js", "wasm", "webgl", "game-engine", "blockly", "multiplayer", "vite"]
---

A browser-based 3D engine and creator studio that lets users build, script, and publish 3D games and virtual worlds — no install, no native runtime. Powers the games that ship on [redbrick.land](https://redbrick.land).

## Context

Redbrick's original engine had grown into legacy code that was hard to extend and slow to iterate on. The team rebuilt it from the ground up on a modern web stack: a Three.js renderer, a WASM physics core, a Blockly-based visual scripting language, and authoritative multiplayer — all running in the browser, all wrapped in a React-based editor UI. Shipped by a team of two without ever taking the existing platform offline.

![Redbrick Studio editor](/images/projects/redbrick/cover-02.png)

## Role

Lead engineer on a 2-person team. Drove the migration end-to-end — renderer, physics integration, editor, scripting, and multiplayer — and owned the architecture and most of the implementation across these layers.

## Stack

- **Rendering & 3D:** Three.js, three-mesh-bvh (fast raycast/collision queries), three-pathfinding (navmesh AI), three-nebula (particles), `postprocessing` pipeline, meshoptimizer
- **Physics:** Ammo.js (Bullet ported to WASM) via enable3d
- **Visual scripting:** Blockly-based block editor ("OOBC") with localized block libraries, plus an Ace-powered code view
- **Multiplayer:** Colyseus client over WebSockets, against an authoritative game server
- **App / editor UI:** React 18, Redux + Immer, TypeScript, styled-components, Ant Design, Tailwind, react-dnd, react-resizable-panels
- **Build & platform:** Vite (migrated from Webpack), JavaScript obfuscation, multi-provider OAuth (Google / Facebook / Kakao / Microsoft MSAL), AWS S3 + CloudFront multi-environment delivery

![Visual scripting and runtime](/images/projects/redbrick/cover-03.png)

## Highlights

**Designed a visual scripting language so non-coders can build full games.** Built on Blockly, with custom block libraries for scenes, input, animation, physics, multiplayer, and ranking — and localized so creators around the world can write game logic in their own language. The block graph compiles down to executable code that runs against the same engine APIs a developer would use.

**Brought desktop-grade physics to the browser.** Integrated Ammo.js (Bullet ported to WASM) with the Three.js scene graph through enable3d, layered three-mesh-bvh for fast collision/raycast queries, and three-pathfinding for navmesh AI — keeping complex, physics-driven scenes interactive at real-time framerates inside a browser tab.

**Built the editor as a real product, not a debug UI.** Multi-panel resizable layout, drag-and-drop asset pipeline, manipulation gizmos, live preview, and a fully reversible undo/redo system on top of an Immer-backed Redux store — designed so first-time creators can ship a game in a single session.

**Authoritative multiplayer wired into the scripting layer.** Real-time rooms and state sync over Colyseus, surfaced to creators as the same kind of blocks they use for single-player logic — a "make this multiplayer" experience instead of a separate networking codebase.

**Migrated 50K+ lines from Webpack to Vite — without a maintenance window.** Reworked the entire build pipeline, upgraded the Three.js rendering pipeline, and replaced the physics engine, all while 10M+ existing users kept building and playing on the live platform. Staged rollouts, content-compatibility shims, and a compressed JSON save format kept user-built games running through the cutover. Build times dropped ~60%, production bundles shrank ~35%, and hot-reload went from ~8s to under 1s.

**Refactored the engine into modular, testable packages.** Broke the monolith into independent packages with clear boundaries so three product teams could ship in parallel against the same codebase instead of stepping on each other. Wrote integration tests covering the scene graph and asset loading paths to lock in the contract between the engine core and the editor.

**Redesigned the new-creator onboarding flow.** Combined session replay analysis with user interviews to find where first-time creators dropped off, then rebuilt the onboarding around what people actually did — lifting 7-day activation by ~25% and Day-30 retention by ~15%.

**Production hardening.** JS obfuscation in the build pipeline to protect creators' published game logic, multi-region delivery via S3 + CloudFront with per-environment CDN invalidation, and multi-provider OAuth (Google / Facebook / Kakao / Microsoft) for a global user base.

![Published worlds and games](/images/projects/redbrick/cover-04.png)

## Impact

- 10M+ user sign-ups on the platform
- 54M+ plays across games built with the engine
- ~60% faster builds, ~35% smaller bundles, hot-reload 8s → <1s post-migration
- ~25% lift in 7-day activation and ~15% lift in Day-30 retention from the onboarding redesign
- Codebase modularized so 3 product teams could ship in parallel

## Links

[redbrick.land](https://redbrick.land) · Source (private repo)

#!/usr/bin/env node
// Gerado pelo onp-spec. Executor portátil; usa somente Node e o CLI nativo.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL("../../../", import.meta.url));
const engine = path.resolve(root, ".agents/skills/onp-spec-driven/scripts/onp-spec.mjs");
const child = spawn(process.execPath, [engine, 'executar', "combat-maneuvers", ...process.argv.slice(2), '--run', "implement_combat_maneuvers_automation-combat-maneuvers-mwijfgwz-f7e5192f"], { cwd: root, stdio: 'inherit', shell: false });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', error => { console.error(error.message); process.exitCode = 2; });
child.on('exit', code => { process.exitCode = code ?? 1; });

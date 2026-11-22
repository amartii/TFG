import '@angular/compiler';
import { HttpClient } from '@angular/common/http';
import { createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { build } from 'esbuild';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { Subject, of } from 'rxjs';

const temp = await mkdtemp(resolve('node_modules/.simulation-test-'));
after(() => rm(temp, { recursive: true, force: true }));
const bundle = await build({
  entryPoints: ['src/app/services/simulation.service.ts'],
  bundle: true, platform: 'node', format: 'esm', packages: 'external', write: false
});
const bundlePath = join(temp, 'service.mjs');
await writeFile(bundlePath, bundle.outputFiles[0].contents);
const { SimulationService } = await import(pathToFileURL(bundlePath).href);
const modelBundle = await build({
  entryPoints: ['src/app/models/simulation.model.ts'],
  bundle: true, platform: 'node', format: 'esm', packages: 'external', write: false
});
const modelPath = join(temp, 'model.mjs');
await writeFile(modelPath, modelBundle.outputFiles[0].contents);
const { RSRP_LEVELS, rsrpInRange } = await import(pathToFileURL(modelPath).href);

const metadata = {
  frequency_ghz: 3.5, tx_power_dbm: 40, antenna_height_m: 30,
  tx_location: { latitude: 40, longitude: -3 },
  simulation_date: '2026-01-01', model: 'Deygout', terrain_data: 'Raster local'
};
const result = id => ({
  id, name: id, createdAt: '2026-01-01', metadata,
  parameters: { area_km: 1, espaciado_grid_m: 50 },
  coveragePoints: [{ lat: 40, lng: -3, rsrp: -80 }]
});
const summary = id => ({ id, name: id, createdAt: null, metadata, valid: true, error: null });
function serviceWith(http) {
  const injector = createEnvironmentInjector([{ provide: HttpClient, useValue: http }]);
  return runInInjectionContext(injector, () => new SimulationService());
}

test('simulación bajo demanda envía una antena y selecciona la cobertura guardada', async () => {
  const request = {
    name: 'Nuevo', frequencyGHz: 3.5, rxHeightM: 1.5, areaKm: 1,
    gridSpacingM: 50, cableLossDb: 2, clutterLossDb: 4,
    transmitters: [{
      latitude: 40, longitude: -3, txHeightM: 30, txPowerDbm: 40, txGainDbi: 15,
      antennaAzimuthDeg: 90, antennaDowntiltDeg: 3
    }]
  };
  let submitted;
  const service = serviceWith({ post: (url, body) => {
    submitted = { url, body };
    return of(result('nuevo'));
  } });
  service.setTransmitterLocation({ latitude: 40, longitude: -3 });
  await service.simulate(request);
  assert.equal(submitted.url, 'http://localhost:8080/api/simulations');
  assert.deepEqual(submitted.body, request);
  assert.equal(service.currentSimulation().simulation_id, 'nuevo');
  assert.deepEqual(service.currentSimulation().coverage_points, [
    { latitude: 40, longitude: -3, rsrp_dbm: -80 }
  ]);
  assert.equal(service.availableSimulations()[0].simulation_id, 'nuevo');
  assert.equal(service.pendingLocation(), null);
});

test('una respuesta histórica tardía no sustituye la selección más reciente', async () => {
  const pending = new Map();
  const service = serviceWith({ get: url => {
    if (url.endsWith('/simulations')) return of([summary('a'), summary('b'), summary('c')]);
    const stream = new Subject();
    pending.set(url.split('/').pop(), stream);
    return stream;
  } });
  const loading = service.loadSimulations();
  await Promise.resolve();
  pending.get('a').next(result('a'));
  await loading;
  service.startTransmitterPlacement();
  service.setTransmitterLocation({ latitude: 41, longitude: -2 });
  const old = service.selectSimulation('b');
  assert.equal(service.pendingLocation(), null);
  assert.equal(service.placingTransmitter(), false);
  const latest = service.selectSimulation('c');
  pending.get('c').next(result('c'));
  await latest;
  pending.get('b').next(result('b'));
  await old;
  assert.equal(service.currentSimulation().simulation_id, 'c');
});

test('el límite superior de RSRP pertenece al nivel excelente', () => {
  const service = serviceWith({});
  assert.equal(service.getRsrpLevel(-40).label, 'Excelente');
  assert.equal(service.getRsrpLevel(-70).label, 'Excelente');
  assert.equal(service.getRsrpLevel(-85).label, 'Buena');
  for (const rsrp of [-140, -100, -85, -70, -40]) {
    assert.equal(RSRP_LEVELS.filter(level => rsrpInRange(rsrp, level.min, level.max)).length, 1);
  }
});

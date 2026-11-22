import '@angular/compiler';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { createEnvironmentInjector, runInInjectionContext, signal } from '@angular/core';
import { build } from 'esbuild';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { Subject, of, throwError } from 'rxjs';

const temp = await mkdtemp(resolve('node_modules/.comparison-test-'));
after(() => rm(temp, { recursive: true, force: true }));
const bundle = await build({
  stdin: {
    contents: `
      export { ComparisonService } from './src/app/services/comparison.service';
      export { SimulationService } from './src/app/services/simulation.service';
      export { CalibrationComponent } from './src/app/components/calibration/calibration.component';
    `,
    resolveDir: process.cwd(),
    loader: 'ts'
  },
  bundle: true, platform: 'node', format: 'esm', packages: 'external', write: false
});
const bundlePath = join(temp, 'components.mjs');
await writeFile(bundlePath, bundle.outputFiles[0].contents);
const { ComparisonService, SimulationService, CalibrationComponent } =
  await import(pathToFileURL(bundlePath).href);

function comparisonWith(http) {
  const injector = createEnvironmentInjector([
    { provide: HttpClient, useValue: http },
    { provide: SimulationService, useValue: {
      currentSimulation: signal(null),
      availableSimulations: signal([]),
      validAvailableSimulations: signal([]),
      currentThreshold: signal(-140),
      cancelTransmitterPlacement() {}
    } }
  ]);
  return runInInjectionContext(injector, () => new ComparisonService());
}

function calibrationWith(http, selected) {
  return Object.assign(Object.create(CalibrationComponent.prototype), {
    http,
    simulationService: { currentSimulation: signal({ simulation_id: 'a' }) },
    calibrations: signal([selected]),
    selected: signal(selected),
    error: signal(null),
    busy: signal(false),
    page: signal(1),
    request: 0,
    importRequest: 0
  });
}

const simulation = id => ({
  id, name: id, createdAt: '2026-01-01',
  metadata: { tx_location: { latitude: 40, longitude: -3 } },
  parameters: { area_km: 1, espaciado_grid_m: 50 },
  coveragePoints: [{ lat: 40, lng: -3, rsrp: -80 }]
});

test('el fallo de B se muestra y se puede reintentar o limpiar', async () => {
  let fails = true;
  const service = comparisonWith({ get: () => fails
    ? throwError(() => new HttpErrorResponse({ status: 404 }))
    : of(simulation('b'))
  });
  await service.selectSimulationB('b');
  assert.equal(service.simulationBId(), 'b');
  assert.match(service.errorB(), /no se pudo cargar/i);
  assert.equal(service.simulationB(), null);
  fails = false;
  await service.selectSimulationB('b');
  assert.equal(service.errorB(), null);
  assert.equal(service.simulationB().simulation_id, 'b');
  service.clearSimulationB();
  assert.equal(service.simulationBId(), null);
  assert.equal(service.errorB(), null);
});

test('un fallo tardío o una respuesta tras limpiar B no cambian la selección', async () => {
  const pending = new Map();
  const service = comparisonWith({ get: url => {
    const stream = new Subject();
    pending.set(url.split('/').pop(), stream);
    return stream;
  } });
  const old = service.selectSimulationB('b');
  const latest = service.selectSimulationB('c');
  pending.get('c').next(simulation('c'));
  await latest;
  pending.get('b').error(new HttpErrorResponse({ status: 500 }));
  await old;
  assert.equal(service.simulationB().simulation_id, 'c');
  assert.equal(service.errorB(), null);
  const cleared = service.selectSimulationB('d');
  service.clearSimulationB();
  pending.get('d').next(simulation('d'));
  await cleared;
  assert.equal(service.simulationB(), null);
  assert.equal(service.simulationBId(), null);
  assert.equal(service.loadingB(), false);
});

test('al actualizar se usa el estado actual de la calibración seleccionada', async () => {
  const old = { id: 'cal', predictionMatches: true, offsetDb: 5 };
  const updated = { ...old, predictionMatches: false };
  let results = [updated];
  const component = calibrationWith({ get: () => of(results) }, old);
  await component.refresh();
  assert.equal(component.selected(), updated);
  assert.equal(component.selected().predictionMatches, false);
  results = [];
  await component.refresh();
  assert.equal(component.selected(), null);
  assert.equal(component.page(), 0);
});

test('una actualización de calibraciones tardía no sustituye la más reciente', async () => {
  const old = { id: 'cal', predictionMatches: true };
  const pending = [];
  const component = calibrationWith({ get: () => {
    const stream = new Subject();
    pending.push(stream);
    return stream;
  } }, old);
  const first = component.refresh();
  const second = component.refresh();
  const updated = { ...old, predictionMatches: false };
  pending[1].next([updated]);
  await second;
  pending[0].next([old]);
  await first;
  assert.equal(component.selected(), updated);
});

test('un fallo de importación de A no muestra su error tras cambiar a B', async () => {
  const pending = new Subject();
  const component = calibrationWith({ post: () => pending }, null);
  const input = { files: [{ text: async () => '{}' }], value: 'observaciones.json' };
  const importing = component.importFile({ target: input });
  await Promise.resolve();
  component.simulationService.currentSimulation.set({ simulation_id: 'b' });
  component.error.set('Error propio de B');
  pending.error(new HttpErrorResponse({ status: 400, error: { detail: 'Error de A' } }));
  await importing;
  assert.equal(component.error(), 'Error propio de B');
});

test('una importación anterior no modifica el error ni el estado de otra más reciente', async () => {
  const pending = [];
  const component = calibrationWith({ post: () => {
    const stream = new Subject();
    pending.push(stream);
    return stream;
  } }, null);
  const input = () => ({ files: [{ text: async () => '{}' }], value: 'observaciones.json' });
  const old = component.importFile({ target: input() });
  await Promise.resolve();
  const latest = component.importFile({ target: input() });
  await Promise.resolve();
  pending[0].error(new HttpErrorResponse({ status: 400, error: { detail: 'Error antiguo' } }));
  await old;
  assert.equal(component.error(), null);
  assert.equal(component.busy(), true);
  pending[1].error(new HttpErrorResponse({ status: 400, error: { detail: 'Error actual' } }));
  await latest;
  assert.equal(component.error(), 'Error actual');
  assert.equal(component.busy(), false);
});

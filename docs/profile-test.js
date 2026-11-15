// Packet layouts taken from the archived vendor qa/lt, Os, js, Lc and io code.
let device, size, busy = false;
const log = document.querySelector('#log');
const buttons = [...document.querySelectorAll('button')];
const say = message => { log.textContent += '\n' + message; };

async function exchange(command, address, count, data, last = false) {
  const packet = new Uint8Array(size);
  packet.set([0xAA, command, count, address & 255, address >> 8, 0, last ? 1 : 0, 0]);
  if (data) packet.set(data, 8);
  let handler, timer;
  const response = new Promise((resolve, reject) => {
    handler = event => {
      const b = new Uint8Array(event.data.buffer, event.data.byteOffset, event.data.byteLength);
      if (b.length < 8 || b[0] !== 0x55 || b[1] !== command ||
          (b[3] | b[4] << 8) !== address) return;
      if ((command === 0x10 || command === 0x16) &&
          (b[2] !== count || b.length < count + 8)) {
        reject(Error('Unexpected response length; stopped.'));
      } else resolve(Array.from(b.slice(8, 8 + count)));
    };
    device.addEventListener('inputreport', handler);
    timer = setTimeout(() => reject(Error(`Command 0x${command.toString(16)} timed out; stopped.`)), 3000);
  });
  try {
    const [, bytes] = await Promise.all([device.sendReport(0, packet), response]);
    return bytes;
  } finally {
    clearTimeout(timer);
    device.removeEventListener('inputreport', handler);
  }
}

async function read(command, length) {
  const result = [];
  for (let address = 0; address < length; address += size - 8) {
    const count = Math.min(size - 8, length - address);
    result.push(...await exchange(command, address, count, null, address + count === length));
  }
  return result;
}

async function info() {
  const data = await read(0x10, 48);
  if (data[30] !== 0) throw Error('Different protocol version. This test supports frame version 0 only.');
  if ((data[4] | data[5] << 8) !== 3141 || (data[6] | data[7] << 8) !== 32971)
    throw Error('Device identity response does not match the wired MK922.');
  const version = ((data[8] & 15) + ((data[8] & 240) >> 4) * 10 + data[9] * 100) / 100;
  if (version !== 1.16) throw Error(`Firmware ${version}: this test was prepared for 1.16. Stop here.`);
  say(`Firmware ${version}; reported onboard slot index: ${data[19]} (zero-based).`);
  return data[19];
}

function key(slot) { return `he68-onboard-test-v1:${device.vendorId}:${device.productId}:slot${slot}`; }
function download(backup) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = `HE68-Fn-backup-slot-${backup.slot}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function writeAndVerify(map) {
  for (let address = 0; address < 512; address += size - 8) {
    const count = Math.min(size - 8, 512 - address);
    await exchange(0x26, address, count, map.slice(address, address + count), address + count === 512);
  }
  const actual = await read(0x16, 512);
  if (actual.some((v, i) => v !== map[i]))
    throw Error('Fn-map readback differs. Write support is unconfirmed; backup is retained. Do not repeat the write.');
}

async function install() {
  const slot = await info();
  const original = await read(0x16, 512);
  let backup;
  const saved = localStorage.getItem(key(slot));
  if (saved) backup = JSON.parse(saved);
  else {
    backup = {device: device.productName, vendorId: 3141, productId: 32971,
      slot, created: new Date().toISOString(), fnMap: original};
    localStorage.setItem(key(slot), JSON.stringify(backup));
  }
  download(backup);
  const modified = [...original];
  // Physical Insert=103 and Delete=106. FUNC encoding: [13, high, middle, low].
  modified.splice(103 * 4, 4, 13, 0, 0, 200); // Profile 1, expected index 0
  modified.splice(106 * 4, 4, 13, 0, 0, 201); // Profile 2, expected index 1
  if (await info() !== slot) throw Error('Active slot changed during preparation. Nothing written.');
  await writeAndVerify(modified);
  say(`Verified shortcuts in reported slot ${slot}: Fn+Insert → Profile 1; Fn+Delete → Profile 2.`);
  say('Now press Fn+Delete, then click Read active slot.');
}

async function restore() {
  const slot = await info();
  const stored = localStorage.getItem(key(slot));
  if (!stored) throw Error(`No test backup for reported slot ${slot}. Nothing written.`);
  const backup = JSON.parse(stored);
  if (backup.slot !== slot || backup.fnMap?.length !== 512 ||
      !backup.fnMap.every(v => Number.isInteger(v) && v >= 0 && v <= 255))
    throw Error('Invalid backup. Nothing written.');
  if (await info() !== slot) throw Error('Active slot changed. Nothing written.');
  await writeAndVerify(backup.fnMap);
  say(`Original Fn map restored and verified for reported slot ${slot}. Backup retained.`);
}

async function connect() {
  const devices = await navigator.hid.requestDevice({filters: [{vendorId: 3141, productId: 32971}]});
  device = devices.find(d => d.collections[0]?.outputReports?.some(r => r.reportId === 0));
  if (!device) throw Error('No compatible vendor HID interface selected.');
  if (!device.opened) await device.open();
  const report = device.collections[0].outputReports.find(r => r.reportId === 0);
  size = report.items[0]?.reportCount;
  if (size !== 64 || report.items[0]?.reportSize !== 8) {
    device = null;
    throw Error('Unexpected report layout. This test requires 64-byte reports.');
  }
  try { await info(); }
  catch (error) { device = null; throw error; }
  say('Connected. No mappings changed yet.');
}

async function run(action) {
  if (busy) return;
  busy = true;
  buttons.forEach(b => b.disabled = true);
  try { await action(); }
  catch (error) { say('ERROR: ' + error.message); }
  finally {
    busy = false;
    buttons.forEach(b => b.disabled = b.id !== 'connect' && !device);
  }
}
document.querySelector('#connect').onclick = () => run(connect);
document.querySelector('#read').onclick = () => run(info);
document.querySelector('#install').onclick = () => run(install);
document.querySelector('#restore').onclick = () => run(restore);

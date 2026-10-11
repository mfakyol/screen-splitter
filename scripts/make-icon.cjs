// Generates a simple 256x256 PNG icon (no external dependencies)
const fs = require('fs')
const zlib = require('zlib')
const path = require('path')

const SIZE = 256
const px = Buffer.alloc(SIZE * SIZE * 4)
const colors = [
  [59, 130, 246],
  [16, 185, 129],
  [245, 158, 11],
  [239, 68, 68]
]
const bg = [15, 23, 42]
const gap = 14
const margin = 24
const half = (SIZE - margin * 2 - gap) / 2

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    let c = bg
    const ix = x - margin
    const iy = y - margin
    if (ix >= 0 && iy >= 0 && ix < SIZE - margin * 2 && iy < SIZE - margin * 2) {
      const col = ix < half ? 0 : ix >= half + gap ? 1 : -1
      const row = iy < half ? 0 : iy >= half + gap ? 1 : -1
      if (col >= 0 && row >= 0) c = colors[row * 2 + col]
    }
    const o = (y * SIZE + x) * 4
    px[o] = c[0]
    px[o + 1] = c[1]
    px[o + 2] = c[2]
    px[o + 3] = 255
  }
}

const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE)
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0
  px.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4)
}

const crcTable = new Int32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  crcTable[n] = c
}
const crc32 = (buf) => {
  let c = -1
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0)
ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // RGBA
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw)),
  chunk('IEND', Buffer.alloc(0))
])
const out = path.join(__dirname, '..', 'resources', 'icon.png')
fs.writeFileSync(out, png)
console.log('icon written:', out)

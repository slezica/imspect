import UPNG from 'upng-js'


const PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
const PNG_COLOR_TYPES = {
  0: 'Grayscale',
  2: 'RGB',
  3: 'Indexed',
  4: 'Grayscale with Alpha',
  6: 'RGBA'
}


export class PNGParser {
  async canParse(file) {
    if (!file.name.toLowerCase().endsWith('.png')) {
      return false
    }

    const header = await this._readFileHeader(file, 8)

    for (let i = 0; i < PNG_SIGNATURE.length; i++) {
      if (header[i] !== PNG_SIGNATURE[i]) {
        return false
      }
    }

    return true
  }

  async parse(file) {
    const arrayBuffer = await file.arrayBuffer()
    const decoded = UPNG.decode(arrayBuffer)

    return {
      format: 'PNG',
      file: {
        name: file.name,
        size: file.size
      },
      dimensions: {
        width: decoded.width,
        height: decoded.height
      },
      color: {
        colorType: PNG_COLOR_TYPES[decoded.ctype] || `Unknown (${decoded.ctype})`,
        bitDepth: decoded.depth
      }
    }
  }

  async _readFileHeader(file, numBytes) {
    const slice = file.slice(0, numBytes)
    const arrayBuffer = await slice.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  }
}

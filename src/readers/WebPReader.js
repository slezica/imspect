import exifr from 'exifr'

const WEBP_SIGNATURE = [0x52, 0x49, 0x46, 0x46] // "RIFF"
const WEBP_FORMAT = [0x57, 0x45, 0x42, 0x50] // "WEBP"

export class WebPReader {
  async canRead(file) {
    const ext = file.name.toLowerCase()
    if (!ext.endsWith('.webp')) {
      return false
    }

    const header = await this._readFileHeader(file, 12)

    // Check RIFF signature
    for (let i = 0; i < WEBP_SIGNATURE.length; i++) {
      if (header[i] !== WEBP_SIGNATURE[i]) {
        return false
      }
    }

    // Check WEBP format
    for (let i = 0; i < WEBP_FORMAT.length; i++) {
      if (header[8 + i] !== WEBP_FORMAT[i]) {
        return false
      }
    }

    return true
  }

  async read(file) {
    const arrayBuffer = await file.arrayBuffer()
    const view = new DataView(arrayBuffer)

    // Parse WebP container
    const webpInfo = this._parseWebPContainer(view)

    // Try to extract EXIF data
    const exifData = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      iptc: true,
      icc: false
    }).catch(() => null)

    const result = {
      format: 'WebP',
      file: {
        name: file.name,
        size: file.size
      },
      dimensions: {
        width: webpInfo.width,
        height: webpInfo.height
      },
      color: {
        colorType: webpInfo.hasAlpha ? 'RGBA' : 'RGB',
        bitDepth: 8
      },
      webp: {
        compressionType: webpInfo.compressionType,
        hasAlpha: webpInfo.hasAlpha,
        isAnimated: webpInfo.isAnimated
      }
    }

    // Extract physical dimensions/DPI if present in EXIF
    if (exifData?.XResolution && exifData?.YResolution && exifData?.ResolutionUnit) {
      const unit = exifData.ResolutionUnit
      if (unit === 'inches' || unit === 2) {
        result.physicalDimensions = {
          pixelsPerUnitX: Math.round(exifData.XResolution * 39.3701),
          pixelsPerUnitY: Math.round(exifData.YResolution * 39.3701),
          unit: 1
        }
      }
    }

    // Extract camera info if present
    if (exifData) {
      const cameraInfo = {}
      const cameraFields = {
        'Make': 'make',
        'Model': 'model',
        'ISO': 'iso',
        'ExposureTime': 'exposureTime',
        'FNumber': 'fNumber',
        'FocalLength': 'focalLength',
        'Flash': 'flash',
        'MeteringMode': 'meteringMode',
        'ExposureProgram': 'exposureProgram',
        'WhiteBalance': 'whiteBalance'
      }

      for (const [exifKey, resultKey] of Object.entries(cameraFields)) {
        if (exifData[exifKey] !== undefined) {
          cameraInfo[resultKey] = exifData[exifKey]
        }
      }

      if (Object.keys(cameraInfo).length > 0) {
        result.cameraInfo = cameraInfo
      }

      // Extract text metadata
      const textMetadata = {}
      const textFields = [
        'Artist', 'Copyright', 'Software',
        'ImageDescription', 'UserComment',
        'DateTime', 'ModifyDate', 'DateTimeOriginal', 'CreateDate'
      ]

      for (const field of textFields) {
        if (exifData[field]) {
          const value = exifData[field]
          textMetadata[field] = (value instanceof Date) ? value.toISOString() : String(value)
        }
      }

      if (Object.keys(textMetadata).length > 0) {
        result.textMetadata = textMetadata
      }
    }

    return result
  }

  _parseWebPContainer(view) {
    const info = {
      width: 0,
      height: 0,
      compressionType: 'Unknown',
      hasAlpha: false,
      isAnimated: false
    }

    let offset = 12 // Skip RIFF header

    while (offset < view.byteLength - 8) {
      // Read chunk FourCC
      const chunkType = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      )
      const chunkSize = view.getUint32(offset + 4, true)

      if (chunkType === 'VP8 ') {
        info.compressionType = 'Lossy'
        // Parse VP8 bitstream for dimensions
        const vp8Offset = offset + 8
        if (vp8Offset + 10 <= view.byteLength) {
          info.width = view.getUint16(vp8Offset + 6, true) & 0x3fff
          info.height = view.getUint16(vp8Offset + 8, true) & 0x3fff
        }
      } else if (chunkType === 'VP8L') {
        info.compressionType = 'Lossless'
        // Parse VP8L bitstream for dimensions
        const vp8lOffset = offset + 8
        if (vp8lOffset + 5 <= view.byteLength) {
          const bits = view.getUint32(vp8lOffset + 1, true)
          info.width = ((bits & 0x3FFF) + 1)
          info.height = (((bits >> 14) & 0x3FFF) + 1)
        }
      } else if (chunkType === 'VP8X') {
        // Extended format with flags
        const flags = view.getUint8(offset + 8)
        info.hasAlpha = !!(flags & 0x10)
        info.isAnimated = !!(flags & 0x02)

        // Dimensions in VP8X
        const w = view.getUint8(offset + 12) | (view.getUint8(offset + 13) << 8) | (view.getUint8(offset + 14) << 16)
        const h = view.getUint8(offset + 15) | (view.getUint8(offset + 16) << 8) | (view.getUint8(offset + 17) << 16)
        info.width = w + 1
        info.height = h + 1
      }

      offset += 8 + chunkSize + (chunkSize % 2) // Chunks are padded to even size
    }

    return info
  }

  async _readFileHeader(file, numBytes) {
    const slice = file.slice(0, numBytes)
    const arrayBuffer = await slice.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  }
}

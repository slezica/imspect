import exifr from 'exifr'

const JPEG_SIGNATURE = [0xFF, 0xD8, 0xFF]

export class JPEGReader {
  async canRead(file) {
    const ext = file.name.toLowerCase()
    if (!ext.endsWith('.jpg') && !ext.endsWith('.jpeg')) {
      return false
    }

    const header = await this._readFileHeader(file, 3)

    for (let i = 0; i < JPEG_SIGNATURE.length; i++) {
      if (header[i] !== JPEG_SIGNATURE[i]) {
        return false
      }
    }

    return true
  }

  async read(file) {
    const exifData = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      iptc: true,
      icc: false
    })

    const arrayBuffer = await file.arrayBuffer()
    const view = new DataView(arrayBuffer)

    // Get image dimensions from JPEG structure
    const dimensions = this._getJPEGDimensions(view)

    const result = {
      format: 'JPEG',
      file: {
        name: file.name,
        size: file.size
      },
      dimensions: {
        width: dimensions.width,
        height: dimensions.height
      },
      color: {
        colorType: 'RGB', // JPEG typically uses YCbCr converted to RGB
        bitDepth: 8 // JPEG always uses 8 bits per channel
      }
    }

    // Extract physical dimensions/DPI if present
    if (exifData?.XResolution && exifData?.YResolution && exifData?.ResolutionUnit) {
      const unit = exifData.ResolutionUnit
      if (unit === 'inches' || unit === 2) {
        result.physicalDimensions = {
          pixelsPerUnitX: Math.round(exifData.XResolution * 39.3701), // Convert DPI to pixels per meter
          pixelsPerUnitY: Math.round(exifData.YResolution * 39.3701),
          unit: 1 // meter
        }
      }
    }

    // Extract camera info
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
      if (exifData?.[exifKey] !== undefined) {
        cameraInfo[resultKey] = exifData[exifKey]
      }
    }

    if (Object.keys(cameraInfo).length > 0) {
      result.cameraInfo = cameraInfo
    }

    // Extract text metadata (non-camera fields)
    const textMetadata = {}
    const textFields = [
      'Artist', 'Copyright', 'Software',
      'ImageDescription', 'UserComment',
      'DateTime', 'ModifyDate', 'DateTimeOriginal', 'CreateDate'
    ]

    for (const field of textFields) {
      if (exifData?.[field]) {
        // Convert dates to readable strings
        const value = exifData[field]
        textMetadata[field] = (value instanceof Date) ? value.toISOString() : String(value)
      }
    }

    if (Object.keys(textMetadata).length > 0) {
      result.textMetadata = textMetadata
    }

    return result
  }

  _getJPEGDimensions(view) {
    let offset = 2 // Skip SOI marker

    while (offset < view.byteLength) {
      if (view.getUint8(offset) !== 0xFF) break

      const marker = view.getUint8(offset + 1)

      // SOF markers contain dimension info
      if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xC7) ||
          (marker >= 0xC9 && marker <= 0xCB) || (marker >= 0xCD && marker <= 0xCF)) {

        const height = view.getUint16(offset + 5)
        const width = view.getUint16(offset + 7)
        return { width, height }
      }

      // Skip to next marker
      const length = view.getUint16(offset + 2)
      offset += 2 + length
    }

    return { width: 0, height: 0 }
  }

  async _readFileHeader(file, numBytes) {
    const slice = file.slice(0, numBytes)
    const arrayBuffer = await slice.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  }
}

import { useState } from 'preact/hooks'


export function MetadataViewer({ data, error, loading }) {
  const [showJSON, setShowJSON] = useState(false)

  if (loading) {
    return (
      <div class="metadata">
        <button class="toggle-json" disabled>Show JSON</button>
        <div class="loading view">
          <h1>Analyzing...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div class="metadata">
        <button class="toggle-json" disabled>Show JSON</button>
        <div class="error view">
          <h1>Error</h1>
          <h2>{error.toString()}</h2>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div class="metadata">
        <button class="toggle-json" disabled>Show JSON</button>
        <div class="placeholder view">
          <h1>Metadata will appear here</h1>
          <h2>when you select a file</h2>
        </div>
      </div>
    )
  }

  return (
    <div class="metadata">
      <button class="toggle-json" onClick={() => setShowJSON(!showJSON)}>
        {showJSON ? 'Hide JSON' : 'Show JSON'}
      </button>

      {showJSON ? (
        <div class="content json view">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      ) : (
        <div class="pretty content view">
          <section>
            <h1>File</h1>
            <dl>
              <dt>Type</dt> <dd>{data.format}</dd>
              <dt>Name</dt> <dd>{data.file.name}</dd>
              <dt>Size</dt> <dd>{formatFileSize(data.file.size)}</dd>
            </dl>
          </section>

          <section>
            <h1>Dimensions</h1>
            <dl>
              <dt>Width</dt> <dd>{data.dimensions.width}px</dd>
              <dt>Height</dt> <dd>{data.dimensions.height}px</dd>
              <dt>Aspect Ratio</dt> <dd>{formatAspectRatio(data.dimensions.width, data.dimensions.height)}</dd>
            </dl>
          </section>

          <section>
            <h1>Color Profile</h1>
            <dl>
              <dt>Color Type</dt> <dd>{data.color.colorType}</dd>
              <dt>Bit Depth</dt> <dd>{data.color.bitDepth} bits</dd>
            </dl>
          </section>

          {data.format === 'PNG' && <PNGExtras data={data} />}
        </div>
      )}
    </div>
  )
}


function PNGExtras({ data }) {
  if (!data.textMetadata) { return null }

  const textMetadata = data.textMetadata
  const entries = Object.entries(textMetadata)

  if (entries.length === 0) { return null }

  const singleLineFields = new Set([
    'Title', 'Author', 'Software', 'Source', 'Copyright', 'Creation Time', 'Create Time', 'Modify Time'
  ])

  const singleLine = []
  const multiLine = []

  for (const [key, value] of entries) {
    const valueEl = (typeof value == 'string')
      ? <p>{value}</p>
      : <pre>{JSON.stringify(value)}</pre>

    if (singleLineFields.has(key)) {
      singleLine.push([key, valueEl])
    } else {
      multiLine.push([key, valueEl])
    }
  }

  return (
    <>
      <PNGCompression data={data} />
      <PNGPhysicalDimensions data={data} />
      <PNGMetadataSingle entries={singleLine} />
      <PNGMetadataMulti entries={multiLine} />
    </>
  )
}

function PNGCompression({ data }) {
  if (!data.compression) return null

  const { compressionMethod, filterMethod, interlaceMethod } = data.compression

  const compressionMethodLabel = compressionMethod === 0 ? 'Deflate' : `Unknown (${compressionMethod})`
  const filterMethodLabel = filterMethod === 0 ? 'Adaptive' : `Unknown (${filterMethod})`
  const interlaceMethodLabel = interlaceMethod === 1 ? 'Adam7' : 'None'

  return (
    <section>
      <h1>Compression</h1>
      <dl>
        <dt>Compression Method</dt> <dd>{compressionMethodLabel}</dd>
        <dt>Filter Method</dt> <dd>{filterMethodLabel}</dd>
        <dt>Interlace Method</dt> <dd>{interlaceMethodLabel}</dd>
      </dl>
    </section>
  )
}

function PNGPhysicalDimensions({ data }) {
  if (!data.physicalDimensions) return null

  const { pixelsPerUnitX, pixelsPerUnitY, unit } = data.physicalDimensions

  // Unit: 0 = unknown, 1 = meter
  if (unit === 0) {
    return (
      <section>
        <h1>Physical Dimensions</h1>
        <dl>
          <dt>Pixels Per Unit (X)</dt> <dd>{pixelsPerUnitX}</dd>
          <dt>Pixels Per Unit (Y)</dt> <dd>{pixelsPerUnitY}</dd>
          <dt>Unit</dt> <dd>Unknown</dd>
        </dl>
      </section>
    )
  }

  // Convert pixels per meter to DPI (dots per inch)
  const dpiX = Math.round(pixelsPerUnitX * 0.0254)
  const dpiY = Math.round(pixelsPerUnitY * 0.0254)

  return (
    <section>
      <h1>Physical Dimensions</h1>
      <dl>
        <dt>DPI (X)</dt> <dd>{dpiX}</dd>
        <dt>DPI (Y)</dt> <dd>{dpiY}</dd>
        <dt>Pixels Per Meter (X)</dt> <dd>{pixelsPerUnitX}</dd>
        <dt>Pixels Per Meter (Y)</dt> <dd>{pixelsPerUnitY}</dd>
      </dl>
    </section>
  )
}

function PNGMetadataSingle({ entries }) {
  if (entries.length === 0) return null

  return (
    <section>
      <h1>Text Metadata</h1>
      <dl>
        {entries.map(([key, value]) => (
          <span key={key}>
            <dt>{key}</dt> <dd>{value}</dd>
          </span>
        ))}
      </dl>
    </section>
  )
}

function PNGMetadataMulti({ entries }) {
  if (entries.length === 0) return null

  return (
    <section>
      <h1>Text Metadata</h1>
      {entries.map(([key, value]) => (
        <div key={key} class="multiline">
          <h2>{key}</h2>
          {value}
        </div>
      ))}
    </section>
  )
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatAspectRatio(width, height) {
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b)
  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}


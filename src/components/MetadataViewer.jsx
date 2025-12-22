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
        </div>
      )}
    </div>
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


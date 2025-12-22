import { useState, useEffect } from 'preact/hooks'
import { FileInput } from './FileInput'
import { MetadataViewer } from './MetadataViewer'
import { ImageReader } from '../readers/ImageReader'
import { PNGReader } from '../readers/PNGReader'
import { JPEGReader } from '../readers/JPEGReader'
import { WebPReader } from '../readers/WebPReader'

const reader = new ImageReader([
  new PNGReader(),
  new JPEGReader(),
  new WebPReader()
])

export function App() {
  const [imageUrl, setImageUrl] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Clean up object URL when it changes or component unmounts
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  const handleFileSelected = async (file) => {
    if (!file) return

    setLoading(true)
    setError(null)

    // Create new preview URL
    const newImageUrl = URL.createObjectURL(file)

    // Read metadata
    try {
      const data = await reader.read(file)
      setMetadata(data)
      setLoading(false)
      setImageUrl(newImageUrl)

    } catch (err) {
      setError(err)
      setLoading(false)
    }
  }

  return (
    <div class="container">
      <div class="left-panel">
        <FileInput
          imageUrl={imageUrl}
          onFileSelected={handleFileSelected}
        />
      </div>

      <div class="right-panel">
        <MetadataViewer
          data={metadata}
          error={error}
          loading={loading}
        />
      </div>
    </div>
  )
}

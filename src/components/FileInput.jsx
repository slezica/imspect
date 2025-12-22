import { useRef, useState } from 'preact/hooks'


export function FileInput({ imageUrl, onFileSelected }) {
  const fileInputRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) onFileSelected(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFileSelected(files[0])
    }
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  return (
    <div
      class={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
      />
      <div class={`placeholder ${imageUrl ? 'hidden' : ''}`}>
        <h1>Drop an image here</h1>
        <h2>or click to select</h2>
      </div>
      <img
        class={imageUrl ? '' : 'hidden'}
        src={imageUrl}
        alt="Preview"
      />
    </div>
  )
}

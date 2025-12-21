import { ImageInspector } from './ImageInspector.js'
import { PNGParser } from './parsers/PNGParser.js'
import { MetadataRenderer } from './MetadataRenderer.js'


const inspector = new ImageInspector([
  new PNGParser()
])


const $dropZone = document.getElementById('dropZone')
const $fileInput = document.getElementById('fileInput')
const $preview = document.getElementById('preview')
const $placeholder = document.getElementById('placeholder')
const $metadata = document.getElementById('metadata')


let currentObjectURL = null
const metadataCtl = new MetadataRenderer($metadata)


async function handleFile(file) {
  if (!file) return

  metadataCtl.setState({ loading: true })

  // Clean up previous object URL:
  if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL)
  }

  // Show preview immediately:
  currentObjectURL = URL.createObjectURL(file)
  $preview.src = currentObjectURL
  $preview.classList.remove('hidden')
  $placeholder.classList.add('hidden')

  // Analyze the image:
  try {
    const data = await inspector.inspect(file)
    metadataCtl.setState({ data })

  } catch (error) {
    metadataCtl.setState({ error })
  }
}


$fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0]
  handleFile(file)
})

$dropZone.addEventListener('click', () => {
  $fileInput.click()
})

$dropZone.addEventListener('dragenter', (e) => {
  e.preventDefault()
  $dropZone.classList.add('drag-over')
})

$dropZone.addEventListener('dragover', (e) => {
  e.preventDefault()
  $dropZone.classList.add('drag-over')
})

$dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault()
  $dropZone.classList.remove('drag-over')
})

$dropZone.addEventListener('drop', (e) => {
  e.preventDefault()
  $dropZone.classList.remove('drag-over')

  const files = e.dataTransfer.files
  if (files.length > 0) {
    handleFile(files[0])
  }
})


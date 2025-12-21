import { ImageInspector } from './ImageInspector.js'
import { PNGParser } from './parsers/PNGParser.js'


const inspector = new ImageInspector([
  new PNGParser()
])


const dropZone = document.getElementById('dropZone')
const fileInput = document.getElementById('fileInput')
const previewContainer = document.getElementById('previewContainer')
const metadataDisplay = document.getElementById('metadataDisplay')

let currentObjectURL = null


async function handleFile(file) {
  if (!file) return

  // Clean up previous object URL:
  if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL)
  }

  // Show preview immediately:
  currentObjectURL = URL.createObjectURL(file)
  previewContainer.innerHTML = `<img src="${currentObjectURL}" alt="Preview">`

  // Analyze the image:
  metadataDisplay.classList.remove('error')
  metadataDisplay.textContent = 'Analyzing...'

  try {
    const metadata = await inspector.analyze(file)
    metadataDisplay.textContent = JSON.stringify(metadata, null, 2)

  } catch (error) {
    metadataDisplay.classList.add('error')
    metadataDisplay.textContent = `Error: ${error.message}`
  }
}


fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0]
  handleFile(file)
})

dropZone.addEventListener('click', () => {
  fileInput.click()
})

dropZone.addEventListener('dragenter', (e) => {
  e.preventDefault()
  dropZone.classList.add('drag-over')
})

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault()
  dropZone.classList.add('drag-over')
})

dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault()
  dropZone.classList.remove('drag-over')
})

dropZone.addEventListener('drop', (e) => {
  e.preventDefault()
  dropZone.classList.remove('drag-over')

  const files = e.dataTransfer.files
  if (files.length > 0) {
    handleFile(files[0])
  }
})

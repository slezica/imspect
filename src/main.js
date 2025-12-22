import { ImageReader } from './readers/ImageReader.js'
import { PNGReader } from './readers/PNGReader.js'
import { MetadataController } from './controllers/MetadataController.js'
import { FileInputController } from './controllers/FileInputController.js'


const reader = new ImageReader([
  new PNGReader()
])


const $dropZone = document.getElementById('dropZone')
const $metadata = document.getElementById('metadata')


let currentObjectURL = null
const metadataCtl = new MetadataController($metadata)
const fileInputCtl = new FileInputController($dropZone, handleFile)


async function handleFile(file) {
  if (!file) return

  metadataCtl.setState({ loading: true })

  // Clean up previous object URL:
  if (currentObjectURL) {
    URL.revokeObjectURL(currentObjectURL)
  }

  // Show preview immediately:
  currentObjectURL = URL.createObjectURL(file)
  fileInputCtl.setState({ imageUrl: currentObjectURL })

  // Analyze the image:
  try {
    const data = await reader.read(file)
    metadataCtl.setState({ data })

  } catch (error) {
    metadataCtl.setState({ error })
  }
}


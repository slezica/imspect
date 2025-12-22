import { ImageInspector } from './ImageInspector.js'
import { PNGParser } from './parsers/PNGParser.js'
import { MetadataController } from './controllers/MetadataController.js'
import { FileInputController } from './controllers/FileInputController.js'


const inspector = new ImageInspector([
  new PNGParser()
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
    const data = await inspector.inspect(file)
    metadataCtl.setState({ data })

  } catch (error) {
    metadataCtl.setState({ error })
  }
}


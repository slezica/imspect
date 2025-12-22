
export class ImageReader {
  constructor(readers) {
    this.readers = readers
  }

  async read(file) {
    // Find the first reader that can handle this file
    for (const reader of this.readers) {
      if (await reader.canRead(file)) {
        return await reader.read(file)
      }
    }

    // No reader found
    throw new Error(`Unsupported file format: ${file.name}`)
  }
}

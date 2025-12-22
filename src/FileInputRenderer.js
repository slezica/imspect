export class FileInputRenderer {
  constructor($container, onFileSelected) {
    this.$container = $container
    this.onFileSelected = onFileSelected

    this.state = {
      imageUrl: null
    }

    // Elements:
    this.$fileInput = $container.querySelector('#fileInput')
    this.$preview = $container.querySelector('#preview')
    this.$placeholder = $container.querySelector('#placeholder')

    // Set up event listeners:
    this.$fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file) this.onFileSelected(file)
    })

    this.$container.addEventListener('click', () => {
      this.$fileInput.click()
    })

    this.$container.addEventListener('dragenter', (e) => {
      e.preventDefault()
      this.$container.classList.add('drag-over')
    })

    this.$container.addEventListener('dragover', (e) => {
      e.preventDefault()
      this.$container.classList.add('drag-over')
    })

    this.$container.addEventListener('dragleave', (e) => {
      e.preventDefault()
      this.$container.classList.remove('drag-over')
    })

    this.$container.addEventListener('drop', (e) => {
      e.preventDefault()
      this.$container.classList.remove('drag-over')

      const files = e.dataTransfer.files
      if (files.length > 0) {
        this.onFileSelected(files[0])
      }
    })

    this._render()
  }

  setState(newState) {
    this.state = { imageUrl: null, ...newState }
    this._render()
  }

  _render() {
    if (this.state.imageUrl) {
      this.$preview.src = this.state.imageUrl
      this.$preview.classList.remove('hidden')
      this.$placeholder.classList.add('hidden')
    } else {
      this.$preview.classList.add('hidden')
      this.$placeholder.classList.remove('hidden')
    }
  }
}

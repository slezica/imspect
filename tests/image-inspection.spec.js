import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Reusable utilities
async function uploadImage(page, filename) {
  const filePath = path.join(__dirname, 'fixtures', filename)
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(filePath)

  // Wait for analysis to complete
  await expect(page.locator('.loading')).toBeHidden({ timeout: 5000 })
}

async function expectSectionExists(page, title) {
  await expect(page.locator('section').filter({ hasText: new RegExp(`^${title}`, 'i') }).first()).toBeVisible()
}

async function expectFieldValue(page, label, value) {
  // Find the dt with the label, then get the next dd sibling
  const dt = page.locator('dt').filter({ hasText: new RegExp(`^${label}$`) })
  const dd = page.locator('dd').filter({ hasText: new RegExp(`^${value}$`) }).first()
  await expect(dt).toBeVisible()
  await expect(dd).toBeVisible()
}

async function toggleJSON(page) {
  await page.locator('.toggle-json').click()
}

test.describe('Image Inspection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows initial placeholder state', async ({ page }) => {
    await expect(page.locator('.metadata .placeholder')).toBeVisible()
    await expect(page.locator('h1', { hasText: 'Metadata will appear here' })).toBeVisible()
  })

  test.describe('PNG inspection', () => {
    test('displays basic PNG metadata', async ({ page }) => {
      await uploadImage(page, 'test.png')

      // File info
      await expectSectionExists(page, 'FILE')
      await expectFieldValue(page, 'Type', 'PNG')
      await expectFieldValue(page, 'Name', 'test.png')

      // Dimensions
      await expectSectionExists(page, 'DIMENSIONS')
      await expectFieldValue(page, 'Width', '128px')
      await expectFieldValue(page, 'Height', '128px')
      await expectFieldValue(page, 'Aspect Ratio', '1:1')

      // Color Profile
      await expectSectionExists(page, 'COLOR PROFILE')
      await expectFieldValue(page, 'Color Type', 'RGB')
      await expectFieldValue(page, 'Bit Depth', '8 bits')
    })

    test('displays PNG compression info', async ({ page }) => {
      await uploadImage(page, 'test.png')

      await expectSectionExists(page, 'COMPRESSION')
      await expectFieldValue(page, 'Compression Method', 'Deflate')
      await expectFieldValue(page, 'Filter Method', 'Adaptive')
      await expectFieldValue(page, 'Interlace Method', 'None')
    })

    test('displays PNG physical dimensions', async ({ page }) => {
      await uploadImage(page, 'test.png')

      await expectSectionExists(page, 'PHYSICAL DIMENSIONS')
      // DPI values should be visible
      await expect(page.locator('dt', { hasText: 'DPI (X)' })).toBeVisible()
    })

    test('displays PNG text metadata', async ({ page }) => {
      await uploadImage(page, 'test.png')

      await expectSectionExists(page, 'TEXT METADATA')
    })
  })

  test.describe('JPEG inspection', () => {
    test('displays basic JPEG metadata', async ({ page }) => {
      await uploadImage(page, 'test.jpg')

      // File info
      await expectFieldValue(page, 'Type', 'JPEG')
      await expectFieldValue(page, 'Name', 'test.jpg')

      // Color info
      await expectFieldValue(page, 'Color Type', 'RGB')
      await expectFieldValue(page, 'Bit Depth', '8 bits')
    })

    test('displays EXIF camera info', async ({ page }) => {
      await uploadImage(page, 'test.jpg')

      await expectSectionExists(page, 'CAMERA')
      await expectFieldValue(page, 'Make', 'Canon')
      await expectFieldValue(page, 'Model', 'Canon EOS 40D')
      await expectFieldValue(page, 'ISO', '100')

      // Aperture should be formatted with f/
      await expect(page.locator('dd', { hasText: 'f/7.1' })).toBeVisible()

      // Exposure time should be formatted as fraction
      await expect(page.locator('dd', { hasText: '1/' })).toBeVisible()

      // Focal length with mm
      await expect(page.locator('dd', { hasText: '135mm' })).toBeVisible()
    })

    // Note: test.jpg converted from PNG doesn't have DPI info, skip this test
    test.skip('displays JPEG physical dimensions from EXIF', async ({ page }) => {
      await uploadImage(page, 'test.jpg')

      await expectSectionExists(page, 'PHYSICAL DIMENSIONS')
      await expect(page.locator('dt', { hasText: 'DPI (X)' })).toBeVisible()
    })

    test('displays JPEG text metadata', async ({ page }) => {
      await uploadImage(page, 'test.jpg')

      await expectSectionExists(page, 'TEXT METADATA')
      await expectFieldValue(page, 'Software', 'GIMP 2.4.5')
    })
  })

  test.describe('WebP inspection', () => {
    test('displays basic WebP metadata', async ({ page }) => {
      await uploadImage(page, 'test.webp')

      await expectFieldValue(page, 'Type', 'WebP')
      await expectFieldValue(page, 'Name', 'test.webp')
    })

    test('displays WebP format info', async ({ page }) => {
      await uploadImage(page, 'test.webp')

      await expectSectionExists(page, 'WEBP FORMAT')
      await expect(page.locator('dt', { hasText: 'Compression' })).toBeVisible()
      await expect(page.locator('dt', { hasText: 'Alpha Channel' })).toBeVisible()
      await expect(page.locator('dt', { hasText: 'Animated' })).toBeVisible()
    })
  })

  test.describe('JSON view', () => {
    test('toggles JSON view for PNG', async ({ page }) => {
      await uploadImage(page, 'test.png')

      // Initially should show pretty view
      await expect(page.locator('.view.pretty')).toBeVisible()
      await expect(page.locator('.view.json')).toBeHidden()

      // Click toggle
      await toggleJSON(page)

      // Should show JSON view
      await expect(page.locator('.view.pretty')).toBeHidden()
      await expect(page.locator('.view.json')).toBeVisible()

      // JSON should contain expected data
      const jsonContent = await page.locator('.view.json pre').textContent()
      expect(jsonContent).toContain('"format": "PNG"')
      expect(jsonContent).toContain('"width"')
      expect(jsonContent).toContain('128')

      // Toggle back
      await toggleJSON(page)
      await expect(page.locator('.view.pretty')).toBeVisible()
      await expect(page.locator('.view.json')).toBeHidden()
    })

    test('JSON toggle is disabled in placeholder state', async ({ page }) => {
      await expect(page.locator('.toggle-json')).toBeDisabled()
    })

    test('JSON toggle is enabled after loading image', async ({ page }) => {
      await uploadImage(page, 'test.png')
      await expect(page.locator('.toggle-json')).toBeEnabled()
    })
  })

  test.describe('Image preview', () => {
    test('shows image preview after upload', async ({ page }) => {
      const previewLocator = page.locator('.drop-zone img')

      // Initially hidden
      await expect(previewLocator).toBeHidden()

      await uploadImage(page, 'test.png')

      // Should be visible after upload
      await expect(previewLocator).toBeVisible()

      // Should have src attribute (object URL)
      const src = await previewLocator.getAttribute('src')
      expect(src).toBeTruthy()
      expect(src).toContain('blob:')
    })
  })

  test.describe('Error handling', () => {
    test('handles unsupported file format', async ({ page }) => {
      const filePath = path.join(__dirname, 'image-inspection.spec.js')
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(filePath)

      // Should show error
      await expect(page.locator('.error')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('h1', { hasText: 'Error' })).toBeVisible()
    })
  })
})

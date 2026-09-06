import { expect, test } from '@playwright/test'

const shopA = {
  id: 'shop-a',
  name: 'Shop A',
  address: 'A Street',
  city: 'Bengaluru',
  latitude: 12.98,
  longitude: 77.6,
  bwPrice: 2,
  colorPrice: 5,
  availability: 'available',
  ratingAverage: null,
  ratingCount: 0,
  distance: 0,
}

const shopB = { ...shopA, id: 'shop-b', name: 'Shop B', latitude: 13.0827, longitude: 80.2707 }

const responseFor = (shops, radius = 5, mode = 'nearby') => ({
  status: 'success',
  count: shops.length,
  mode,
  ...(mode === 'nearby' ? { radius } : {}),
  shops,
})

const mockPlaces = async (page, places = []) => {
  await page.route('https://nominatim.openstreetmap.org/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(places),
  }))
}

const mockNearbyApi = async (page, handler) => {
  await page.route('**/api/shops/nearby*', (route) => handler(route))
}

const query = (route) => new URL(route.request().url()).searchParams

const waitForNearbyResult = async (page, name) => {
  await expect(page.getByRole('heading', { name: /result found|results found/ })).toBeVisible()
  await expect(page.getByRole('heading', { name })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await mockPlaces(page)
})

test('nearby initial load waits for valid location and shows a registered shop', async ({ page }) => {
  const requests = []
  page.on('request', (request) => {
    if (request.url().includes('/api/shops/nearby')) requests.push(request.url())
  })

  await page.goto('/shops')
  await expect(page.getByText('Location permission needed')).toBeVisible()
  expect(requests).toHaveLength(0)

  await page.getByRole('button', { name: 'Find shops near me' }).click()
  await expect(page.getByText('Location ready')).toBeVisible()
  await expect.poll(() => requests.length).toBeGreaterThan(0)
  expect(new URL(requests[0]).searchParams.get('latitude')).toBe('12.98')
  expect(new URL(requests[0]).searchParams.get('longitude')).toBe('77.6')
  await expect(page.getByRole('heading', { name: 'QuickPrint Hub Updated' })).toBeVisible()
})

test('refresh shows location loading, then searches again with valid results', async ({ page }) => {
  const requests = []
  page.on('request', (request) => {
    if (request.url().includes('/api/shops/nearby')) requests.push(request.url())
  })
  await mockNearbyApi(page, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150))
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseFor([shopA])) })
  })

  await page.goto('/shops')
  await page.getByRole('button', { name: 'Find shops near me' }).click()
  await expect(page.getByRole('heading', { name: 'Shop A' })).toBeVisible()
  await page.evaluate(() => {
    const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation)
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (success, error, options) => setTimeout(() => originalGetCurrentPosition(success, error, options), 300),
      },
    })
  })
  await page.getByRole('button', { name: 'Refresh location' }).click()
  await expect(page.getByText('Getting your location...')).toBeVisible()
  await expect(page.getByText('0 results found')).toHaveCount(0)
  await expect(page.getByText('Location ready')).toBeVisible()
  await expect.poll(() => requests.length).toBe(2)
  await expect(page.getByRole('heading', { name: 'Shop A' })).toBeVisible()
})

test('location failure shows an error and makes no nearby request', async ({ page }) => {
  const requests = []
  page.on('request', (request) => {
    if (request.url().includes('/api/shops/nearby')) requests.push(request.url())
  })
  await page.goto('/shops')
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: (_success, error) => error({ code: 2 }) },
    })
  })
  await page.getByRole('button', { name: 'Find shops near me' }).click()
  await expect(page.getByText('Unable to get your location. Please check GPS/location settings and try again.')).toBeVisible()
  await expect(page.getByText('0 results found')).toHaveCount(0)
  expect(requests).toHaveLength(0)
})

test('refresh discards stale coordinates before the new nearby search', async ({ page, context }) => {
  const requests = []
  await mockNearbyApi(page, async (route) => {
    requests.push(query(route))
    const latitude = query(route).get('latitude')
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseFor(latitude === '12.98' ? [shopA] : [shopB])) })
  })
  await page.goto('/shops')
  await page.getByRole('button', { name: 'Find shops near me' }).click()
  await expect(page.getByRole('heading', { name: 'Shop A' })).toBeVisible()
  await context.setGeolocation({ latitude: 13.0827, longitude: 80.2707 })
  await page.getByRole('button', { name: 'Refresh location' }).click()
  await expect(page.getByRole('heading', { name: 'Shop B' })).toBeVisible()
  expect(requests.at(-1).get('latitude')).toBe('13.0827')
  expect(requests.at(-1).get('longitude')).toBe('80.2707')
  expect(await page.getByRole('heading', { name: 'Shop A' }).count()).toBe(0)
})

test('a delayed old response cannot overwrite the latest location result', async ({ page, context }) => {
  let requestCount = 0
  await mockNearbyApi(page, async (route) => {
    requestCount += 1
    if (requestCount === 1) {
      await new Promise((resolve) => setTimeout(resolve, 700))
      try {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseFor([shopA])) })
      } catch {
        return
      }
      return
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseFor([shopB])) })
  })
  await page.goto('/shops')
  await page.getByRole('button', { name: 'Find shops near me' }).click()
  await expect.poll(() => requestCount).toBe(1)
  await context.setGeolocation({ latitude: 13.0827, longitude: 80.2707 })
  await page.getByRole('button', { name: 'Refresh location' }).click()
  await expect(page.getByRole('heading', { name: 'Shop B' })).toBeVisible()
  await page.waitForTimeout(800)
  await expect(page.getByRole('heading', { name: 'Shop B' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Shop A' })).toHaveCount(0)
})

test('radius change searches with latest coordinates and only then shows zero results', async ({ page }) => {
  const requests = []
  await mockNearbyApi(page, async (route) => {
    requests.push(query(route))
    await new Promise((resolve) => setTimeout(resolve, 150))
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseFor([], Number(query(route).get('radius')))) })
  })
  await page.goto('/shops')
  await page.getByRole('button', { name: 'Find shops near me' }).click()
  await expect(page.getByText('Searching nearby shops...')).toBeVisible()
  await expect(page.getByText('No nearby print shops were found within 5 km. Try a wider radius.')).toBeVisible()
  await page.getByLabel('Search radius').selectOption('10')
  await expect(page.getByText('Searching nearby shops...')).toBeVisible()
  await expect.poll(() => requests.length).toBe(2)
  expect(requests.at(-1).get('radius')).toBe('10')
  expect(requests.at(-1).get('latitude')).toBe('12.98')
  await expect(page.getByText('No nearby print shops were found within 10 km. Try a wider radius.')).toBeVisible()
})

test('nearby API failure shows an API error instead of zero results', async ({ page }) => {
  await mockNearbyApi(page, (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Service unavailable' }),
  }))
  await page.goto('/shops')
  await page.getByRole('button', { name: 'Find shops near me' }).click()
  await expect(page.getByText('Unable to load nearby shops. Please try again.')).toBeVisible()
  await expect(page.getByText('0 results found')).toHaveCount(0)
})

test('All Shops loads approved shops without requesting geolocation', async ({ page }) => {
  await page.goto('/shops')
  await page.evaluate(() => {
    window.__geolocationCalls = 0
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: () => { window.__geolocationCalls += 1 } },
    })
  })
  await page.getByLabel('Search radius').selectOption('all')
  await waitForNearbyResult(page, 'QuickPrint Hub Updated')
  await expect(page.getByText('All approved registered shops')).toBeVisible()
  expect(await page.evaluate(() => window.__geolocationCalls)).toBe(0)
})

test('valid coordinates with no approved shop show zero results after a successful response', async ({ page }) => {
  let responseCompleted = false
  await mockNearbyApi(page, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseFor([])) })
    responseCompleted = true
  })
  await page.goto('/shops')
  await page.getByRole('button', { name: 'Find shops near me' }).click()
  await expect.poll(() => responseCompleted).toBe(true)
  await expect(page.getByText('No nearby print shops were found within 5 km. Try a wider radius.')).toBeVisible()
})
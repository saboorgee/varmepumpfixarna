/**
 * Idempotent seed for Värmepumpfixarna.
 *
 *   docker compose run --rm backend seed
 *
 * Creates only what is missing (looked up by name / handle), so it can be run
 * repeatedly. It never deletes or overwrites existing products.
 *
 * Sets up: SEK store currency, region "Sverige" (tax-inclusive prices, 25 % moms,
 * manual test payment), stock location + fulfilment for Sweden, a flat-rate
 * shipping option, the "Webbutik" sales channel + publishable API key, and
 * three fictional heat pumps with stock.
 */
import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

const CURRENCY = "sek"
const COUNTRY = "se"
const STORE_NAME = "Värmepumpfixarna"
const SALES_CHANNEL_NAME = "Webbutik"
const REGION_NAME = "Sverige"
const STOCK_LOCATION_NAME = "Lager Göteborg"
const FULFILLMENT_SET_NAME = "Lager Göteborg – leverans"
const SERVICE_ZONE_NAME = "Sverige"
const SHIPPING_OPTION_NAME = "Standardfrakt"
const API_KEY_TITLE = "Webbutik"
const MANUAL_PAYMENT_PROVIDER = "pp_system_default"
const MANUAL_FULFILLMENT_PROVIDER = "manual_manual"

type SeedProduct = {
  title: string
  handle: string
  subtitle: string
  description: string
  sku: string
  /** Price in SEK including 25 % moms (major units). */
  price: number
  color: string
}

// Fictional products – names, models and specs are invented.
const PRODUCTS: SeedProduct[] = [
  {
    title: "Nordvind Luft/luft 3,5 kW",
    handle: "nordvind-luft-luft-3-5-kw",
    subtitle: "Luft/luft-värmepump för villa och fritidshus",
    description:
      "Tyst och energisnål luft/luft-värmepump för upp till 120 m². Klarar drift ned till −25 °C och kan styras via app. Fiktiv produkt för testmiljö.",
    sku: "NV-LL-35",
    price: 18995,
    color: "#2563eb",
  },
  {
    title: "Fjällvärme Luft/vatten 8 kW",
    handle: "fjallvarme-luft-vatten-8-kw",
    subtitle: "Luft/vatten-värmepump för vattenburen värme",
    description:
      "Luft/vatten-värmepump som värmer både hus och tappvarmvatten. Passar hus med radiatorer eller golvvärme upp till 180 m². Fiktiv produkt för testmiljö.",
    sku: "FV-LV-8",
    price: 64900,
    color: "#059669",
  },
  {
    title: "Bergkraft Bergvärme 10 kW",
    handle: "bergkraft-bergvarme-10-kw",
    subtitle: "Bergvärmepump med inbyggd varmvattenberedare",
    description:
      "Bergvärmepump med 180 liters varmvattenberedare och varvtalsstyrd kompressor. För hus upp till 250 m². Borrhål ingår ej. Fiktiv produkt för testmiljö.",
    sku: "BK-BV-10",
    price: 109900,
    color: "#b45309",
  },
]

function placeholderSvg(title: string, color: string): string {
  const safe = title.replace(/[<>&"]/g, "")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#f1f5f9"/>
  <rect x="220" y="150" width="360" height="260" rx="24" fill="${color}"/>
  <g fill="none" stroke="#ffffff" stroke-width="10" opacity="0.9">
    <circle cx="400" cy="280" r="80"/>
    <path d="M400 200v160M320 280h160M343 223l114 114M457 223L343 337"/>
  </g>
  <text x="400" y="480" font-family="Arial, Helvetica, sans-serif" font-size="34" text-anchor="middle" fill="#0f172a">${safe}</text>
  <text x="400" y="525" font-family="Arial, Helvetica, sans-serif" font-size="22" text-anchor="middle" fill="#475569">Fiktiv produktbild</text>
</svg>`
}

export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const storeService = container.resolve(Modules.STORE)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const regionService = container.resolve(Modules.REGION)
  const taxService = container.resolve(Modules.TAX)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)
  const productService = container.resolve(Modules.PRODUCT)
  const inventoryService = container.resolve(Modules.INVENTORY)
  const fileService = container.resolve(Modules.FILE)
  const pricingService = container.resolve(Modules.PRICING)

  const created: string[] = []

  // --- Store & sales channel -------------------------------------------------
  const [store] = await storeService.listStores()
  if (!store) {
    throw new Error("No store found – run `medusa db:migrate` first.")
  }

  let [salesChannel] = await salesChannelService.listSalesChannels({
    name: SALES_CHANNEL_NAME,
  })
  if (!salesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: SALES_CHANNEL_NAME, description: "Svensk webbutik" }] },
    })
    salesChannel = result[0]
    created.push(`sales channel "${SALES_CHANNEL_NAME}"`)
  }

  const storeCurrencies = await storeService.retrieveStore(store.id, {
    relations: ["supported_currencies"],
  })
  const hasSekDefault = storeCurrencies.supported_currencies?.some(
    (c) => c.currency_code === CURRENCY && c.is_default
  )
  // Product prices are per currency, so tax-inclusiveness must be set on the
  // SEK currency price preference (the region preference only covers
  // region-scoped prices such as the shipping option's).
  const [sekPreference] = await pricingService.listPricePreferences({
    attribute: "currency_code",
    value: CURRENCY,
  })
  if (!hasSekDefault || !sekPreference?.is_tax_inclusive) {
    // Keep existing currencies, make SEK the (tax-inclusive) default.
    const others = (storeCurrencies.supported_currencies ?? [])
      .filter((c) => c.currency_code !== CURRENCY)
      .map((c) => ({ currency_code: c.currency_code, is_default: false }))
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: {
          supported_currencies: [
            { currency_code: CURRENCY, is_default: true, is_tax_inclusive: true },
            ...others,
          ],
        },
      },
    })
    created.push("SEK as default, tax-inclusive store currency")
  }

  // --- Region & tax ----------------------------------------------------------
  let [region] = await regionService.listRegions({ name: REGION_NAME })
  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: REGION_NAME,
            currency_code: CURRENCY,
            countries: [COUNTRY],
            payment_providers: [MANUAL_PAYMENT_PROVIDER],
            automatic_taxes: true,
            // Swedish consumer prices are quoted including VAT (moms).
            is_tax_inclusive: true,
          },
        ],
      },
    })
    region = result[0]
    created.push(`region "${REGION_NAME}"`)
  }

  const taxRegions = await taxService.listTaxRegions({ country_code: COUNTRY })
  if (!taxRegions.length) {
    await createTaxRegionsWorkflow(container).run({
      input: [
        {
          country_code: COUNTRY,
          provider_id: "tp_system",
          default_tax_rate: { name: "Moms", code: "MOMS25", rate: 25 },
        },
      ],
    })
    created.push("tax region SE (25 % moms)")
  }

  // --- Stock location & fulfilment ------------------------------------------
  let [stockLocation] = await stockLocationService.listStockLocations({
    name: STOCK_LOCATION_NAME,
  })
  if (!stockLocation) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: STOCK_LOCATION_NAME,
            address: { address_1: "Lagergatan 1", city: "Göteborg", postal_code: "41101", country_code: "SE" },
          },
        ],
      },
    })
    stockLocation = result[0]
    created.push(`stock location "${STOCK_LOCATION_NAME}"`)
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: STORE_NAME,
        default_sales_channel_id: salesChannel.id,
        default_region_id: region.id,
        default_location_id: stockLocation.id,
      },
    },
  })

  const {
    data: [locationLinks],
  } = await query.graph({
    entity: "stock_location",
    fields: ["id", "sales_channels.id", "fulfillment_sets.id", "fulfillment_providers.id"],
    filters: { id: stockLocation.id },
  })

  if (!locationLinks?.fulfillment_providers?.some((p) => p?.id === MANUAL_FULFILLMENT_PROVIDER)) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: MANUAL_FULFILLMENT_PROVIDER },
    })
    created.push("manual fulfilment provider link")
  }

  if (!locationLinks?.sales_channels?.some((sc) => sc?.id === salesChannel.id)) {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: stockLocation.id, add: [salesChannel.id] },
    })
    created.push("sales channel ↔ stock location link")
  }

  let [shippingProfile] = await fulfillmentService.listShippingProfiles({ type: "default" })
  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Standard", type: "default" }] },
    })
    shippingProfile = result[0]
    created.push("default shipping profile")
  }

  let [fulfillmentSet] = await fulfillmentService.listFulfillmentSets(
    { name: FULFILLMENT_SET_NAME },
    { relations: ["service_zones"] }
  )
  if (!fulfillmentSet) {
    fulfillmentSet = await fulfillmentService.createFulfillmentSets({
      name: FULFILLMENT_SET_NAME,
      type: "shipping",
      service_zones: [
        { name: SERVICE_ZONE_NAME, geo_zones: [{ type: "country", country_code: COUNTRY }] },
      ],
    })
    created.push(`fulfilment set "${FULFILLMENT_SET_NAME}"`)
  }
  if (!locationLinks?.fulfillment_sets?.some((fs) => fs?.id === fulfillmentSet.id)) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    })
    created.push("fulfilment set ↔ stock location link")
  }

  const serviceZone = fulfillmentSet.service_zones.find((z) => z.name === SERVICE_ZONE_NAME)
  if (!serviceZone) {
    throw new Error(`Service zone "${SERVICE_ZONE_NAME}" missing on fulfilment set.`)
  }

  const existingShipping = await fulfillmentService.listShippingOptions({
    name: SHIPPING_OPTION_NAME,
    service_zone: { id: serviceZone.id },
  })
  if (!existingShipping.length) {
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: SHIPPING_OPTION_NAME,
          price_type: "flat",
          provider_id: MANUAL_FULFILLMENT_PROVIDER,
          service_zone_id: serviceZone.id,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Standard",
            description: "Leverans inom 3–5 arbetsdagar.",
            code: "standard",
          },
          prices: [
            { currency_code: CURRENCY, amount: 495 },
            { region_id: region.id, amount: 495 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
      ],
    })
    created.push(`shipping option "${SHIPPING_OPTION_NAME}"`)
  }

  // --- Publishable API key ---------------------------------------------------
  const {
    data: [existingKey],
  } = await query.graph({
    entity: "api_key",
    fields: ["id", "token", "sales_channels.id"],
    filters: { type: "publishable", title: API_KEY_TITLE, revoked_at: null },
  })
  let apiKey: { id: string; token: string } | undefined = existingKey
  if (!apiKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: { api_keys: [{ title: API_KEY_TITLE, type: "publishable", created_by: "" }] },
    })
    apiKey = result[0]
    created.push(`publishable API key "${API_KEY_TITLE}"`)
  }
  if (!existingKey?.sales_channels?.some((sc) => sc?.id === salesChannel.id)) {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: apiKey.id, add: [salesChannel.id] },
    })
    created.push("API key ↔ sales channel link")
  }

  // --- Products --------------------------------------------------------------
  for (const p of PRODUCTS) {
    const [existing] = await productService.listProducts({ handle: p.handle }, { withDeleted: false })
    if (existing) {
      continue
    }

    // Upload a placeholder image through the File module (local provider →
    // ./static, persisted in the Docker volume).
    const [image] = await fileService.createFiles([
      {
        filename: `${p.handle}.svg`,
        mimeType: "image/svg+xml",
        content: Buffer.from(placeholderSvg(p.title, p.color), "utf8").toString("base64"),
        access: "public",
      },
    ])

    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: p.title,
            subtitle: p.subtitle,
            handle: p.handle,
            description: p.description,
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: shippingProfile.id,
            thumbnail: image.url,
            images: [{ url: image.url }],
            options: [{ title: "Utförande", values: ["Standard"] }],
            variants: [
              {
                title: "Standard",
                sku: p.sku,
                manage_inventory: true,
                options: { Utförande: "Standard" },
                prices: [{ currency_code: CURRENCY, amount: p.price }],
              },
            ],
            sales_channels: [{ id: salesChannel.id }],
          },
        ],
      },
    })
    created.push(`product "${p.title}"`)
  }

  // --- Inventory levels ------------------------------------------------------
  const { data: seededProducts } = await query.graph({
    entity: "product",
    fields: ["handle", "variants.inventory_items.inventory_item_id"],
    filters: { handle: PRODUCTS.map((p) => p.handle) },
  })
  const inventoryItemIds = seededProducts
    .flatMap((prod) => prod.variants ?? [])
    .flatMap((v) => v?.inventory_items ?? [])
    .map((ii) => ii?.inventory_item_id)
    .filter((id): id is string => !!id)

  if (inventoryItemIds.length) {
    const existingLevels = await inventoryService.listInventoryLevels({
      inventory_item_id: inventoryItemIds,
      location_id: stockLocation.id,
    })
    const withLevel = new Set(existingLevels.map((l) => l.inventory_item_id))
    const missing = inventoryItemIds.filter((id) => !withLevel.has(id))
    if (missing.length) {
      await createInventoryLevelsWorkflow(container).run({
        input: {
          inventory_levels: missing.map((inventory_item_id) => ({
            inventory_item_id,
            location_id: stockLocation.id,
            stocked_quantity: 25,
          })),
        },
      })
      created.push(`${missing.length} inventory level(s)`)
    }
  }

  // --- Summary ---------------------------------------------------------------
  if (created.length) {
    logger.info(`Seed created: ${created.join(", ")}`)
  } else {
    logger.info("Seed: everything already present – nothing created.")
  }
  logger.info(`Region "${REGION_NAME}" id: ${region.id}`)
  logger.info(`Publishable API key (set MEDUSA_PUBLISHABLE_KEY in .env): ${apiKey.token}`)
}

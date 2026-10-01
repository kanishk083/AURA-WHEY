const SHIPROCKET_API = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken = '';
let cachedTokenExpiresAt = 0;

function send(res, body, status = 200) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

const PUBLIC_ERROR = 'Unable to check delivery availability right now.';

function safeText(value) {
  return typeof value === 'string'
    ? value.slice(0, 200).replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[redacted-email]').replace(/\b\d{6}\b/g, '[redacted-postcode]')
    : null;
}

function serviceabilityError(category, upstreamStatus = null) {
  const error = new Error(category);
  error.category = category;
  error.upstreamStatus = upstreamStatus;
  return error;
}

function payloadIssue(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return 'invalid_payload';
  if (payload.error || payload.errors || Number(payload.status_code) >= 400) return 'upstream_error_payload';
  return null;
}

async function shiprocketToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) return cachedToken;
  const email = process.env.SHIPROCKET_API_EMAIL;
  const password = process.env.SHIPROCKET_API_PASSWORD;
  if (!email || !password) throw new Error('Shipping service is not configured.');

  const response = await fetch(`${SHIPROCKET_API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.token) throw new Error('Shipping service authentication failed.');

  cachedToken = payload.token;
  // Shiprocket tokens last 10 days; refresh a little early.
  cachedTokenExpiresAt = Date.now() + (9 * 24 * 60 * 60 * 1000);
  return cachedToken;
}

function inspectCouriers(payload) {
  const issue = payloadIssue(payload);
  const couriers = payload?.data?.available_courier_companies;
  const courierCompaniesType = Array.isArray(couriers) ? 'array' : couriers === null ? 'null' : typeof couriers;
  if (issue || !payload.data || typeof payload.data !== 'object' || !Array.isArray(couriers)) {
    return { issue: issue || 'invalid_serviceability_structure', courierCompaniesType };
  }

  const blockedCount = couriers.filter(courier => Boolean(courier?.blocked)).length;
  const pickupUnavailableCount = couriers.filter(courier => String(courier?.pickup_availability) === '0').length;
  const eligible = couriers.filter(courier => courier && !courier.blocked && String(courier.pickup_availability) !== '0');
  const courier = eligible.sort((a, b) => {
    const aDays = Number(a.estimated_delivery_days) || Number.POSITIVE_INFINITY;
    const bDays = Number(b.estimated_delivery_days) || Number.POSITIVE_INFINITY;
    return aDays - bDays;
  })[0] || null;
  return { courier, courierCompaniesType, courierCompaniesCount: couriers.length, eligibleCourierCount: eligible.length, blockedCount, pickupUnavailableCount };
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return send(response, { message: 'Method not allowed.' }, 405);

  let input;
  try { input = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {}); } catch {
    return send(response, { status: 'error', available: null, message: 'Invalid request.' }, 400);
  }

  const deliveryPostcode = String(input.pincode || '').trim();
  if (!/^\d{6}$/.test(deliveryPostcode)) return send(response, { status: 'error', available: null, message: 'Enter a valid 6-digit pincode.' }, 400);

  const pickupPostcode = String(process.env.SHIPROCKET_PICKUP_POSTCODE || '410221');
  const quantity = Math.max(1, Math.min(20, Number(input.quantity) || 1));
  const packageWeight = Number(process.env.SHIPROCKET_WEIGHT_KG || '2.4');
  const weight = Math.max(0.1, packageWeight * quantity);
  const params = new URLSearchParams({
    pickup_postcode: pickupPostcode,
    delivery_postcode: deliveryPostcode,
    cod: '0',
    weight: String(weight),
    length: String(process.env.SHIPROCKET_LENGTH_CM || '30'),
    breadth: String(process.env.SHIPROCKET_BREADTH_CM || '20'),
    height: String(process.env.SHIPROCKET_HEIGHT_CM || '20'),
  });

  try {
    const token = await shiprocketToken();
    const upstream = await fetch(`${SHIPROCKET_API}/courier/serviceability/?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    let payload;
    try { payload = await upstream.json(); } catch { throw serviceabilityError('invalid_json', upstream.status); }
    if (!upstream.ok) throw serviceabilityError('upstream_http_error', upstream.status);

    const inspection = inspectCouriers(payload);
    const diagnostic = {
      operation: 'shiprocket-serviceability',
      upstreamStatus: upstream.status,
      hasData: Boolean(payload?.data),
      courierCompaniesType: inspection.courierCompaniesType,
      courierCompaniesCount: inspection.courierCompaniesCount ?? null,
      eligibleCourierCount: inspection.eligibleCourierCount ?? null,
      blockedCount: inspection.blockedCount ?? null,
      pickupUnavailableCount: inspection.pickupUnavailableCount ?? null,
      upstreamStatusCode: typeof payload?.status_code === 'number' ? payload.status_code : null,
      upstreamMessage: safeText(payload?.message),
      upstreamError: safeText(payload?.error),
      issue: inspection.issue || null,
    };
    if (inspection.issue) {
      console.error('[shipping:shiprocket]', diagnostic);
      return send(response, { status: 'error', available: null, message: PUBLIC_ERROR }, 502);
    }
    console.info('[shipping:shiprocket]', diagnostic);
    const courier = inspection.courier;
    if (!courier) return send(response, { status: 'unserviceable', available: false, codAvailable: false, message: 'Delivery is not available for this pincode.' });

    const eta = courier.estimated_delivery_days ? `${courier.estimated_delivery_days} day${Number(courier.estimated_delivery_days) === 1 ? '' : 's'}` : '';
    return send(response, {
      status: 'serviceable',
      available: true,
      codAvailable: Boolean(courier.cod),
      eta,
      message: `Delivery available${eta ? `. Estimated delivery in ${eta}` : ''}.`,
    });
  } catch (error) {
    console.error('[shipping:shiprocket]', {
      operation: 'shiprocket-serviceability',
      upstreamStatus: Number.isInteger(error?.upstreamStatus) ? error.upstreamStatus : null,
      category: error?.category || (error?.message === 'Shipping service is not configured.'
        ? 'configuration_error'
        : error?.message === 'Shipping service authentication failed.' ? 'authentication_error' : 'network_error'),
    });
    return send(response, { status: 'error', available: null, message: PUBLIC_ERROR }, 502);
  }
}
